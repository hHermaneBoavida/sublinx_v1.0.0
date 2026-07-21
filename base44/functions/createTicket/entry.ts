import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event_id, ticket_type_name, ticket_type_id, quantity, payment_method, is_vip_guest } = body;

    // Validação de campos obrigatórios
    if (!event_id || !ticket_type_name || !payment_method) {
      return Response.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const qty = Math.max(1, Math.min(10, parseInt(quantity) || 1));

    // Buscar o evento para validar ticket type e calcular preço
    const events = await base44.entities.Event.list();
    const event = events.find(e => e.id === event_id);
    if (!event) {
      return Response.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Encontrar o ticket type no evento
    const ticketTypes = event.ticket_types || [];
    const ticketType = ticketType_id
      ? ticketTypes.find(tt => tt.id === ticket_type_id)
      : ticketTypes.find(tt => tt.name === ticket_type_name);

    if (!ticketType) {
      return Response.json({ error: 'Tipo de ingresso inválido' }, { status: 400 });
    }

    // Validar disponibilidade
    const soldCount = ticketType.quantity_sold || 0;
    if (ticketType.quantity_available > 0 && soldCount + qty > ticketType.quantity_available) {
      return Response.json({ error: 'Ingressos esgotados' }, { status: 400 });
    }

    // Calcular preço final
    let finalPrice = ticketType.price * qty;

    // Verificar VIP guest list se aplicável
    let isVip = false;
    if (is_vip_guest) {
      const guests = await base44.entities.GuestList.filter({
        event_id: event_id,
        guest_user_id: user.id
      });
      const guestEntry = guests[0];
      if (guestEntry && guestEntry.status === 'accepted') {
        isVip = true;
        const discount = guestEntry.discount_percentage || 0;
        finalPrice = finalPrice * (1 - discount / 100);
      } else {
        return Response.json({ error: 'Guest list inválida' }, { status: 403 });
      }
    }

    // Validar método de pagamento
    const validMethods = ['pix', 'credit_card', 'debit_card', 'cash', 'vip_free'];
    if (!validMethods.includes(payment_method)) {
      return Response.json({ error: 'Método de pagamento inválido' }, { status: 400 });
    }

    // Gerar QR code
    const qrCodeData = `SUBLINX:${Date.now()}:${user.id}:${event_id}:${ticketType.id || ticket_type_name}`;

    // SEGURANÇA: ID de transação gerado server-side — nunca confiar no cliente.
    // Status do pagamento permanece 'pending' até confirmação via webhook assinado do gateway.
    const serverTransactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // Criar o ticket no backend com status controlado server-side
    const ticket = await base44.entities.Ticket.create({
      user_id: user.id,
      event_id: event_id,
      ticket_type: ticket_type_name + (isVip ? ' (VIP)' : ''),
      price: finalPrice,
      quantity: qty,
      qr_code_data: qrCodeData,
      status: payment_method === 'vip_free' ? 'valid' : 'valid',
      payment_method: payment_method,
      payment_status: payment_method === 'vip_free' ? 'confirmed' : 'pending',
      transaction_id: serverTransactionId,
      attendee_info: {
        full_name: user.full_name || user.display_name || '',
        email: user.email || ''
      }
    });

    // Atualizar attendee count
    await base44.entities.Event.update(event_id, {
      current_attendees: (event.current_attendees || 0) + qty
    });

    // Atualizar quantidade vendida do ticket type
    if (ticketType.id) {
      const updatedTicketTypes = ticketTypes.map(tt => {
        if (tt.id === ticketType.id) {
          return { ...tt, quantity_sold: (tt.quantity_sold || 0) + qty };
        }
        return tt;
      });
      await base44.entities.Event.update(event_id, { ticket_types: updatedTicketTypes });
    }

    // Marcar guest list como usada se VIP
    if (isVip) {
      const guests = await base44.entities.GuestList.filter({
        event_id: event_id,
        guest_user_id: user.id
      });
      if (guests[0]) {
        await base44.entities.GuestList.update(guests[0].id, {
          status: 'used',
          used_at: new Date().toISOString()
        });
      }
    }

    return Response.json({
      success: true,
      ticket: ticket
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return Response.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
});