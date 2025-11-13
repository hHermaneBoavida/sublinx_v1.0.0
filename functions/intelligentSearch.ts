import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, userLocation } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return Response.json({
        query: query,
        detected_type: "empty",
        results: [],
        suggestions: ["Digite algo para buscar eventos, artistas ou locais"]
      });
    }

    // NOVO: Normalizar query (correção de typos)
    const normalizedQuery = normalizeQuery(query);

    // 1. BATCH FETCH - 3 requests paralelos
    const [events, users, communities] = await Promise.all([
      base44.asServiceRole.entities.Event.list('-date', 100),
      base44.asServiceRole.entities.User.filter({ is_organizer: true }, '', 50),
      base44.asServiceRole.entities.Community.list('', 50)
    ]);

    // 2. LLM PARA CLASSIFICAR
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: buildLLMPrompt(normalizedQuery, userLocation),
      add_context_from_internet: false,
      response_json_schema: getLLMSchema()
    });

    const { detected_type, entities, search_intent } = llmResponse;

    // 3. FUZZY SEARCH nos dados
    let relevantEvents = fuzzyFilterEvents(events, normalizedQuery, entities);
    const relevantUsers = fuzzyFilterUsers(users, normalizedQuery, entities);
    const relevantCommunities = fuzzyFilterCommunities(communities, normalizedQuery, entities);

    // 4. CALCULAR DISTÂNCIA E ENRIQUECER
    if (userLocation?.lat && userLocation?.lng) {
      relevantEvents = relevantEvents.map(event => ({
        ...event,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          event.location?.lat,
          event.location?.lng
        ),
        _score: calculateRelevanceScore(event, normalizedQuery, entities, userLocation)
      }));
    } else {
      relevantEvents = relevantEvents.map(event => ({
        ...event,
        _score: calculateRelevanceScore(event, normalizedQuery, entities, null)
      }));
    }

    // Ordenar por relevância (score)
    relevantEvents.sort((a, b) => (b._score || 0) - (a._score || 0));

    // 5. MONTAR RESULTADOS
    const results = [];

    // EVENTOS (top 15)
    relevantEvents.slice(0, 15).forEach(event => {
      results.push({
        type: "event",
        id: event.id,
        name: event.title,
        description: event.description?.substring(0, 100),
        location: `${event.location?.venue_name || ''}, ${event.location?.city || ''}`.trim(),
        genre: event.genre,
        date: event.date,
        distance: event.distance ? `${event.distance.toFixed(1)} km` : null,
        image_url: event.image_url,
        organizer: event.organizer,
        price: event.price || event.ticket_types?.[0]?.price || 0,
        current_attendees: event.current_attendees || 0,
        max_capacity: event.max_capacity || 0,
        _fuzzyScore: event._fuzzyScore,
        _score: event._score,
        link: `/event/${event.id}`
      });
    });

    // ARTISTAS (se relevante)
    if (detected_type === 'artist' || entities.artist || relevantUsers.length > 0) {
      relevantUsers.slice(0, 5).forEach(u => {
        const nextEvent = events.find(e => 
          e.organizer_id === u.id && new Date(e.date) > new Date()
        );
        
        results.push({
          type: "artist",
          id: u.id,
          name: u.full_name,
          avatar: u.avatar_url,
          genre: u.music_preferences?.join(', ') || 'Variados',
          next_show: nextEvent?.date || null,
          next_show_name: nextEvent?.title || null,
          _fuzzyScore: u._fuzzyScore,
          link: `/artist/${u.id}`
        });
      });
    }

    // COMUNIDADES
    if (detected_type === 'venue' || detected_type === 'community' || relevantCommunities.length > 0) {
      relevantCommunities.slice(0, 5).forEach(c => {
        results.push({
          type: "community",
          id: c.id,
          name: c.name,
          description: c.description?.substring(0, 100),
          type_label: c.type,
          member_count: c.member_count || 0,
          image: c.cover_image_url,
          _fuzzyScore: c._fuzzyScore,
          link: `/community/${c.id}`
        });
      });
    }

    // 6. SUGESTÕES INTELIGENTES
    const suggestions = generateSuggestions(results, normalizedQuery, query);

    return Response.json({
      query,
      normalized_query: normalizedQuery !== query.toLowerCase() ? normalizedQuery : null,
      detected_type,
      search_intent,
      entities,
      results,
      suggestions,
      total_results: results.length
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ 
      error: error.message,
      query: '',
      detected_type: 'error',
      results: [],
      suggestions: ['Erro no servidor. Tente novamente.']
    }, { status: 500 });
  }
});

// ============================================
// FUZZY SEARCH HELPERS
// ============================================

function levenshteinDistance(s1, s2) {
  const len1 = s1.length, len2 = s2.length;
  const matrix = Array.from({ length: len1 + 1 }, (_, i) => [i]);
  
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[len1][len2];
}

function fuzzyMatch(query, target, threshold = 0.6) {
  if (!query || !target) return 0;
  
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  if (t.includes(q)) return 0.95;
  if (q.includes(t)) return 0.9;
  
  const maxLen = Math.max(q.length, t.length);
  const distance = levenshteinDistance(q, t);
  const score = 1 - (distance / maxLen);
  
  return score >= threshold ? score : 0;
}

function normalizeQuery(query) {
  const corrections = {
    'sp': 'são paulo', 'sampa': 'são paulo',
    'rj': 'rio de janeiro', 'rio': 'rio de janeiro',
    'bh': 'belo horizonte', 'poa': 'porto alegre',
    'tekno': 'techno', 'eletronica': 'electronic',
    'rolê': 'evento', 'role': 'evento', 'balada': 'evento',
    'after': 'evento', 'anita': 'anitta'
  };
  
  let normalized = query.toLowerCase().trim();
  Object.entries(corrections).forEach(([typo, correct]) => {
    normalized = normalized.replace(new RegExp(`\\b${typo}\\b`, 'gi'), correct);
  });
  
  return normalized;
}

