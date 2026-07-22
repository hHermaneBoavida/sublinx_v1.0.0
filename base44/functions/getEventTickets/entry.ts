import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * SUBLINX — Acesso Seguro a Tickets de Evento (Organizador)
 *
 * Permite que um organizador visualize os tickets de SEUS eventos.
 * O RLS da entidade Ticket não suporta lookup cross-entity (event_id → organizer_id),
 * então esta função backend valida a propriedade do evento e retorna os tickets
 * via asServiceRole.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { event_id } = body;

    if (!event_id) {
      return Response.json({ error: 'event_id é obrigatório' }, { status: 400 });
    }

    // Buscar evento via asServiceRole e validar propriedade
    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    const event = events[0];

    if (!event) {
      return Response.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Validar: usuário é o organizador do evento OU admin
    const isOrganizer = event.organizer_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return Response.json({ error: 'Acesso negado — você não é o organizador deste evento' }, { status: 403 });
    }

    // Retornar tickets do evento
    const tickets = await base44.asServiceRole.entities.Ticket.filter({ event_id }, '-created_date', 1000);

    return Response.json({
      success: true,
      tickets,
      count: tickets.length,
    });

  } catch (error) {
    console.error('❌ Erro em getEventTickets:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
});