import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse do body
    const { query, userLocation } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return Response.json({
        query: query,
        detected_type: "empty",
        results: [],
        suggestions: ["Digite algo para buscar eventos, artistas ou locais"]
      });
    }

    // 1. BUSCAR DADOS EM BATCH (otimizado)
    const [events, users, communities] = await Promise.all([
      base44.asServiceRole.entities.Event.list('-date', 100),
      base44.asServiceRole.entities.User.filter({ 
        is_organizer: true 
      }, '', 50),
      base44.asServiceRole.entities.Community.list('', 50)
    ]);

    // 2. USAR LLM PARA CLASSIFICAR
    const llmPrompt = `
Você é o motor de busca do SUBLINX.

**Query:** "${query}"
**Localização:** ${userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'não informada'}

**Classifique em:** city, venue, event, artist, genre, vibe, mixed

**Extraia entidades:**
- Cidade (SP=São Paulo, RJ=Rio, BH=Belo Horizonte)
- Gênero (techno, house, funk, trap, etc)
- Artista (nomes de DJs/bandas)
- Local (nome de casa noturna)
- Vibe (dançar, relaxar, adrenalina)
- Data (hoje, amanhã, fim de semana)

**Gírias:** rolê=evento, after=festa tarde, balada=evento

**Retorne JSON:**
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
  "search_intent": "descrição curta"
}`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      add_context_from_internet: false,
      response_json_schema: {
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
      }
    });

    const { detected_type, entities, search_intent } = llmResponse;

    // 3. FILTRAR EVENTOS (otimizado)
    let relevantEvents = filterEvents(events, query, entities);

    // 4. CALCULAR DISTÂNCIA E ORDENAR
    if (userLocation && userLocation.lat && userLocation.lng) {
      relevantEvents = relevantEvents
        .map(event => ({
          ...event,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.location?.lat,
            event.location?.lng
          )
        }))
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // 5. MONTAR RESULTADOS
    const results = [];

    // EVENTOS (top 10)
    relevantEvents.slice(0, 10).forEach(event => {
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
        link: `/event/${event.id}`
      });
    });

    // ARTISTAS (se relevante)
    if (detected_type === 'artist' || entities.artist) {
      const relevantUsers = filterUsers(users, query, entities);
      
      relevantUsers.slice(0, 5).forEach(u => {
        const nextEvent = events.find(e => 
          e.organizer_id === u.id && 
          new Date(e.date) > new Date()
        );
        
        results.push({
          type: "artist",
          id: u.id,
          name: u.full_name,
          avatar: u.avatar_url,
          genre: u.music_preferences?.join(', ') || 'Variados',
          next_show: nextEvent?.date || null,
          next_show_name: nextEvent?.title || null,
          link: `/artist/${u.id}`
        });
      });
    }

    // COMUNIDADES/VENUES
    if (detected_type === 'venue' || detected_type === 'community' || entities.venue) {
      const relevantCommunities = filterCommunities(communities, query, entities);
      
      relevantCommunities.slice(0, 5).forEach(c => {
        results.push({
          type: "community",
          id: c.id,
          name: c.name,
          description: c.description?.substring(0, 100),
          type_label: c.type,
          member_count: c.member_count || 0,
          image: c.cover_image_url,
          link: `/community/${c.id}`
        });
      });
    }

    // 6. SUGESTÕES
    const suggestions = results.length === 0 ? [
      "Tente buscar por gênero (techno, house, trap)",
      "Busque por cidade (São Paulo, Rio, BH)",
      "Procure artistas ou DJs",
      "Use 'hoje', 'amanhã' ou 'fim de semana'"
    ] : [];

    return Response.json({
      query,
      detected_type,
      search_intent,
      entities,
      results,
      suggestions,
      total_results: results.length
    });

  } catch (error) {
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
// FUNÇÕES AUXILIARES (centralizadas)
// ============================================

function filterEvents(events, query, entities) {
  const queryLower = query.toLowerCase();
  
  return events.filter(event => {
    if (!event || !event.title) return false;
    
    // Apenas futuros
    if (new Date(event.date) < new Date()) return false;

    // Match cidade
    if (entities.city) {
      const cityMatch = 
        event.location?.city?.toLowerCase().includes(entities.city.toLowerCase()) ||
        event.location?.address?.toLowerCase().includes(entities.city.toLowerCase());
      if (!cityMatch) return false;
    }

    // Match gênero
    if (entities.genre) {
      if (!event.genre?.toLowerCase().includes(entities.genre.toLowerCase())) {
        return false;
      }
    }

    // Match artista
    if (entities.artist) {
      const artistMatch = 
        event.title?.toLowerCase().includes(entities.artist.toLowerCase()) ||
        event.description?.toLowerCase().includes(entities.artist.toLowerCase()) ||
        event.organizer?.toLowerCase().includes(entities.artist.toLowerCase());
      if (!artistMatch) return false;
    }

    // Match venue
    if (entities.venue) {
      if (!event.location?.venue_name?.toLowerCase().includes(entities.venue.toLowerCase())) {
        return false;
      }
    }

    // Match textual geral
    return (
      event.title?.toLowerCase().includes(queryLower) ||
      event.description?.toLowerCase().includes(queryLower) ||
      event.location?.venue_name?.toLowerCase().includes(queryLower) ||
      event.genre?.toLowerCase().includes(queryLower) ||
      event.organizer?.toLowerCase().includes(queryLower)
    );
  });
}

function filterUsers(users, query, entities) {
  const queryLower = query.toLowerCase();
  const artistLower = entities.artist?.toLowerCase() || '';
  
  return users.filter(u => {
    if (!u || !u.full_name) return false;
    
    return (
      u.full_name?.toLowerCase().includes(queryLower) ||
      u.full_name?.toLowerCase().includes(artistLower)
    );
  });
}

function filterCommunities(communities, query, entities) {
  const queryLower = query.toLowerCase();
  const venueLower = entities.venue?.toLowerCase() || '';
  
  return communities.filter(c => {
    if (!c || !c.name) return false;
    
    return (
      c.name?.toLowerCase().includes(queryLower) ||
      c.name?.toLowerCase().includes(venueLower) ||
      c.description?.toLowerCase().includes(queryLower)
    );
  });
}

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