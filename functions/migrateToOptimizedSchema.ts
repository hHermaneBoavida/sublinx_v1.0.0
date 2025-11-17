import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admins can run migrations
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Apenas administradores podem executar migrações' }, { status: 403 });
    }
    
    const { action } = await req.json();
    
    const results = {
      action,
      started_at: new Date().toISOString(),
      completed: false,
      stats: {}
    };
    
    switch (action) {
      case 'migrate_user_preferences':
        results.stats = await migrateUserPreferences(base44);
        break;
      
      case 'migrate_user_genres':
        results.stats = await migrateUserGenres(base44);
        break;
      
      case 'migrate_ticket_types':
        results.stats = await migrateTicketTypes(base44);
        break;
      
      case 'migrate_event_vibes':
        results.stats = await migrateEventVibes(base44);
        break;
      
      case 'build_event_metrics':
        results.stats = await buildEventMetrics(base44);
        break;
      
      case 'migrate_all':
        results.stats.preferences = await migrateUserPreferences(base44);
        results.stats.genres = await migrateUserGenres(base44);
        results.stats.ticket_types = await migrateTicketTypes(base44);
        results.stats.vibes = await migrateEventVibes(base44);
        results.stats.metrics = await buildEventMetrics(base44);
        break;
      
      default:
        return Response.json({ error: 'Ação inválida' }, { status: 400 });
    }
    
    results.completed = true;
    results.completed_at = new Date().toISOString();
    
    return Response.json(results);
    
  } catch (error) {
    console.error('Erro na migração:', error);
    return Response.json({ 
      error: error.message,
      completed: false
    }, { status: 500 });
  }
});

// Migration Functions

async function migrateUserPreferences(base44) {
  const users = await base44.asServiceRole.entities.User.list('', 1000);
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const user of users) {
    try {
      // Check if already exists
      const existing = await base44.asServiceRole.entities.UserPreferences.filter({ 
        user_id: user.id 
      });
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      // Create UserPreferences from User fields
      await base44.asServiceRole.entities.UserPreferences.create({
        user_id: user.id,
        price_range: user.price_range || 'any',
        crowd_preference: user.crowd_preference || 'qualquer',
        show_location: user.privacy_settings?.show_location ?? true,
        show_events: user.privacy_settings?.show_events ?? true,
        show_followers: user.privacy_settings?.show_followers ?? true,
        events_nearby: user.notification_preferences?.events_nearby ?? true,
        event_reminders: user.notification_preferences?.event_reminders ?? true,
        new_followers: user.notification_preferences?.new_followers ?? true,
        messages: user.notification_preferences?.messages ?? true
      });
      
      created++;
    } catch (error) {
      console.error(`Erro ao migrar preferências do usuário ${user.id}:`, error);
      errors++;
    }
  }
  
  return { created, skipped, errors, total: users.length };
}

async function migrateUserGenres(base44) {
  const users = await base44.asServiceRole.entities.User.list('', 1000);
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const user of users) {
    try {
      if (!user.favorite_genres || user.favorite_genres.length === 0) {
        skipped++;
        continue;
      }
      
      // Check if already migrated
      const existing = await base44.asServiceRole.entities.UserGenre.filter({ 
        user_id: user.id 
      });
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      // Create UserGenre for each favorite genre
      for (const genre of user.favorite_genres) {
        await base44.asServiceRole.entities.UserGenre.create({
          user_id: user.id,
          genre
        });
        created++;
      }
    } catch (error) {
      console.error(`Erro ao migrar gêneros do usuário ${user.id}:`, error);
      errors++;
    }
  }
  
  return { created, skipped, errors, total: users.length };
}

async function migrateTicketTypes(base44) {
  const events = await base44.asServiceRole.entities.Event.list('', 1000);
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const event of events) {
    try {
      if (!event.ticket_types || event.ticket_types.length === 0) {
        skipped++;
        continue;
      }
      
      // Check if already migrated
      const existing = await base44.asServiceRole.entities.TicketType.filter({ 
        event_id: event.id 
      });
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      // Create TicketType for each ticket type
      for (const ticketType of event.ticket_types) {
        await base44.asServiceRole.entities.TicketType.create({
          event_id: event.id,
          name: ticketType.name,
          price: ticketType.price,
          quantity_available: ticketType.quantity_available,
          quantity_sold: ticketType.quantity_sold || 0,
          description: ticketType.description,
          benefits: ticketType.benefits || [],
          sale_start_date: ticketType.sale_start_date,
          sale_end_date: ticketType.sale_end_date,
          is_active: ticketType.is_active ?? true
        });
        created++;
      }
    } catch (error) {
      console.error(`Erro ao migrar tipos de ingresso do evento ${event.id}:`, error);
      errors++;
    }
  }
  
  return { created, skipped, errors, total: events.length };
}

async function migrateEventVibes(base44) {
  const events = await base44.asServiceRole.entities.Event.list('', 1000);
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const event of events) {
    try {
      if (!event.vibe_tags || event.vibe_tags.length === 0) {
        skipped++;
        continue;
      }
      
      // Check if already migrated
      const existing = await base44.asServiceRole.entities.EventVibe.filter({ 
        event_id: event.id 
      });
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      // Create EventVibe for each vibe tag
      for (const vibeTag of event.vibe_tags) {
        await base44.asServiceRole.entities.EventVibe.create({
          event_id: event.id,
          vibe_tag: vibeTag
        });
        created++;
      }
    } catch (error) {
      console.error(`Erro ao migrar vibes do evento ${event.id}:`, error);
      errors++;
    }
  }
  
  return { created, skipped, errors, total: events.length };
}

async function buildEventMetrics(base44) {
  const events = await base44.asServiceRole.entities.Event.list('', 1000);
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const event of events) {
    try {
      // Fetch all metrics in parallel
      const [tickets, likes, comments, requests] = await Promise.allSettled([
        base44.asServiceRole.entities.Ticket.filter({ event_id: event.id }),
        base44.asServiceRole.entities.Like.filter({ event_id: event.id }),
        base44.asServiceRole.entities.Comment.filter({ event_id: event.id }),
        base44.asServiceRole.entities.EventRequest.filter({ 
          event_id: event.id, 
          status: 'pending' 
        })
      ]);
      
      const ticketsData = tickets.status === 'fulfilled' ? tickets.value : [];
      const likesData = likes.status === 'fulfilled' ? likes.value : [];
      const commentsData = comments.status === 'fulfilled' ? comments.value : [];
      const requestsData = requests.status === 'fulfilled' ? requests.value : [];
      
      const revenue = ticketsData.reduce((sum, t) => sum + (t.price || 0), 0);
      const validTickets = ticketsData.filter(t => t.status === 'valid');
      
      const metricsData = {
        event_id: event.id,
        tickets_sold: ticketsData.length,
        revenue,
        attendees_count: validTickets.length,
        likes_count: likesData.length,
        comments_count: commentsData.length,
        requests_pending: requestsData.length,
        views_count: 0,
        shares_count: 0,
        last_updated: new Date().toISOString()
      };
      
      // Check if metrics exist
      const existing = await base44.asServiceRole.entities.EventMetrics.filter({ 
        event_id: event.id 
      });
      
      if (existing.length > 0) {
        await base44.asServiceRole.entities.EventMetrics.update(existing[0].id, metricsData);
        updated++;
      } else {
        await base44.asServiceRole.entities.EventMetrics.create(metricsData);
        created++;
      }
    } catch (error) {
      console.error(`Erro ao construir métricas do evento ${event.id}:`, error);
      errors++;
    }
  }
  
  return { created, updated, errors, total: events.length };
}