import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { hasOrganizerAccess } from '../../shared/subscriptionAuth.ts';

/**
 * SUBLINX — Acesso Seguro a Tickets de Evento (Organizador)
 *
 * Validação dupla no backend:
 * 1. Propriedade do evento (event.organizer_id === user.id) ou admin
 * 2. Assinatura organizer_elite ativa e não expirada (via Subscription)
 *
 * Isto previne escalonamento via updateMe({ is_organizer: true }).
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

    if (!event_id || typeof event_id !== 'string') {
      return Response.json({ error: 'event_id é obrigatório' }, { status: 400 });
    }

    // Buscar evento via asServiceRole (bypass RLS — validação abaixo)
    let event;
    try {
      event = await base44.asServiceRole.entities.Event.get(event_id);
    } catch {
      return Response.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (!event || !event.id) {
      return Response.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Validar propriedade do evento
    const isOwner = event.organizer_id && event.organizer_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return Response.json({ error: 'Acesso negado — você não é o organizador deste evento' }, { status: 403 });
    }

    // Validar assinatura organizer_elite ativa (exceto admins)
    if (!isAdmin) {
      const hasOrgAccess = await hasOrganizerAccess(base44, user.id);
      if (!hasOrgAccess) {
        return Response.json({ error: 'Assinatura de organizador inativa ou expirada' }, { status: 403 });
      }
    }

    // Retornar tickets
    const tickets = await base44.asServiceRole.entities.Ticket.filter({ event_id }, '-created_date', 1000);

    return Response.json({
      success: true,
      tickets,
      count: tickets?.length || 0,
    });

  } catch (error) {
    console.error('❌ Erro em getEventTickets:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
});