import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { hasOrganizerAccess } from '../../shared/subscriptionAuth.ts';

/**
 * SUBLINX — Check-in Seguro de Ingresso
 *
 * Validação no backend:
 * 1. Ticket existe e tem event_id válido
 * 2. Usuário é organizador do evento (event.organizer_id === user.id) ou admin
 * 3. Assinatura organizer_elite ativa e não expirada
 * 4. Ticket status='valid' E payment_status='confirmed'
 * 5. Marca ticket como 'used' com timestamp
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { ticket_id, qr_code_data } = body;

    if (!ticket_id && !qr_code_data) {
      return Response.json({ error: 'ticket_id ou qr_code_data é obrigatório' }, { status: 400 });
    }

    // Buscar ticket via asServiceRole
    let ticket;
    try {
      if (qr_code_data) {
        const tickets = await base44.asServiceRole.entities.Ticket.filter({ qr_code_data });
        ticket = tickets?.[0];
      } else if (ticket_id) {
        ticket = await base44.asServiceRole.entities.Ticket.get(ticket_id);
      }
    } catch {
      // Ticket não encontrado — retorna 404 abaixo
    }

    if (!ticket || !ticket.id) {
      return Response.json({ error: 'Ingresso não encontrado' }, { status: 404 });
    }

    // Validar event_id no ticket
    if (!ticket.event_id) {
      return Response.json({ error: 'Ingresso sem evento associado' }, { status: 400 });
    }

    // Buscar evento
    let event;
    try {
      event = await base44.asServiceRole.entities.Event.get(ticket.event_id);
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

    // Validar status do ticket
    if (ticket.status === 'cancelled') {
      return Response.json({ error: 'Ingresso cancelado', ticket_status: 'cancelled' }, { status: 400 });
    }

    if (ticket.status === 'used') {
      return Response.json({ error: 'Ingresso já utilizado', ticket_status: 'used', checked_in_at: ticket.checked_in_at }, { status: 400 });
    }

    // SEGURANÇA: ticket só é válido se status=valid E pagamento confirmado
    if (ticket.status !== 'valid' || ticket.payment_status !== 'confirmed') {
      return Response.json({ error: 'Pagamento pendente — ingresso não pode ser validado', ticket_status: ticket.status, payment_status: ticket.payment_status }, { status: 400 });
    }

    // Realizar check-in
    const updated = await base44.asServiceRole.entities.Ticket.update(ticket.id, {
      status: 'used',
      checked_in_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      ticket: updated,
      event: { id: event.id, title: event.title },
    });

  } catch (error) {
    console.error('❌ Erro em checkInTicket:', error);
    return Response.json({ error: 'Erro interno ao processar check-in' }, { status: 500 });
  }
});