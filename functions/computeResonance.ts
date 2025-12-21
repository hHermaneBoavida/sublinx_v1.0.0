import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Constantes do sistema
const DECAY_FACTOR = 0.95;
const MIN_SIGNALS_FOR_CONFIDENCE = 10;
const TEMPORAL_WEIGHT_HOURS = 168; // 1 semana

// Calcula decay temporal baseado na idade do sinal
function calculateTemporalDecay(signalDate) {
  const now = new Date();
  const age = (now - new Date(signalDate)) / (1000 * 60 * 60); // horas
  return Math.pow(DECAY_FACTOR, age / TEMPORAL_WEIGHT_HOURS);
}

// Extrai dimensões de comportamento dos sinais
function extractBehavioralDimensions(signals) {
  const dimensions = {
    temporal_patterns: new Array(24).fill(0), // distribuição horária
    content_affinity: {}, // por gênero/tipo
    interaction_depth: 0,
    recurrence_score: 0,
    silent_consumption_ratio: 0
  };

  let totalWeight = 0;
  let silentCount = 0;
  const eventVisits = new Map();

  for (const signal of signals) {
    const decay = calculateTemporalDecay(signal.created_date);
    const weight = (signal.weight || 1.0) * decay;
    totalWeight += weight;

    // Padrão temporal
    if (signal.context?.time_of_day) {
      const hour = parseInt(signal.context.time_of_day.split(':')[0]);
      dimensions.temporal_patterns[hour] += weight;
    }

    // Afinidade de conteúdo
    if (signal.context?.genre) {
      dimensions.content_affinity[signal.context.genre] = 
        (dimensions.content_affinity[signal.context.genre] || 0) + weight;
    }

    // Profundidade de interação
    if (signal.signal_type === 'interaction_depth') {
      dimensions.interaction_depth += weight * (signal.context?.scroll_depth || 0);
    }

    // Consumo silencioso
    if (signal.signal_type === 'silent_consumption') {
      silentCount += weight;
    }

    // Recorrência
    if (signal.context?.event_id) {
      const visits = eventVisits.get(signal.context.event_id) || 0;
      eventVisits.set(signal.context.event_id, visits + 1);
    }
  }

  // Normalizar temporal_patterns
  const maxTemporal = Math.max(...dimensions.temporal_patterns);
  if (maxTemporal > 0) {
    dimensions.temporal_patterns = dimensions.temporal_patterns.map(v => v / maxTemporal);
  }

  // Calcular recurrence_score
  let recurrenceSum = 0;
  for (const visits of eventVisits.values()) {
    if (visits > 1) recurrenceSum += visits - 1;
  }
  dimensions.recurrence_score = recurrenceSum / signals.length;

  // Silent consumption ratio
  dimensions.silent_consumption_ratio = totalWeight > 0 ? silentCount / totalWeight : 0;

  // Normalizar interaction_depth
  dimensions.interaction_depth = totalWeight > 0 ? dimensions.interaction_depth / totalWeight : 0;

  // Converter content_affinity em array normalizado
  const affinityValues = Object.values(dimensions.content_affinity);
  const maxAffinity = Math.max(...affinityValues, 1);
  dimensions.content_affinity = affinityValues.map(v => v / maxAffinity);

  return dimensions;
}

// Calcula confiança baseada em quantidade e distribuição de sinais
function calculateConfidence(signalCount, signalDistribution) {
  if (signalCount < MIN_SIGNALS_FOR_CONFIDENCE) {
    return signalCount / MIN_SIGNALS_FOR_CONFIDENCE;
  }

  // Confiança cresce logaritmicamente após o mínimo
  const baseConfidence = Math.min(1.0, 0.5 + Math.log10(signalCount / MIN_SIGNALS_FOR_CONFIDENCE) * 0.2);
  
  // Penaliza se todos os sinais são do mesmo tipo
  const diversityBonus = Math.min(signalDistribution.size / 5, 1.0) * 0.2;
  
  return Math.min(baseConfidence + diversityBonus, 1.0);
}

// Determina nível de maturidade
function determinateMaturityLevel(signalCount, daysSinceFirst) {
  if (signalCount < 5 || daysSinceFirst < 1) return 'nascent';
  if (signalCount < 20 || daysSinceFirst < 7) return 'developing';
  if (signalCount < 50 || daysSinceFirst < 14) return 'established';
  return 'mature';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, recomputeAll } = await req.json();
    const targetUserId = userId || user.id;

    // Buscar sinais do usuário (últimos 90 dias)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const signals = await base44.asServiceRole.entities.UserBehaviorSignal.filter(
      { 
        user_id: targetUserId,
        created_date: { $gte: ninetyDaysAgo }
      },
      '-created_date',
      1000
    );

    if (signals.length === 0) {
      return Response.json({
        state: null,
        message: 'Insufficient data for resonance computation'
      });
    }

    // Extrair dimensões comportamentais
    const dimensions = extractBehavioralDimensions(signals);

    // Calcular confiança
    const signalTypes = new Set(signals.map(s => s.signal_type));
    const confidence = calculateConfidence(signals.length, signalTypes);

    // Determinar maturidade
    const firstSignalDate = new Date(signals[signals.length - 1].created_date);
    const daysSinceFirst = (Date.now() - firstSignalDate) / (1000 * 60 * 60 * 24);
    const maturity = determinateMaturityLevel(signals.length, daysSinceFirst);

    // Criar ou atualizar estado de ressonância
    const existingStates = await base44.asServiceRole.entities.UserResonanceState.filter({
      user_id: targetUserId
    });

    const stateData = {
      user_id: targetUserId,
      state_vector: {
        temporal_patterns: dimensions.temporal_patterns,
        content_affinity: dimensions.content_affinity,
        interaction_depth: dimensions.interaction_depth,
        recurrence_score: dimensions.recurrence_score,
        silent_consumption_ratio: dimensions.silent_consumption_ratio
      },
      confidence_level: confidence,
      last_computed: new Date().toISOString(),
      signal_count: signals.length,
      maturity_level: maturity
    };

    let resonanceState;
    if (existingStates.length > 0) {
      resonanceState = await base44.asServiceRole.entities.UserResonanceState.update(
        existingStates[0].id,
        stateData
      );
    } else {
      resonanceState = await base44.asServiceRole.entities.UserResonanceState.create(stateData);
    }

    return Response.json({
      success: true,
      state: resonanceState,
      metrics: {
        signals_processed: signals.length,
        confidence: confidence,
        maturity: maturity,
        days_since_first: Math.floor(daysSinceFirst)
      }
    });

  } catch (error) {
    console.error('Erro ao computar ressonância:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});