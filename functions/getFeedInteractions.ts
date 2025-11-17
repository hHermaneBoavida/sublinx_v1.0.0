import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_ids } = await req.json();
    
    if (!event_ids || !Array.isArray(event_ids) || event_ids.length === 0) {
      return Response.json({ 
        likes: {}, 
        comments: {}, 
        requests: {} 
      });
    }

    // Batch fetch all interactions in parallel
    const [likes, comments, requests] = await Promise.all([
      base44.entities.Like.filter({ event_id: { $in: event_ids } }),
      base44.entities.Comment.filter({ event_id: { $in: event_ids } }),
      base44.entities.EventRequest.filter({ 
        user_id: user.id, 
        event_id: { $in: event_ids } 
      })
    ]);

    // Group by event_id for efficient lookup
    const groupedLikes = {};
    const groupedComments = {};
    const requestsMap = {};

    likes.forEach(like => {
      if (!groupedLikes[like.event_id]) groupedLikes[like.event_id] = [];
      groupedLikes[like.event_id].push(like);
    });

    comments.forEach(comment => {
      if (!groupedComments[comment.event_id]) groupedComments[comment.event_id] = [];
      groupedComments[comment.event_id].push(comment);
    });

    requests.forEach(request => {
      requestsMap[request.event_id] = request.status;
    });

    return Response.json({
      likes: groupedLikes,
      comments: groupedComments,
      requests: requestsMap,
      user_id: user.id
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