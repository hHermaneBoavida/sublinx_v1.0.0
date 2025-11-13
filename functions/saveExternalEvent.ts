import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!user.is_organizer) {
      return Response.json({ 
        error: 'Apenas organizadores podem importar eventos externos' 
      }, { status: 403 });
    }

    const { externalEvent } = await req.json();

    if (!externalEvent || !externalEvent.title) {
      return Response.json({ 
        error: 'Dados do evento inválidos' 
      }, { status: 400 });
    }

    // Verificar duplicatas
    const existingEvents = await base44.asServiceRole.entities.Event.filter({
      external_id: externalEvent.id,
      organizer_id: user.id
    });

    if (existingEvents && existingEvents.length > 0) {
      return Response.json({
        success: false,
        message: 'Evento já importado',
        event: existingEvents[0]
      });
    }

    // Criar evento na plataforma
    const newEvent = await base44.asServiceRole.entities.Event.create({
      title: externalEvent.title,
      description: externalEvent.description || '',
      genre: externalEvent.genre || 'house',
      type: externalEvent.type || 'club',
      location: externalEvent.location || {
        lat: -23.5505,
        lng: -46.6333,
        venue_name: 'Venue',
        address: 'Endereço'
      },
      date: externalEvent.date,
      duration_hours: 4,
      price: externalEvent.price || 0,
      organizer: user.full_name,
      organizer_id: user.id,
      organizer_avatar: user.avatar_url,
      image_url: externalEvent.image_url || '',
      vibe_tags: externalEvent.vibe_tags || [],
      current_attendees: 0,
      max_capacity: externalEvent.max_capacity || 500,
      requires_approval: false,
      is_external: true,
      external_id: externalEvent.id,
      external_source: externalEvent.source,
      external_url: externalEvent.external_url
    });

    // Registrar na entidade TicketPlatformIntegration
    try {
      await base44.asServiceRole.entities.TicketPlatformIntegration.create({
        user_id: user.id,
        event_id: newEvent.id,
        platform: externalEvent.source || 'external',
        external_event_id: externalEvent.id,
        external_url: externalEvent.external_url,
        sync_status: 'active',
        last_sync: new Date().toISOString()
      });
    } catch (e) {
      console.log('Integração já existe ou erro:', e);
    }

    return Response.json({
      success: true,
      message: 'Evento importado com sucesso!',
      event: newEvent
    });

  } catch (error) {
    console.error('Erro ao salvar evento externo:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});