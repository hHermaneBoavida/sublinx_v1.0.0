import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { csvCell } from '../../shared/sanitize.ts';
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

    const { reportType } = await req.json();

    const events = await base44.asServiceRole.entities.Event.filter({ organizer_id: user.id });
    const eventIds = events.map(e => e.id);

    // SEGURANÇA: filtrar tickets no banco por event_id do organizador — nunca listar tudo.
    const organizerTickets = eventIds.length > 0
      ? await base44.asServiceRole.entities.Ticket.filter({ event_id: { $in: eventIds } }, '', 1000)
      : [];

    let csvContent = '';

    if (reportType === 'sales') {
      // Sales Report
      csvContent = 'Data,Evento,Tipo Ingresso,Quantidade,Preco,Status,Comprador\n';
      
      organizerTickets.forEach(ticket => {
        const event = events.find(e => e.id === ticket.event_id);
        const date = new Date(ticket.created_date).toLocaleDateString('pt-BR');
        const buyerName = ticket.attendee_info?.full_name || 'N/A';
        
        const safeTitle = csvCell(event?.title || 'N/A');
        const safeType = csvCell(ticket.ticket_type || 'Padrão');
        const safeStatus = csvCell(ticket.status);
        const safeBuyer = csvCell(buyerName);
        csvContent += `${date},"${safeTitle}","${safeType}",${ticket.quantity || 1},${ticket.price || 0},"${safeStatus}","${safeBuyer}"\n`;
      });
    } else if (reportType === 'attendees') {
      // Attendees Report
      csvContent = 'Nome,Email,Telefone,Evento,Tipo Ingresso,Preco,Status,Check-in\n';
      
      organizerTickets.forEach(ticket => {
        const event = events.find(e => e.id === ticket.event_id);
        const info = ticket.attendee_info || {};
        const checkinStatus = ticket.checked_in_at ? 'Sim' : 'Não';
        
        const safeName = csvCell(info.full_name || 'N/A');
        const safeEmail = csvCell(info.email || 'N/A');
        const safePhone = csvCell(info.phone || 'N/A');
        const safeEvTitle = csvCell(event?.title || 'N/A');
        const safeEvType = csvCell(ticket.ticket_type || 'Padrão');
        const safeEvStatus = csvCell(ticket.status);
        const safeCheckin = csvCell(checkinStatus);
        csvContent += `"${safeName}","${safeEmail}","${safePhone}","${safeEvTitle}","${safeEvType}",${ticket.price || 0},"${safeEvStatus}","${safeCheckin}"\n`;
      });
    } else if (reportType === 'events') {
      // Events Summary Report
      csvContent = 'Evento,Data,Vendidos,Capacidade,Ocupacao,Receita,Status\n';
      
      events.forEach(event => {
        const eventTickets = organizerTickets.filter(t => t.event_id === event.id && t.status !== 'cancelled');
        const sold = eventTickets.length;
        const capacity = event.max_capacity || 0;
        const occupancy = capacity > 0 ? ((sold / capacity) * 100).toFixed(1) : 0;
        const revenue = eventTickets.reduce((sum, t) => sum + (t.price || 0), 0);
        const eventDate = new Date(event.date).toLocaleDateString('pt-BR');
        const status = new Date(event.date) > new Date() ? 'Próximo' : 'Realizado';
        
        const safeTitle = csvCell(event.title);
        csvContent += `"${safeTitle}",${eventDate},${sold},${capacity},${occupancy}%,${revenue.toFixed(2)},${status}\n`;
      });
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-${reportType}-${Date.now()}.csv"`
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ error: 'Erro ao gerar relatório' }, { status: 500 });
  }
});