// ============================================
// SCORING E RANKING
// ============================================

function calculateRelevanceScore(event, query, entities, userLocation) {
  let score = 0;

  // Peso 1: Match no título (40 pontos)
  const titleScore = fuzzyMatch(query, event.title || '', 0.5);
  score += titleScore * 40;

  // Peso 2: Match no gênero (25 pontos)
  if (entities.genre && event.genre) {
    const genreScore = fuzzyMatch(entities.genre, event.genre, 0.6);
    score += genreScore * 25;
  }

  // Peso 3: Match na descrição (15 pontos)
  if (event.description) {
    const descScore = fuzzyMatch(query, event.description, 0.4);
    score += descScore * 15;
  }

  // Peso 4: Proximidade (20 pontos)
  if (userLocation && event.distance) {
    const distanceScore = Math.max(0, 1 - (event.distance / 50)); // 50km = 0 score
    score += distanceScore * 20;
  }

  // Peso 5: Popularidade (10 pontos)
  if (event.current_attendees && event.max_capacity) {
    const popularityScore = event.current_attendees / event.max_capacity;
    score += popularityScore * 10;
  }

  // Peso 6: Evento em breve (+5 bonus)
  const daysUntil = (new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24);
  if (daysUntil >= 0 && daysUntil <= 7) {
    score += 5;
  }

  return score;
}

// ============================================
// FILTROS COM FUZZY MATCHING
// ============================================

function fuzzyFilterEvents(events, query, entities) {
  const now = new Date();
  
  return events
    .filter(e => e && e.title && new Date(e.date) > now)
    .map(event => {
      const scores = [];
      
      // Score título
      scores.push(fuzzyMatch(query, event.title || '', 0.5));
      
      // Score gênero
      if (entities.genre && event.genre) {
        scores.push(fuzzyMatch(entities.genre, event.genre, 0.6));
      }
      
      // Score descrição
      if (event.description) {
        scores.push(fuzzyMatch(query, event.description, 0.4));
      }
      
      // Score venue
      if (event.location?.venue_name) {
        scores.push(fuzzyMatch(query, event.location.venue_name, 0.5));
      }
      
      const maxScore = Math.max(...scores);
      
      return {
        ...event,
        _fuzzyScore: maxScore
      };
    })
    .filter(e => e._fuzzyScore > 0);
}

function fuzzyFilterUsers(users, query, entities) {
  const artistQuery = entities.artist || query;
  
  return users
    .map(u => ({
      ...u,
      _fuzzyScore: fuzzyMatch(artistQuery, u.full_name || '', 0.6)
    }))
    .filter(u => u._fuzzyScore > 0)
    .sort((a, b) => b._fuzzyScore - a._fuzzyScore);
}

function fuzzyFilterCommunities(communities, query, entities) {
  const venueQuery = entities.venue || query;
  
  return communities
    .map(c => {
      const nameScore = fuzzyMatch(venueQuery, c.name || '', 0.6);
      const descScore = c.description ? fuzzyMatch(query, c.description, 0.4) : 0;
      
      return {
        ...c,
        _fuzzyScore: Math.max(nameScore, descScore)
      };
    })
    .filter(c => c._fuzzyScore > 0)
    .sort((a, b) => b._fuzzyScore - a._fuzzyScore);
}

// ============================================
// LLM HELPERS
// ============================================

function buildLLMPrompt(query, userLocation) {
  return `
Você é o motor de busca do SUBLINX.

**Query:** "${query}"
**Localização:** ${userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'não informada'}

**Classifique em:** city, venue, event, artist, genre, vibe, mixed

**Extraia entidades:**
- Cidade (São Paulo, Rio, BH)
- Gênero musical (techno, house, funk, trap)
- Artista (DJs/bandas)
- Local (casas noturnas)
- Vibe (dançar, relaxar, adrenalina)
- Data (hoje, amanhã, fim de semana)

**Corrija typos:** sp→São Paulo, tekno→techno, anita→anitta

**JSON:**
{
  "detected_type": "string",
  "entities": {
    "city": "string ou null",
    "genre": "string ou null",
    "artist": "string ou null",
    "venue": "string ou null",
    "vibe": [],
    "date_context": "string ou null"
  },
  "search_intent": "descrição"
}`;
}

function getLLMSchema() {
  return {
    type: "object",
    properties: {
      detected_type: { type: "string" },
      entities: {
        type: "object",
        properties: {
          city: { type: ["string", "null"] },
          genre: { type: ["string", "null"] },
          artist: { type: ["string", "null"] },
          venue: { type: ["string", "null"] },
          vibe: { type: "array", items: { type: "string" } },
          date_context: { type: ["string", "null"] }
        }
      },
      search_intent: { type: "string" }
    }
  };
}

function generateSuggestions(results, normalizedQuery, originalQuery) {
  if (results.length > 0) return [];
  
  const suggestions = [
    "Tente usar o nome do gênero (techno, house, trap)",
    "Busque por cidade (São Paulo, Rio, Belo Horizonte)",
    "Procure por nome de DJ ou artista",
    "Use termos temporais (hoje, amanhã, fim de semana)"
  ];
  
  // Se houve correção, sugerir
  if (normalizedQuery !== originalQuery.toLowerCase()) {
    suggestions.unshift(`💡 Buscando por: "${normalizedQuery}"`);
  }
  
  return suggestions;
}

// ============================================
// UTILS
// ============================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}