import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || !user.is_organizer) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType } = await req.json();

    const [events, tickets] = await Promise.all([
      base44.asServiceRole.entities.Event.filter({ organizer_id: user.id }),
      base44.asServiceRole.entities.Ticket.list('', 1000)
    ]);

    const eventIds = events.map(e => e.id);
    const organizerTickets = tickets.filter(t => eventIds.includes(t.event_id));

    let csvContent = '';

    if (reportType === 'sales') {
      // Sales Report
      csvContent = 'Data,Evento,Tipo Ingresso,Quantidade,Preco,Status,Comprador\n';
      
      organizerTickets.forEach(ticket => {
        const event = events.find(e => e.id === ticket.event_id);
        const date = new Date(ticket.created_date).toLocaleDateString('pt-BR');
        const buyerName = ticket.attendee_info?.full_name || 'N/A';
        
        csvContent += `${date},"${event?.title || 'N/A'}","${ticket.ticket_type || 'Padrão'}",${ticket.quantity || 1},${ticket.price || 0},${ticket.status},"${buyerName}"\n`;
      });
    } else if (reportType === 'attendees') {
      // Attendees Report
      csvContent = 'Nome,Email,Telefone,Evento,Tipo Ingresso,Preco,Status,Check-in\n';
      
      organizerTickets.forEach(ticket => {
        const event = events.find(e => e.id === ticket.event_id);
        const info = ticket.attendee_info || {};
        const checkinStatus = ticket.checked_in_at ? 'Sim' : 'Não';
        
        csvContent += `"${info.full_name || 'N/A'}","${info.email || 'N/A'}","${info.phone || 'N/A'}","${event?.title || 'N/A'}","${ticket.ticket_type || 'Padrão'}",${ticket.price || 0},${ticket.status},${checkinStatus}\n`;
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
        
        csvContent += `"${event.title}",${eventDate},${sold},${capacity},${occupancy}%,${revenue.toFixed(2)},${status}\n`;
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});