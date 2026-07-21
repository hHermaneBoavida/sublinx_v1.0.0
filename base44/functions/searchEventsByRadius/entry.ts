import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Haversine distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
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

    const { lat, lng, radius_km = 10, city, genre, vibe, limit = 50 } = await req.json();
    
    if (!lat || !lng) {
      return Response.json({ error: 'Latitude e longitude são obrigatórios' }, { status: 400 });
    }
    
    // 1. Build filter (city-first for performance)
    const filter = {
      date: { $gte: new Date().toISOString() }
    };
    
    if (city) filter.city = city;
    if (genre) filter.genre = genre;
    
    // 2. Fetch events from database (city-indexed)
    const events = await base44.asServiceRole.entities.Event.list('-date', limit * 3);
    
    // 3. Calculate distances and filter by radius
    const eventsWithDistance = events
      .map(event => {
        if (!event.location?.lat || !event.location?.lng) return null;
        
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          genre: event.genre,
          type: event.type,
          location: event.location,
          city: event.location.city || event.city,
          date: event.date,
          image_url: event.image_url,
          organizer_id: event.organizer_id,
          organizer: event.organizer,
          price: event.price || event.ticket_types?.[0]?.price || 0,
          requires_approval: event.requires_approval,
          distance: calculateDistance(lat, lng, event.location.lat, event.location.lng)
        };
      })
      .filter(e => e !== null && e.distance <= radius_km)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
    
    // 4. Batch fetch metrics for returned events
    const eventIds = eventsWithDistance.map(e => e.id);
    
    if (eventIds.length === 0) {
      return Response.json({ events: [], count: 0 });
    }
    
    const metrics = await base44.asServiceRole.entities.EventMetrics.filter({
      event_id: { $in: eventIds }
    });
    
    // 5. Optional: Filter by vibe if specified
    let vibeFilteredIds = null;
    if (vibe) {
      const eventVibes = await base44.asServiceRole.entities.EventVibe.filter({
        event_id: { $in: eventIds },
        vibe_tag: vibe
      });
      vibeFilteredIds = new Set(eventVibes.map(v => v.event_id));
    }
    
    // 6. Combine data
    const metricsMap = metrics.reduce((acc, m) => {
      acc[m.event_id] = m;
      return acc;
    }, {});
    
    const finalEvents = eventsWithDistance
      .filter(e => !vibeFilteredIds || vibeFilteredIds.has(e.id))
      .map(e => ({
        ...e,
        metrics: metricsMap[e.id] || {
          likes_count: 0,
          comments_count: 0,
          attendees_count: 0
        }
      }));
    
    return Response.json({
      events: finalEvents,
      count: finalEvents.length,
      radius_km,
      center: { lat, lng }
    });
    
  } catch (error) {
    console.error('Erro na busca por raio:', error);
    return Response.json({ 
      error: error.message,
      events: [],
      count: 0
    }, { status: 500 });
  }
});