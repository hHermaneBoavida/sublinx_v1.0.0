import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { hasOrganizerAccess } from '../../shared/subscriptionAuth.ts';

// Batch notification helper
async function createNotificationsInBatches(base44, notifications, batchSize = 50) {
  const chunks = [];
  for (let i = 0; i < notifications.length; i += batchSize) {
    chunks.push(notifications.slice(i, i + batchSize));
  }
  
  for (const chunk of chunks) {
    await Promise.all(chunk.map(notif => 
      base44.asServiceRole.entities.Notification.create(notif)
    ));
    // Delay entre batches para não sobrecarregar
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

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

    const eventData = await req.json();
    
    // Validate required fields
    if (!eventData.title || !eventData.genre || !eventData.type || !eventData.date) {
      return Response.json({ 
        error: 'Campos obrigatórios faltando' 
      }, { status: 400 });
    }

    // Validate date is in future
    if (new Date(eventData.date) <= new Date()) {
      return Response.json({ 
        error: 'Data do evento deve ser no futuro' 
      }, { status: 400 });
    }

    // Create event
    const newEvent = await base44.entities.Event.create({
      ...eventData,
      organizer_id: user.id,
      organizer: user.full_name || user.email.split('@')[0],
      organizer_avatar: user.avatar_url,
      current_attendees: 0
    });

    // Notify followers in batches (non-blocking)
    setTimeout(async () => {
      try {
        const followers = await base44.asServiceRole.entities.Follow.filter({ 
          following_id: user.id 
        });
        
        if (followers && followers.length > 0) {
          const notifications = followers.map(follower => ({
            user_id: follower.follower_id,
            type: 'event_alert',
            title: '🎉 Novo Evento!',
            message: `${user.full_name || user.email.split('@')[0]} criou: ${eventData.title}`,
            event_id: newEvent.id,
            is_read: false,
            location_match: false,
            genre_match: [eventData.genre]
          }));

          await createNotificationsInBatches(base44, notifications);
        }
      } catch (notifError) {
        console.error('Erro ao notificar:', notifError);
        // Não falhar a criação do evento por erro de notificação
      }
    }, 0);

    return Response.json({ 
      success: true, 
      event: newEvent 
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return Response.json({ error: 'Erro ao criar evento' }, { status: 500 });
  }
});