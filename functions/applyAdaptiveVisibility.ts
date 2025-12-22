import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Calcula similaridade entre dois vetores de ressonância
function calculateResonanceSimilarity(stateA, stateB) {
  if (!stateA?.state_vector || !stateB?.state_vector) return 0;

  let similarity = 0;
  let dimensions = 0;

  // Similaridade temporal (padrões de horário)
  if (stateA.state_vector.temporal_patterns && stateB.state_vector.temporal_patterns) {
    const dotProduct = stateA.state_vector.temporal_patterns.reduce((sum, val, i) => 
      sum + (val * (stateB.state_vector.temporal_patterns[i] || 0)), 0
    );
    similarity += dotProduct;
    dimensions++;
  }

  // Similaridade de afinidade de conteúdo
  if (stateA.state_vector.content_affinity && stateB.state_vector.content_affinity) {
    const genres = new Set([
      ...Object.keys(stateA.state_vector.content_affinity),
      ...Object.keys(stateB.state_vector.content_affinity)
    ]);
    
    let affinityMatch = 0;
    for (const genre of genres) {
      const valA = stateA.state_vector.content_affinity[genre] || 0;
      const valB = stateB.state_vector.content_affinity[genre] || 0;
      affinityMatch += Math.min(valA, valB);
    }
    similarity += affinityMatch / genres.size;
    dimensions++;
  }

  // Similaridade de profundidade de interação
  if (typeof stateA.state_vector.interaction_depth === 'number' && 
      typeof stateB.state_vector.interaction_depth === 'number') {
    const diff = Math.abs(stateA.state_vector.interaction_depth - stateB.state_vector.interaction_depth);
    similarity += (1 - diff);
    dimensions++;
  }

  return dimensions > 0 ? similarity / dimensions : 0;
}

