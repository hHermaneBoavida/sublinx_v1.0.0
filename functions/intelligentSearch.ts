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
        results: []
      });
    }

    console.log('🔍 Busca recebida:', query, 'Localização:', userLocation);

    // 1. BUSCAR TODOS OS DADOS DISPONÍVEIS
    const [events, users, communities] = await Promise.all([
      base44.asServiceRole.entities.Event.list('-date', 100),
      base44.asServiceRole.entities.User.filter({ $or: [
        { is_organizer: true },
        { is_pro_member: true }
      ] }, '', 50),
      base44.asServiceRole.entities.Community.list('', 50)
    ]);

    // 2. USAR LLM PARA CLASSIFICAR E EXTRAIR INTENÇÃO
    const llmPrompt = `
Você é o motor de busca do SUBLINX, app de eventos underground.

**Contexto:**
- Query do usuário: "${query}"
- Localização: ${userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'não informada'}

**Sua tarefa:**
1. Classificar o tipo de busca em: city, neighborhood, venue, event, artist, genre, vibe, or mixed
2. Extrair entidades chave (cidade, gênero musical, artista, data, etc)
3. Entender gírias (rolê=evento, after=festa tarde, vibe=atmosfera, line=lineup)
4. Corrigir erros de digitação (sp=São Paulo, bh=Belo Horizonte, anita=Anitta)

**Retorne SOMENTE JSON:**
{
  "detected_type": "tipo_detectado",
  "entities": {
    "city": "cidade extraída ou null",
    "genre": "gênero musical ou null",
    "artist": "nome artista ou null",
    "venue": "nome estabelecimento ou null",
    "vibe": ["vibes detectadas"],
    "date_context": "hoje|amanhã|fim_de_semana|null"
  },
  "search_intent": "descrição curta da intenção"
}
`;

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

    console.log('🤖 LLM Response:', llmResponse);

    // 3. FILTRAR RESULTADOS BASEADO NA ANÁLISE
    const results = [];
    const { detected_type, entities, search_intent } = llmResponse;

    // FILTRAR EVENTOS
    let relevantEvents = events.filter(event => {
      if (!event || !event.title) return false;
      
      // Filtrar apenas eventos futuros
      if (new Date(event.date) < new Date()) return false;

      // Match por cidade
      if (entities.city) {
        const cityMatch = event.location?.city?.toLowerCase().includes(entities.city.toLowerCase()) ||
                         event.location?.address?.toLowerCase().includes(entities.city.toLowerCase());
        if (!cityMatch) return false;
      }

      // Match por gênero
      if (entities.genre) {
        const genreMatch = event.genre?.toLowerCase().includes(entities.genre.toLowerCase());
        if (!genreMatch) return false;
      }

      // Match por artista no título/descrição
      if (entities.artist) {
        const artistMatch = event.title?.toLowerCase().includes(entities.artist.toLowerCase()) ||
                           event.description?.toLowerCase().includes(entities.artist.toLowerCase()) ||
                           event.organizer?.toLowerCase().includes(entities.artist.toLowerCase());
        if (!artistMatch) return false;
      }

      // Match por venue
      if (entities.venue) {
        const venueMatch = event.location?.venue_name?.toLowerCase().includes(entities.venue.toLowerCase());
        if (!venueMatch) return false;
      }

      // Match textual geral
      const queryLower = query.toLowerCase();
      const textMatch = event.title?.toLowerCase().includes(queryLower) ||
                       event.description?.toLowerCase().includes(queryLower) ||
                       event.location?.venue_name?.toLowerCase().includes(queryLower) ||
                       event.genre?.toLowerCase().includes(queryLower);

      return textMatch;
    });

    // CALCULAR DISTÂNCIA SE LOCALIZAÇÃO DISPONÍVEL
    if (userLocation) {
      relevantEvents = relevantEvents.map(event => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          event.location?.lat,
          event.location?.lng
        );
        return { ...event, distance };
      }).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // ADICIONAR EVENTOS AOS RESULTADOS
    relevantEvents.slice(0, 10).forEach(event => {
      results.push({
        type: "event",
        id: event.id,
        name: event.title,
        description: event.description?.substring(0, 100),
        location: `${event.location?.venue_name || ''}, ${event.location?.city || ''}`,
        genre: event.genre,
        date: event.date,
        distance: event.distance ? `${event.distance.toFixed(1)} km` : null,
        image_url: event.image_url,
        organizer: event.organizer,
        link: `/event/${event.id}`
      });
    });

    // FILTRAR ARTISTAS/ORGANIZADORES
    if (detected_type === 'artist' || entities.artist) {
      const relevantUsers = users.filter(u => {
        if (!u || !u.full_name) return false;
        const queryLower = query.toLowerCase();
        const artistLower = entities.artist?.toLowerCase() || '';
        
        return u.full_name?.toLowerCase().includes(queryLower) ||
               u.full_name?.toLowerCase().includes(artistLower);
      });

      relevantUsers.slice(0, 5).forEach(u => {
        // Buscar próximo evento do artista
        const nextEvent = events.find(e => e.organizer_id === u.id && new Date(e.date) > new Date());
        
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

    // FILTRAR COMUNIDADES
    if (detected_type === 'venue' || detected_type === 'community' || entities.venue) {
      const relevantCommunities = communities.filter(c => {
        if (!c || !c.name) return false;
        const queryLower = query.toLowerCase();
        const venueLower = entities.venue?.toLowerCase() || '';
        
        return c.name?.toLowerCase().includes(queryLower) ||
               c.name?.toLowerCase().includes(venueLower) ||
               c.description?.toLowerCase().includes(queryLower);
      });

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

    // 4. SUGESTÕES SE NENHUM RESULTADO
    let suggestions = [];
    if (results.length === 0) {
      suggestions = [
        "Tente buscar por gênero musical (techno, house, trap)",
        "Busque por cidade (São Paulo, Rio, BH)",
        "Procure artistas ou DJs específicos",
        "Use termos como 'hoje', 'amanhã', 'fim de semana'"
      ];
    }

    // 5. RESPOSTA FINAL
    return Response.json({
      query: query,
      detected_type: detected_type,
      search_intent: search_intent,
      entities: entities,
      results: results,
      suggestions: suggestions,
      total_results: results.length
    });

  } catch (error) {
    console.error('❌ Erro na busca inteligente:', error);
    return Response.json({ 
      error: error.message,
      query: '',
      detected_type: 'error',
      results: []
    }, { status: 500 });
  }
});

// HELPER: Calcular distância entre dois pontos
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}