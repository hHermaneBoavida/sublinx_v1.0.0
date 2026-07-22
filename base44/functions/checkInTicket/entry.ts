import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * SUBLINX — Check-in Seguro de Ingresso
 *
 * Valida server-side que:
 * - O usuário é o organizador do evento do ticket OU admin.
 * - O ticket está com status 'valid' e pagamento 'confirmed'.
 * - Marca o ticket como 'used' com timestamp.
 *
 * O frontend NÃO pode atualizar o status do ticket diretamente via SDK.
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

    // Buscar ticket via asServiceRole (bypass RLS — validação de propriedade abaixo)
    let ticket;
    try {
      if (qr_code_data) {
        const tickets = await base44.asServiceRole.entities.Ticket.filter({ qr_code_data });
        ticket = tickets[0];
      } else {
        ticket = await base44.asServiceRole.entities.Ticket.get(ticket_id);
      }
    } catch {
      // Ticket não encontrado — retorna 404 abaixo
    }

    if (!ticket) {
      return Response.json({ error: 'Ingresso não encontrado' }, { status: 404 });
    }

    // Buscar evento e validar propriedade
    let event;
    try {
      event = await base44.asServiceRole.entities.Event.get(ticket.event_id);
    } catch {
      return Response.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const isOrganizer = event.organizer_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return Response.json({ error: 'Acesso negado — você não é o organizador deste evento' }, { status: 403 });
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