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

  // REGRA 1: Maturidade do usuário afeta revelação
  if (userState.maturity_level === 'nascent') {
    // Usuários novos vêem menos eventos especializados
    if (event.minimum_level > 2) visibilityScore -= 0.3;
    rules.push({ rule: 'new_user_filter', impact: -0.3 });
  } else if (userState.maturity_level === 'mature') {
    // Usuários maduros têm acesso a mais conteúdo
    visibilityScore += 0.2;
    rules.push({ rule: 'mature_user_boost', impact: 0.2 });
  }

  // REGRA 2: Confiança no estado afeta peso
  visibilityScore *= userState.confidence_level;
  rules.push({ rule: 'confidence_weight', multiplier: userState.confidence_level });

  // REGRA 3: Similaridade com criador do evento
  if (eventOwnerState) {
    const similarity = calculateResonanceSimilarity(userState, eventOwnerState);
    if (similarity > 0.7) {
      visibilityScore += 0.3;
      rules.push({ rule: 'high_resonance_match', impact: 0.3, similarity });
    } else if (similarity < 0.3) {
      visibilityScore -= 0.2;
      rules.push({ rule: 'low_resonance_match', impact: -0.2, similarity });
    }
  }

  // REGRA 4: Saturação temporal (não mostrar tudo de uma vez)
  if (context.recentlyViewed?.includes(event.genre)) {
    visibilityScore -= 0.15;
    rules.push({ rule: 'genre_saturation', impact: -0.15 });
  }

  // REGRA 5: Efeito de ausência (cooldown aumenta interesse)
  if (context.daysSinceLastView > 3) {
    visibilityScore += 0.1;
    rules.push({ rule: 'absence_boost', impact: 0.1 });
  }

  // REGRA 6: Eventos secretos requerem maturidade
  if (event.is_secret && userState.maturity_level === 'nascent') {
    visibilityScore = 0;
    rules.push({ rule: 'secret_access_denied', impact: 'block' });
  }

  // Normalizar score entre 0 e 1
  visibilityScore = Math.max(0, Math.min(1, visibilityScore));

  return {
    visible: visibilityScore > 0.3, // Threshold de visibilidade
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