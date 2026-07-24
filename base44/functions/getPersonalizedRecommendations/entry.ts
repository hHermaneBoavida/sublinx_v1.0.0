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

    // CORRIGIDO: Buscar dados com fallback individual
    const [userGenres, userPrefs, userLikes, userTickets, allEvents] = await Promise.allSettled([
      base44.entities.UserGenre.filter({ user_id: user.id }),
      base44.entities.UserPreferences.filter({ user_id: user.id }),
      base44.entities.Like.filter({ user_id: user.id }, '-created_date', 50),
      base44.entities.Ticket.filter({ user_id: user.id }),
      base44.entities.Event.list('-date', 100)
    ]).then(results => results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`Query ${i} failed:`, r.reason);
      return []; // Fallback para array vazio
    }));

    const now = new Date();
    const futureEvents = allEvents.filter(e => {
      try {
        return e?.date && new Date(e.date) > now;
      } catch {
        return false;
      }
    });

    const favoriteGenres = userGenres.map(g => g.genre);
    const likedEventIds = userLikes.map(l => l.event_id);
    const attendedEventIds = userTickets.map(t => t.event_id);
    const userLocation = user.location;
    const preferences = userPrefs[0] || {};

    // Calcular score e razões para cada evento
    const scoredEvents = futureEvents.map(event => {
      let score = 0;
      const reasons = [];

      // Gênero favorito (+40)
      if (favoriteGenres.includes(event.genre)) {
        score += 40;
        reasons.push(`Você ama ${event.genre}`);
      }

      // Eventos similares que já foi (+35)
      const attendedSameGenre = attendedEventIds.filter(id => {
        const e = allEvents.find(ev => ev.id === id);
        return e?.genre === event.genre;
      }).length;
      if (attendedSameGenre > 0) {
        score += 35;
        reasons.push(`Você foi a ${attendedSameGenre} evento(s) de ${event.genre}`);
      }

      // Proximidade (+30/20/10)
      if (userLocation?.lat && event.location?.lat) {
        const dist = calculateDistance(
          userLocation.lat, userLocation.lng,
          event.location.lat, event.location.lng
        );
        if (dist < 5) {
          score += 30;
          reasons.push(`Apenas ${dist.toFixed(1)}km de você`);
        } else if (dist < 10) {
          score += 20;
          reasons.push(`Perto (${dist.toFixed(1)}km)`);
        } else if (dist < 20) {
          score += 10;
          reasons.push(`${dist.toFixed(1)}km de você`);
        }
        event.distance_km = dist;
      }

      // Popularidade (+20)
      if (event.current_attendees > 50) {
        score += 20;
        reasons.push(`${event.current_attendees}+ pessoas confirmadas`);
      }

      // Mesmo organizador (+15)
      const sameOrganizerCount = attendedEventIds.filter(id => {
        const e = allEvents.find(ev => ev.id === id);
        return e?.organizer_id === event.organizer_id;
      }).length;
      if (sameOrganizerCount > 0) {
        score += 15;
        reasons.push('Organizador que você conhece');
      }

      // Faixa de preço (+15)
      if (preferences.price_range) {
        const price = event.price || event.ticket_types?.[0]?.price || 0;
        const matches = 
          (preferences.price_range === 'free' && price === 0) ||
          (preferences.price_range === 'budget' && price < 50) ||
          (preferences.price_range === 'moderate' && price >= 50 && price < 150) ||
          (preferences.price_range === 'premium' && price >= 150);
        if (matches) {
          score += 15;
          reasons.push('No seu orçamento');
        }
      }

      // Evento secreto (+10)
      if (event.is_secret) {
        score += 10;
        reasons.push('Evento exclusivo');
      }

      // Novo (+5)
      if (!likedEventIds.includes(event.id) && !attendedEventIds.includes(event.id)) {
        score += 5;
        reasons.push('Descoberta nova');
      }

      return {
        ...event,
        recommendation_score: score,
        recommendation_reasons: reasons
      };
    });

    // Top recomendações
    const personalized = scoredEvents
      .filter(e => e.recommendation_score > 0)
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 12);

    // Trending
    const trending = futureEvents
      .map(e => ({
        ...e,
        recommendation_reasons: [
          `${e.current_attendees || 0} confirmados`,
          'Em alta agora',
          e.genre || 'Popular'
        ]
      }))
      .sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0))
      .slice(0, 10);

    // Próximos
    let nearby = [];
    if (userLocation?.lat) {
      nearby = futureEvents
        .filter(e => e.location?.lat)
        .map(e => {
          const dist = calculateDistance(
            userLocation.lat, userLocation.lng,
            e.location.lat, e.location.lng
          );
          return {
            ...e,
            distance_km: dist,
            recommendation_reasons: [
              `${dist.toFixed(1)}km de você`,
              e.location.venue_name || 'Perto',
              e.genre || 'Evento'
            ]
          };
        })
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 10);
    }

    return Response.json({
      personalized,
      trending,
      nearby,
      events: personalized
    });

  } catch (error) {
    console.error('Erro em getPersonalizedRecommendations:', error);
    return Response.json({ 
      error: 'Erro ao buscar recomendações',
      personalized: [],
      trending: [],
      nearby: [],
      events: []
    }, { status: 500 });
  }
});