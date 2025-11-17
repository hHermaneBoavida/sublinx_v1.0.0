import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Coletar histórico de interações
    const [likes, tickets, reviews, follows, searches] = await Promise.allSettled([
      base44.asServiceRole.entities.Like.filter({ user_id: user.id }, '-created_date', 50),
      base44.asServiceRole.entities.Ticket.filter({ user_id: user.id }, '-created_date', 50),
      base44.asServiceRole.entities.EventReview.filter({ user_id: user.id }, '-created_date', 30),
      base44.asServiceRole.entities.Follow.filter({ follower_id: user.id }),
      base44.asServiceRole.entities.UserEventInteraction.filter({ 
        user_id: user.id,
        interaction_type: 'interested'
      }, '-created_date', 30)
    ]);

    const likesData = likes.status === 'fulfilled' ? likes.value : [];
    const ticketsData = tickets.status === 'fulfilled' ? tickets.value : [];
    const reviewsData = reviews.status === 'fulfilled' ? reviews.value : [];
    const followsData = follows.status === 'fulfilled' ? follows.value : [];
    const searchesData = searches.status === 'fulfilled' ? searches.value : [];

    // 2. Buscar eventos relacionados
    const eventIds = [
      ...likesData.map(l => l.event_id),
      ...ticketsData.map(t => t.event_id),
      ...reviewsData.map(r => r.event_id),
      ...searchesData.map(s => s.event_id)
    ];

    const userEvents = await base44.asServiceRole.entities.Event.filter({
      id: { $in: eventIds }
    });

    // 3. Buscar todos eventos futuros
    const allEvents = await base44.asServiceRole.entities.Event.list('-date', 200);
    const futureEvents = allEvents.filter(e => new Date(e.date) > new Date());

    // 4. Gerar análise com AI
    const prompt = `
Você é um sistema de recomendação de eventos underground.

HISTÓRICO DO USUÁRIO:
- Eventos curtidos: ${likesData.length}
- Ingressos comprados: ${ticketsData.length}
- Eventos avaliados: ${reviewsData.length}
- Gêneros dos eventos que participou: ${userEvents.map(e => e.genre).join(', ')}
- Tipos de eventos preferidos: ${userEvents.map(e => e.type).join(', ')}
- Avaliações médias: ${reviewsData.length > 0 ? (reviewsData.reduce((sum, r) => sum + r.overall_rating, 0) / reviewsData.length).toFixed(1) : 'N/A'}

PREFERÊNCIAS EXPLÍCITAS DO USUÁRIO:
${user.favorite_genres ? `- Gêneros favoritos: ${user.favorite_genres.join(', ')}` : '- Sem gêneros definidos'}
${user.price_range ? `- Faixa de preço: ${user.price_range}` : '- Sem faixa de preço definida'}
${user.preferred_event_types ? `- Tipos preferidos: ${user.preferred_event_types.join(', ')}` : '- Sem tipos definidos'}

EVENTOS DISPONÍVEIS:
${futureEvents.slice(0, 50).map(e => `- ${e.title} (${e.genre}, ${e.type}, R$ ${e.price || e.ticket_types?.[0]?.price || 0})`).join('\n')}

Com base nesse histórico e preferências, selecione os IDs dos 10 melhores eventos para recomendar.
Priorize eventos que:
1. Correspondam aos gêneros e tipos favoritos do usuário
2. Estejam na faixa de preço preferida
3. Sejam similares aos eventos bem avaliados
4. Tragam alguma novidade (não apenas o que já conhece)

Também recomende 5 organizadores que o usuário deveria seguir baseado no histórico.
`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommended_event_ids: {
            type: "array",
            items: { type: "string" }
          },
          recommended_organizer_ids: {
            type: "array",
            items: { type: "string" }
          },
          reasoning: {
            type: "string"
          }
        }
      }
    });

    // 5. Filtrar eventos recomendados
    const recommendedEvents = futureEvents.filter(e => 
      aiResponse.recommended_event_ids?.includes(e.id)
    ).slice(0, 10);

    // 6. Buscar organizadores recomendados
    const recommendedOrganizers = await base44.asServiceRole.entities.User.filter({
      id: { $in: aiResponse.recommended_organizer_ids || [] }
    });

    return Response.json({
      events: recommendedEvents,
      organizers: recommendedOrganizers.slice(0, 5),
      reasoning: aiResponse.reasoning,
      based_on: {
        likes: likesData.length,
        tickets: ticketsData.length,
        reviews: reviewsData.length,
        follows: followsData.length
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message,
      events: [],
      organizers: []
    }, { status: 500 });
  }
});