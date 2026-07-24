import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { hasOrganizerAccess } from '../../shared/subscriptionAuth.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Autorização via Subscription — não confiar em user.is_organizer (manipulável via updateMe)
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      const hasAccess = await hasOrganizerAccess(base44, user.id);
      if (!hasAccess) {
        return Response.json({ error: 'Acesso negado — assinatura de organizador inativa' }, { status: 403 });
      }
    }

    // Fetch organizer events first
    const events = await base44.asServiceRole.entities.Event.filter({ organizer_id: user.id });
    const eventIds = events.map(e => e.id);

    if (eventIds.length === 0) {
      return Response.json({
        metrics: {
          totalRevenue: 0,
          totalSold: 0,
          avgPrice: 0,
          pendingRequests: 0,
          totalLikes: 0,
          totalComments: 0,
          engagement: 0,
          occupancyRate: 0,
          totalCapacity: 0,
          conversionRate: 0
        },
        charts: {
          revenueByEvent: [],
          ticketTypesData: [],
          last30Days: [],
          revenueGrowth: 0
        },
        rawData: { events: [], tickets: [], requests: [], likes: [], comments: [] }
      });
    }

    // OTIMIZADO: Fetch only relevant data with filters
    const [organizerTickets, organizerRequests, organizerLikes, organizerComments] = await Promise.all([
      base44.asServiceRole.entities.Ticket.filter({ event_id: { $in: eventIds } }, '', 1000),
      base44.asServiceRole.entities.EventRequest.filter({ event_id: { $in: eventIds } }, '', 500),
      base44.asServiceRole.entities.Like.filter({ event_id: { $in: eventIds } }, '', 2000),
      base44.asServiceRole.entities.Comment.filter({ event_id: { $in: eventIds } }, '', 500)
    ]);

    // Calculate metrics (optimized)
    const validTickets = organizerTickets.filter(t => t.status !== 'cancelled' && t.status !== 'refunded');
    const totalRevenue = validTickets.reduce((sum, t) => sum + (t.price || 0), 0);
    const totalSold = validTickets.length;
    const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;
    
    const pendingRequests = organizerRequests.filter(r => r.status === 'pending').length;
    const totalLikes = organizerLikes.length;
    const totalComments = organizerComments.length;
    const engagement = events.length > 0 ? ((totalLikes + totalComments) / events.length).toFixed(1) : 0;
    
    const totalCapacity = events.reduce((sum, e) => sum + (e.max_capacity || 0), 0);
    const occupancyRate = totalCapacity > 0 ? ((totalSold / totalCapacity) * 100).toFixed(1) : 0;
    const conversionRate = organizerRequests.length > 0 ? ((totalSold / organizerRequests.length) * 100).toFixed(1) : 0;

    // Last 30 days sales
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const last30DaysTickets = validTickets.filter(t => {
      const ticketDate = new Date(t.created_date);
      return ticketDate >= thirtyDaysAgo;
    });

    const last30DaysData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayTickets = last30DaysTickets.filter(t => {
        const ticketDate = new Date(t.created_date);
        return ticketDate >= dayStart && ticketDate <= dayEnd;
      });
      
      last30DaysData.push({
        date: `${dayStart.getDate().toString().padStart(2, '0')}/${(dayStart.getMonth() + 1).toString().padStart(2, '0')}`,
        vendas: dayTickets.length,
        receita: dayTickets.reduce((sum, t) => sum + (t.price || 0), 0)
      });
    }

    // Revenue by event
    const revenueByEvent = events.map(event => {
      const eventTickets = validTickets.filter(t => t.event_id === event.id);
      const revenue = eventTickets.reduce((sum, t) => sum + (t.price || 0), 0);
      return {
        id: event.id,
        name: event.title.substring(0, 12),
        fullName: event.title,
        receita: revenue,
        ingressos: eventTickets.length,
        ocupacao: event.max_capacity > 0 ? ((eventTickets.length / event.max_capacity) * 100).toFixed(0) : 0,
        date: event.date,
        max_capacity: event.max_capacity
      };
    }).sort((a, b) => b.receita - a.receita);

    // Ticket types distribution
    const ticketTypes = validTickets.reduce((acc, ticket) => {
      const type = ticket.ticket_type || 'Padrão';
      if (!acc[type]) acc[type] = { vendas: 0, receita: 0 };
      acc[type].vendas += 1;
      acc[type].receita += ticket.price || 0;
      return acc;
    }, {});

    const ticketTypesData = Object.entries(ticketTypes).map(([name, data]) => ({
      name,
      vendas: data.vendas,
      receita: data.receita
    }));

    // Growth calculation
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const last7Days = validTickets.filter(t => new Date(t.created_date) >= sevenDaysAgo);
    const previous7Days = validTickets.filter(t => {
      const d = new Date(t.created_date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const revenueGrowth = previous7Days.length > 0
      ? (((last7Days.length - previous7Days.length) / previous7Days.length) * 100).toFixed(1)
      : last7Days.length > 0 ? 100 : 0;

    return Response.json({
      metrics: {
        totalRevenue,
        totalSold,
        avgPrice,
        pendingRequests,
        totalLikes,
        totalComments,
        engagement: parseFloat(engagement),
        occupancyRate: parseFloat(occupancyRate),
        totalCapacity,
        conversionRate: parseFloat(conversionRate)
      },
      charts: {
        revenueByEvent,
        ticketTypesData,
        last30Days: last30DaysData,
        revenueGrowth: parseFloat(revenueGrowth)
      },
      rawData: {
        events,
        tickets: organizerTickets,
        requests: organizerRequests,
        likes: organizerLikes,
        comments: organizerComments
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
  }
});