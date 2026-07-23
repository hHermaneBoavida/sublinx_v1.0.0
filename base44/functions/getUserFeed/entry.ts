import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { page = 0, limit = 20 } = await req.json();
    
    // 1. Get user preferences and genres in parallel
    const [prefsResult, genresResult, followingResult] = await Promise.allSettled([
      base44.asServiceRole.entities.UserPreferences.filter({ user_id: user.id }),
      base44.asServiceRole.entities.UserGenre.filter({ user_id: user.id }),
      base44.asServiceRole.entities.Follow.filter({ follower_id: user.id })
    ]);
    
    const prefs = prefsResult.status === 'fulfilled' ? prefsResult.value : [];
    const genres = genresResult.status === 'fulfilled' ? genresResult.value : [];
    const following = followingResult.status === 'fulfilled' ? followingResult.value : [];
    
    const userGenres = genres.map(g => g.genre);
    const followingIds = following.map(f => f.following_id);
    
    // 2. Build event filter based on preferences
    const eventFilter = {
      date: { $gte: new Date().toISOString() }
    };
    
    // Genre filter
    if (userGenres.length > 0) {
      eventFilter.genre = { $in: userGenres };
    }
    
    // Price range filter
    const priceRange = prefs[0]?.price_range;
    if (priceRange && priceRange !== 'any') {
      switch (priceRange) {
        case 'free':
          eventFilter.price = 0;
          break;
        case 'budget':
          eventFilter.price = { $lte: 50 };
          break;
        case 'moderate':
          eventFilter.price = { $gte: 50, $lte: 150 };
          break;
        case 'premium':
          eventFilter.price = { $gte: 150 };
          break;
      }
    }
    
    // Exclude secret events unless the user is a PRO member or admin
    if (!user.is_pro_member && user.role !== 'admin') {
      eventFilter.is_secret = false;
    }

    // 3. Fetch events
    const skip = page * limit;
    const rawEvents = await base44.asServiceRole.entities.Event.filter(
      eventFilter,
      '-date',
      limit,
      skip
    );
    
    // Defense-in-depth: strip any secret events for non-PRO/non-admin users
    // even if the query filter didn't catch them
    const canSeeSecret = user.is_pro_member || user.role === 'admin';
    const events = canSeeSecret ? rawEvents : rawEvents.filter(e => !e.is_secret);
    
    if (events.length === 0) {
      return Response.json({
        events: [],
        hasMore: false,
        page
      });
    }
    
    // 4. Batch fetch related data
    const eventIds = events.map(e => e.id);
    const organizerIds = [...new Set(events.map(e => e.organizer_id))];
    
    const [metricsResult, vibesResult, organizersResult, userInteractionsResult] = await Promise.allSettled([
      base44.asServiceRole.entities.EventMetrics.filter({ 
        event_id: { $in: eventIds } 
      }),
      base44.asServiceRole.entities.EventVibe.filter({ 
        event_id: { $in: eventIds } 
      }),
      base44.asServiceRole.entities.User.filter({ 
        id: { $in: organizerIds } 
      }),
      base44.asServiceRole.entities.Like.filter({
        user_id: user.id,
        event_id: { $in: eventIds }
      })
    ]);
    
    const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value : [];
    const vibes = vibesResult.status === 'fulfilled' ? vibesResult.value : [];
    const organizers = organizersResult.status === 'fulfilled' ? organizersResult.value : [];
    const userLikes = userInteractionsResult.status === 'fulfilled' ? userInteractionsResult.value : [];
    
    // 5. Build lookup maps
    const metricsMap = metrics.reduce((acc, m) => {
      acc[m.event_id] = m;
      return acc;
    }, {});
    
    const vibesMap = vibes.reduce((acc, v) => {
      if (!acc[v.event_id]) acc[v.event_id] = [];
      acc[v.event_id].push(v.vibe_tag);
      return acc;
    }, {});
    
    const organizersMap = organizers.reduce((acc, o) => {
      acc[o.id] = o;
      return acc;
    }, {});
    
    const likesSet = new Set(userLikes.map(l => l.event_id));
    
    // 6. Combine data
    const enrichedEvents = events.map(e => {
      const organizer = organizersMap[e.organizer_id];
      const isFollowing = followingIds.includes(e.organizer_id);
      
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        genre: e.genre,
        type: e.type,
        location: e.location,
        date: e.date,
        image_url: e.image_url,
        price: e.price || e.ticket_types?.[0]?.price || 0,
        requires_approval: e.requires_approval,
        organizer: {
          id: organizer?.id,
          name: organizer?.full_name || organizer?.display_name,
          avatar: organizer?.avatar_url,
          isFollowing
        },
        metrics: metricsMap[e.id] || {
          likes_count: 0,
          comments_count: 0,
          attendees_count: 0
        },
        vibes: vibesMap[e.id] || [],
        userLiked: likesSet.has(e.id)
      };
    });
    
    return Response.json({
      events: enrichedEvents,
      hasMore: events.length === limit,
      page,
      total: enrichedEvents.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar feed:', error);
    return Response.json({ 
      error: error.message,
      events: [],
      hasMore: false
    }, { status: 500 });
  }
});