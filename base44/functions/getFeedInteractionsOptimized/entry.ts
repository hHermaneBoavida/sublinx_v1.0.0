import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const MAX_EVENTS_PER_REQUEST = 20;
const MAX_LIKES_PER_EVENT = 100;
const MAX_COMMENTS_PER_EVENT = 50;

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_ids } = await req.json();
    
    // Validação rigorosa
    if (!event_ids || !Array.isArray(event_ids)) {
      return Response.json({ error: 'event_ids deve ser um array' }, { status: 400 });
    }

    if (event_ids.length === 0) {
      return Response.json({ 
        likes: {}, 
        comments: {}, 
        requests: {} 
      });
    }

    // Limitar quantidade de eventos
    if (event_ids.length > MAX_EVENTS_PER_REQUEST) {
      return Response.json({ 
        error: `Máximo ${MAX_EVENTS_PER_REQUEST} eventos por requisição` 
      }, { status: 400 });
    }

    // Validar IDs
    if (!event_ids.every(id => typeof id === 'string' && id.length > 0)) {
      return Response.json({ error: 'IDs de eventos inválidos' }, { status: 400 });
    }

    // Batch fetch OTIMIZADO com limites
    const [likes, comments, requests] = await Promise.all([
      base44.entities.Like.filter(
        { event_id: { $in: event_ids } },
        '-created_date',
        MAX_LIKES_PER_EVENT * event_ids.length
      ),
      base44.entities.Comment.filter(
        { event_id: { $in: event_ids } },
        '-created_date',
        MAX_COMMENTS_PER_EVENT * event_ids.length
      ),
      base44.entities.EventRequest.filter({ 
        user_id: user.id, 
        event_id: { $in: event_ids } 
      }, '', event_ids.length)
    ]);

    // Group OTIMIZADO com Map
    const groupedLikes = new Map();
    const groupedComments = new Map();
    const requestsMap = new Map();

    likes.forEach(like => {
      if (!groupedLikes.has(like.event_id)) {
        groupedLikes.set(like.event_id, []);
      }
      groupedLikes.get(like.event_id).push(like);
    });

    comments.forEach(comment => {
      if (!groupedComments.has(comment.event_id)) {
        groupedComments.set(comment.event_id, []);
      }
      groupedComments.get(comment.event_id).push(comment);
    });

    requests.forEach(request => {
      requestsMap.set(request.event_id, request.status);
    });

    // Converter Maps para Objects
    const result = {
      likes: Object.fromEntries(groupedLikes),
      comments: Object.fromEntries(groupedComments),
      requests: Object.fromEntries(requestsMap),
      user_id: user.id,
      cached_at: new Date().toISOString()
    };

    return Response.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=30',
        'X-Processing-Time': `${Date.now() - startTime}ms`,
        'X-Events-Count': event_ids.length.toString(),
        'Vary': 'Origin'
      }
    });

  } catch (error) {
    console.error('Error fetching feed interactions:', error);
    return Response.json({ 
      error: error.message,
      likes: {},
      comments: {},
      requests: {}
    }, { status: 500 });
  }
});