import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Buscar preferências do usuário
    const [userGenres, userPrefs, userInteractions, allEvents] = await Promise.all([
      base44.entities.UserGenre.filter({ user_id: user.id }),
      base44.entities.UserPreferences.filter({ user_id: user.id }),
      base44.entities.Like.filter({ user_id: user.id }, '-created_date', 20),
      base44.entities.Event.list('-date', 100)
    ]);

    // 2. Filtrar eventos futuros
    const now = new Date();
    const futureEvents = allEvents.filter(e => {
      try {
        return e?.date && new Date(e.date) > now;
      } catch {
        return false;
      }
    });

    // 3. Eventos que o usuário já curtiu
    const likedEventIds = userInteractions.map(like => like.event_id);
    const likedEvents = futureEvents.filter(e => likedEventIds.includes(e.id));

    // 4. Gêneros favoritos
    const favoriteGenres = userGenres.map(g => g.genre);

    // 5. Montar contexto para IA
    const prompt = `Você é um sistema de recomendação de eventos underground.

**Perfil do Usuário:**
- Gêneros favoritos: ${favoriteGenres.join(', ') || 'Nenhum definido'}
- Faixa de preço: ${userPrefs[0]?.price_range || 'any'}
- Preferência de público: ${userPrefs[0]?.crowd_preference || 'qualquer'}
- Eventos curtidos recentemente: ${likedEvents.slice(0, 5).map(e => e.title).join(', ') || 'Nenhum'}

**Eventos Disponíveis (${futureEvents.length} eventos):**
${futureEvents.slice(0, 30).map(e => `
- ID: ${e.id}
- Título: ${e.title}
- Gênero: ${e.genre}
- Tipo: ${e.type}
- Preço: R$ ${e.price || 0}
- Data: ${e.date}
- Público: ${e.current_attendees || 0} pessoas
`).join('\n')}

**TAREFA:**
Analise o perfil do usuário e recomende os TOP 6 eventos mais relevantes.
Considere:
1. Match de gênero musical (peso: 40%)
2. Faixa de preço compatível (peso: 20%)
3. Popularidade/tendências (peso: 20%)
4. Similaridade com eventos curtidos (peso: 20%)

Retorne APENAS os IDs dos 6 eventos recomendados, do mais relevante ao menos relevante.`;

    // 6. Chamar IA
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recommended_event_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array com IDs dos 6 eventos recomendados'
          },
          reasoning: {
            type: 'string',
            description: 'Breve explicação da recomendação'
          }
        },
        required: ['recommended_event_ids']
      }
    });

    const recommendedIds = aiResponse.recommended_event_ids || [];
    const recommendedEvents = futureEvents.filter(e => recommendedIds.includes(e.id));

    // 7. Ordenar na sequência recomendada
    const sortedRecommendations = recommendedIds
      .map(id => recommendedEvents.find(e => e.id === id))
      .filter(Boolean);

    // 8. Eventos populares (fallback se IA falhar)
    const popularEvents = futureEvents
      .sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0))
      .slice(0, 6);

    return Response.json({
      personalized: sortedRecommendations,
      popular: popularEvents.slice(0, 6),
      trending: futureEvents
        .filter(e => {
          const eventDate = new Date(e.date);
          const daysDiff = (eventDate - now) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7; // Próximos 7 dias
        })
        .sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0))
        .slice(0, 6),
      reasoning: aiResponse.reasoning || 'Recomendações baseadas em seus gostos',
      user_profile: {
        favorite_genres: favoriteGenres,
        price_range: userPrefs[0]?.price_range || 'any',
        crowd_preference: userPrefs[0]?.crowd_preference || 'qualquer'
      }
    });

  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
    return Response.json({ 
      error: error.message,
      personalized: [],
      popular: [],
      trending: []
    }, { status: 500 });
  }
});