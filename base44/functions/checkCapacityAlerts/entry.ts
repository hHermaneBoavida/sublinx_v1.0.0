import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * SUBLINX — Alerta de capacidade
 *
 * Avisa o organizador quando a ocupação do evento
 * (ingressos vendidos + convidados confirmados da lista) atinge 90% da capacidade.
 *
 * Dois modos:
 * - com event_id: verifica apenas esse evento (disparado após uma compra de ingresso)
 * - sem event_id: varredura de todos os eventos publicados (uso do admin / agendador)
 */

const ALERT_TITLE = '🔥 Evento quase esgotado';
const THRESHOLD = 90;

function resolveCapacity(event) {
  if (Number(event.max_capacity) > 0) return Number(event.max_capacity);
  const ticketTypes = Array.isArray(event.ticket_types) ? event.ticket_types : [];
  return ticketTypes.reduce((sum, tt) => sum + (Number(tt.quantity_available) || 0), 0);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const singleEventId = body.event_id || null;

    if (!singleEventId && user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado — apenas administradores' }, { status: 403 });
    }

    const now = Date.now();
    const query = singleEventId ? { id: singleEventId } : { is_published: true, is_expired: false };
    const { items: events } = await base44.asServiceRole.entities.Event.filter(query, {
      sort: 'date',
      limit: 200,
    });

    const candidates = (events || []).filter((event) => {
      if (!event.organizer_id) return false;
      if (event.event_status && ['cancelled', 'ended'].includes(event.event_status)) return false;
      if (resolveCapacity(event) <= 0) return false;
      const startsAt = event.date ? new Date(event.date).getTime() : null;
      return !startsAt || startsAt >= now;
    });

    const ids = candidates.map((event) => event.id);
    let ticketRows = [];
    let guestRows = [];

    if (ids.length > 0) {
      const [tickets, guests] = await Promise.all([
        base44.asServiceRole.entities.Ticket.aggregate({
          query: { event_id: { $in: ids }, status: { $in: ['valid', 'used'] } },
          groupBy: 'event_id',
          sum: ['quantity'],
        }),
        base44.asServiceRole.entities.GuestList.aggregate({
          query: { event_id: { $in: ids }, status: { $in: ['accepted', 'used'] } },
          groupBy: 'event_id',
          sum: ['plus_ones'],
        }),
      ]);
      ticketRows = tickets.rows || [];
      guestRows = guests.rows || [];
    }

    const soldByEvent = new Map(
      ticketRows.map((row) => [row.event_id, Number(row.sum_quantity) || 0])
    );
    const guestsByEvent = new Map(
      guestRows.map((row) => [
        row.event_id,
        (Number(row.count) || 0) + (Number(row.sum_plus_ones) || 0),
      ])
    );

    const { items: existingAlerts } = await base44.asServiceRole.entities.Notification.filter(
      { title: ALERT_TITLE },
      { limit: 500 }
    );
    const alreadyAlerted = new Set(
      (existingAlerts || []).map((n) => `${n.user_id}:${n.event_id}`)
    );

    const alerts = [];

    for (const event of candidates) {
      const capacity = resolveCapacity(event);
      const occupied = (soldByEvent.get(event.id) || 0) + (guestsByEvent.get(event.id) || 0);
      const percent = Math.round((occupied / capacity) * 100);

      if (percent < THRESHOLD) continue;
      if (alreadyAlerted.has(`${event.organizer_id}:${event.id}`)) continue;

      alerts.push({
        event_id: event.id,
        organizer_id: event.organizer_id,
        percent,
        occupied,
        capacity,
        title: event.title,
      });
    }

    if (!dryRun) {
      await Promise.allSettled(
        alerts.map((alert) =>
          base44.asServiceRole.entities.Notification.create({
            user_id: alert.organizer_id,
            type: 'event_alert',
            title: ALERT_TITLE,
            message: `${alert.title} atingiu ${alert.percent}% da capacidade (${alert.occupied}/${alert.capacity} lugares).`,
            event_id: alert.event_id,
            is_read: false,
            location_match: false,
            genre_match: [],
          })
        )
      );
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      events_checked: candidates.length,
      alerts_sent: dryRun ? 0 : alerts.length,
      alerts,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}