// Determina visibilidade de um evento para um usuário
function determineVisibility(event, userState, eventOwnerState, context = {}) {
  const rules = [];
  let visibilityScore = 0.5; // Base neutra

  // VARIÂNCIA ALEATÓRIA: Adiciona ruído para evitar previsibilidade (±10%)
  const randomVariance = (Math.random() - 0.5) * 0.2;
  visibilityScore += randomVariance;
  rules.push({ rule: 'random_variance', impact: randomVariance });

  // REGRA 1: Maturidade do usuário afeta revelação
  if (userState.maturity_level === 'nascent') {
    // CORREÇÃO: Discovery boost para iniciantes + penalidade reduzida
    visibilityScore += 0.1;
    rules.push({ rule: 'discovery_boost', impact: 0.1 });
    
    if (event.minimum_level > 3) {
      visibilityScore -= 0.15; // Reduzido de -0.3
      rules.push({ rule: 'new_user_filter', impact: -0.15 });
    }
  } else if (userState.maturity_level === 'mature') {
    visibilityScore += 0.2;
    rules.push({ rule: 'mature_user_boost', impact: 0.2 });
  }

  // REGRA 2: Confiança no estado afeta peso (não-linear para evitar loops)
  const confidenceWeight = Math.pow(userState.confidence_level, 1.2);
  visibilityScore *= confidenceWeight;
  rules.push({ rule: 'confidence_weight', multiplier: confidenceWeight });

  // REGRA 3: Similaridade com criador (anti-echo chamber sutil)
  if (eventOwnerState) {
    const similarity = calculateResonanceSimilarity(userState, eventOwnerState);
    
    // CORREÇÃO: Penalidade gradual e mais sutil para alta similaridade
    if (similarity > 0.95) {
      const penalty = -0.05 * (similarity - 0.95) * 10; // Penalidade suave
      visibilityScore += penalty;
      rules.push({ rule: 'anti_echo_chamber_subtle', impact: penalty, similarity });
    } else if (similarity > 0.6 && similarity <= 0.95) {
      visibilityScore += 0.25;
      rules.push({ rule: 'resonance_match', impact: 0.25, similarity });
    } else if (similarity < 0.25) {
      // Ocasionalmente mostrar conteúdo divergente (15% chance)
      if (Math.random() < 0.15) {
        visibilityScore += 0.2;
        rules.push({ rule: 'serendipity_boost', impact: 0.2 });
      }
    }
  }

  // REGRA 4: Saturação temporal adaptativa
  const genreSaturation = context.recentlyViewed?.filter(g => g === event.genre).length || 0;
  if (genreSaturation > 2) {
    visibilityScore -= 0.2 * (genreSaturation / 5);
    rules.push({ rule: 'genre_saturation', impact: -0.2, count: genreSaturation });
  }

  // REGRA 5: Efeito de ausência (não-linear)
  if (context.daysSinceLastView > 3) {
    const absenceBoost = Math.min(0.25, Math.log(context.daysSinceLastView) * 0.1);
    visibilityScore += absenceBoost;
    rules.push({ rule: 'absence_boost', impact: absenceBoost });
  }

  // REGRA 6: Convite silencioso para eventos secretos
  if (event.is_secret) {
    const secretUnlockThreshold = context.secretSignalCount || 0;
    const genreMatch = context.primaryGenre === event.genre;
    const organizerFamiliarity = context.organizerFrequency || 0;
    
    // Sistema de convite silencioso: múltiplos critérios
    let unlockScore = 0;
    
    // Critério 1: Sinais suficientes no gênero (10+)
    if (genreMatch && secretUnlockThreshold >= 10) unlockScore += 0.3;
    
    // Critério 2: Familiaridade com organizador (3+ eventos)
    if (organizerFamiliarity >= 3) unlockScore += 0.25;
    
    // Critério 3: Maturidade estabelecida
    if (userState.maturity_level === 'established' || userState.maturity_level === 'mature') {
      unlockScore += 0.2;
    }
    
    // Critério 4: Alta confiança no estado
    if (userState.confidence_level > 0.7) unlockScore += 0.15;
    
    // Se não atingiu threshold de unlock, bloquear
    if (unlockScore < 0.5) {
      visibilityScore = 0;
      rules.push({ rule: 'secret_access_locked', impact: 'block', unlock_score: unlockScore });
    } else {
      // Desbloqueado silenciosamente
      visibilityScore += 0.3;
      rules.push({ rule: 'secret_unlocked_silently', impact: 0.3, unlock_score: unlockScore });
    }
  }

  // REGRA 7: Anti-padrão de abandono recorrente
  if (context.purchaseAbandonmentCount > 3 && event.requires_approval) {
    visibilityScore -= 0.15;
    rules.push({ rule: 'abandonment_penalty', impact: -0.15 });
  }

  // REGRA 8: Boost para organizadores frequentes (mas com decay)
  if (context.organizerFrequency > 2) {
    const boost = Math.min(0.2, 0.1 * Math.log(context.organizerFrequency));
    visibilityScore += boost;
    rules.push({ rule: 'organizer_affinity', impact: boost });
  }

  // Normalizar score entre 0 e 1
  visibilityScore = Math.max(0, Math.min(1, visibilityScore));

  // Threshold dinâmico baseado em maturidade
  const threshold = userState.maturity_level === 'nascent' ? 0.4 : 0.3;

  return {
    visible: visibilityScore > threshold,
    score: visibilityScore,
    level: visibilityScore > 0.7 ? 'high' : visibilityScore > 0.4 ? 'medium' : 'low',
    rules: rules
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventIds, context } = await req.json();

    if (!eventIds || eventIds.length === 0) {
      return Response.json({ 
        filteredEvents: [],
        metadata: { reason: 'no_events_provided' }
      });
    }

    // Buscar estado de ressonância do usuário
    const userStates = await base44.asServiceRole.entities.UserResonanceState.filter({
      user_id: user.id
    });

    if (userStates.length === 0) {
      // Usuário sem estado = mostrar tudo (modo descoberta inicial)
      return Response.json({ 
        filteredEvents: eventIds.map(id => ({ event_id: id, visible: true, level: 'medium' })),
        metadata: { reason: 'no_user_state', mode: 'discovery' }
      });
    }

    const userState = userStates[0];

    // Buscar eventos
    const events = await base44.asServiceRole.entities.Event.filter({
      id: { $in: eventIds }
    });

    // Buscar estados dos organizadores
    const organizerIds = [...new Set(events.map(e => e.organizer_id))];
    const organizerStates = await base44.asServiceRole.entities.UserResonanceState.filter({
      user_id: { $in: organizerIds }
    });

    const organizerStatesMap = new Map();
    for (const state of organizerStates) {
      organizerStatesMap.set(state.user_id, state);
    }

    // Aplicar lógica de visibilidade
    const results = events.map(event => {
      const organizerState = organizerStatesMap.get(event.organizer_id);
      const visibility = determineVisibility(event, userState, organizerState, context || {});
      
      return {
        event_id: event.id,
        visible: visibility.visible,
        score: visibility.score,
        level: visibility.level,
        rules_applied: visibility.rules
      };
    });

    // Filtrar apenas eventos visíveis
    const visibleEvents = results.filter(r => r.visible);

    // Ordenar por score de visibilidade (maior primeiro)
    visibleEvents.sort((a, b) => b.score - a.score);

    return Response.json({
      filteredEvents: visibleEvents,
      metadata: {
        total_evaluated: eventIds.length,
        visible_count: visibleEvents.length,
        user_maturity: userState.maturity_level,
        user_confidence: userState.confidence_level
      }
    });

  } catch (error) {
    console.error('Erro ao aplicar visibilidade adaptativa:', error);
    return Response.json({ 
      error: error.message,
      filteredEvents: [],
      metadata: { error: true }
    }, { status: 500 });
  }
});