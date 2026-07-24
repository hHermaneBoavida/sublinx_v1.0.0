import { base44 } from "@/api/base44Client";

/**
 * SERVIÇO DE QUERIES EM BATCH
 * Elimina N+1 queries no Feed
 * Reduz 40+ requests para 4 requests
 */

/**
 * Busca dados completos de múltiplos eventos em batch
 * @param {string[]} eventIds - Array de IDs de eventos
 * @param {string} userId - ID do usuário atual
 * @returns {Promise<Object>} { likes, comments, requests, organizers }
 */
export async function fetchEventInteractionsBatch(eventIds, userId) {
  if (!eventIds || eventIds.length === 0) {
    return {
      likes: {},
      comments: {},
      requests: {},
      organizers: {}
    };
  }

  try {
    // BATCH 1: Buscar todas interações de uma vez
    const [likesRes, commentsRes, requestsRes] = await Promise.allSettled([
      base44.entities.Like.filter({ event_id: { $in: eventIds } }),
      base44.entities.Comment.filter({ event_id: { $in: eventIds } }),
      userId ? base44.entities.EventRequest.filter({ 
        user_id: userId, 
        event_id: { $in: eventIds } 
      }) : Promise.resolve([])
    ]);

    const likes = likesRes.status === 'fulfilled' ? likesRes.value : [];
    const comments = commentsRes.status === 'fulfilled' ? commentsRes.value : [];
    const requests = requestsRes.status === 'fulfilled' ? requestsRes.value : [];

    // BATCH 2: Buscar organizadores únicos
    const organizerIds = [...new Set(eventIds.map(id => {
      // Precisamos buscar do evento original, mas aqui só temos IDs
      // Isso será feito no componente pai
      return null;
    }).filter(Boolean))];

    // Organizar por evento
    const likesByEvent = groupByEventId(likes);
    const commentsByEvent = groupByEventId(comments);
    const requestsByEvent = requests.reduce((acc, req) => {
      acc[req.event_id] = req.status;
      return acc;
    }, {});

    return {
      likes: likesByEvent,
      comments: commentsByEvent,
      requests: requestsByEvent,
      organizers: {} // Será preenchido externamente
    };
  } catch (error) {
    console.error('Erro no batch de interações:', error);
    return {
      likes: {},
      comments: {},
      requests: {},
      organizers: {}
    };
  }
}

/**
 * Busca organizadores em batch
 * @param {string[]} organizerIds - IDs únicos de organizadores
 * @returns {Promise<Object>} Map de organizer_id -> organizer data
 */
export async function fetchOrganizersBatch(organizerIds) {
  if (!organizerIds || organizerIds.length === 0) return {};

  try {
    const uniqueIds = [...new Set(organizerIds)];
    const organizers = await base44.entities.User.filter({ 
      id: { $in: uniqueIds } 
    });

    return organizers.reduce((acc, org) => {
      acc[org.id] = org;
      return acc;
    }, {});
  } catch (error) {
    console.error('Erro ao buscar organizadores:', error);
    return {};
  }
}

// Helper: Agrupar por event_id
function groupByEventId(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.event_id]) acc[item.event_id] = [];
    acc[item.event_id].push(item);
    return acc;
  }, {});
}

/**
 * Busca dados completos de followers/following em batch
 * @param {string} userId 
 * @returns {Promise<Object>} { followers, following, followersUsers, followingUsers }
 */
export async function fetchSocialDataBatch(userId) {
  if (!userId) return { followers: [], following: [], followersUsers: [], followingUsers: [] };

  try {
    const [followers, following] = await Promise.all([
      base44.entities.Follow.filter({ following_id: userId }),
      base44.entities.Follow.filter({ follower_id: userId })
    ]);

    const followerIds = followers.map(f => f.follower_id);
    const followingIds = following.map(f => f.following_id);

    const [followersUsers, followingUsers] = await Promise.all([
      followerIds.length > 0 
        ? base44.entities.User.filter({ id: { $in: followerIds } })
        : Promise.resolve([]),
      followingIds.length > 0
        ? base44.entities.User.filter({ id: { $in: followingIds } })
        : Promise.resolve([])
    ]);

    return {
      followers,
      following,
      followersUsers: followersUsers || [],
      followingUsers: followingUsers || []
    };
  } catch (error) {
    console.error('Erro ao buscar dados sociais:', error);
    return { followers: [], following: [], followersUsers: [], followingUsers: [] };
  }
}