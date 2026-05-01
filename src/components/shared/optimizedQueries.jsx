import { useQuery, useQueries, useInfiniteQuery } from "@tanstack/react-query";
import { useQuery, useQueries, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";

// =====================================================
// QUERY KEY FACTORY
// =====================================================

export const queryKeys = {
  // Events
  events: (filters) => ['events', filters],
  eventDetail: (id) => ['event', id],
  eventMetrics: (id) => ['eventMetrics', id],
  eventTicketTypes: (id) => ['ticketTypes', id],
  eventVibes: (id) => ['eventVibes', id],
  nearbyEvents: (lat, lng, radius) => ['nearbyEvents', lat, lng, radius],
  
  // User
  currentUser: ['currentUser'],
  userProfile: (id) => ['user', id],
  userPreferences: (id) => ['userPreferences', id],
  userGenres: (id) => ['userGenres', id],
  userTickets: (id) => ['userTickets', id],
  userBadges: (id) => ['userBadges', id],
  
  // Social
  userFeed: (userId, page) => ['userFeed', userId, page],
  followers: (id) => ['followers', id],
  following: (id) => ['following', id],
  
  // Interactions
  eventLikes: (eventId) => ['likes', eventId],
  eventComments: (eventId) => ['comments', eventId],
  userLikes: (userId) => ['userLikes', userId],
  
  // Organizer
  organizerEvents: (id) => ['organizerEvents', id],
  organizerDashboard: (id) => ['organizerDashboard', id],
};

// =====================================================
// CACHE CONFIGURATIONS
// =====================================================

export const CACHE_CONFIGS = {
  // Data that rarely changes
  static: {
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 120, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  },
  
  // Data that changes occasionally
  medium: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  },
  
  // Data that changes frequently
  short: {
    staleTime: 1000 * 30, // 30 seconds
    cacheTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60000 // 1 minute
  },
  
  // Real-time data
  realtime: {
    staleTime: 1000 * 10, // 10 seconds
    cacheTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: false
  }
};

// =====================================================
// OPTIMIZED HOOKS
// =====================================================

/**
 * Fetch event with all related data in parallel
 */
export function useEventWithDetails(eventId) {
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.eventDetail(eventId),
        queryFn: async () => {
          const events = await base44.entities.Event.filter({ id: eventId });
          return events[0];
        },
        enabled: !!eventId,
        ...CACHE_CONFIGS.medium
      },
      {
        queryKey: queryKeys.eventMetrics(eventId),
        queryFn: async () => {
          const metrics = await base44.entities.EventMetrics.filter({ event_id: eventId });
          return metrics[0];
        },
        enabled: !!eventId,
        ...CACHE_CONFIGS.realtime
      },
      {
        queryKey: queryKeys.eventTicketTypes(eventId),
        queryFn: () => base44.entities.TicketType.filter({ event_id: eventId }),
        enabled: !!eventId,
        ...CACHE_CONFIGS.static
      },
      {
        queryKey: queryKeys.eventVibes(eventId),
        queryFn: () => base44.entities.EventVibe.filter({ event_id: eventId }),
        enabled: !!eventId,
        ...CACHE_CONFIGS.static
      }
    ]
  });
  
  return {
    event: queries[0].data,
    metrics: queries[1].data,
    ticketTypes: queries[2].data || [],
    vibes: queries[3].data || [],
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError)
  };
}

/**
 * Search events by radius using optimized backend function
 */
export function useNearbyEvents(lat, lng, radius_km = 10, options = {}) {
  return useQuery({
    queryKey: queryKeys.nearbyEvents(lat, lng, radius_km),
    queryFn: async () => {
      const response = await base44.functions.invoke('searchEventsByRadius', {
        lat,
        lng,
        radius_km,
        ...options
      });
      return response.data;
    },
    enabled: !!lat && !!lng,
    ...CACHE_CONFIGS.medium,
    select: (data) => data?.events || []
  });
}

/**
 * Get optimized user feed with pagination
 */
export function useUserFeed(page = 0, limit = 20) {
  return useQuery({
    queryKey: queryKeys.userFeed('current', page),
    queryFn: async () => {
      const response = await base44.functions.invoke('getUserFeed', {
        page,
        limit
      });
      return response.data;
    },
    ...CACHE_CONFIGS.short,
    keepPreviousData: true
  });
}

/**
 * Infinite scroll for events feed
 */
export function useInfiniteEventsFeed() {
  return useInfiniteQuery({
    queryKey: ['eventsFeed'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await base44.functions.invoke('getUserFeed', {
        page: pageParam,
        limit: 20
      });
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length;
    },
    ...CACHE_CONFIGS.short
  });
}

/**
 * Get user profile with all data
 */
export function useUserProfile(userId) {
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.userProfile(userId),
        queryFn: async () => {
          const users = await base44.entities.User.filter({ id: userId });
          return users[0];
        },
        enabled: !!userId,
        ...CACHE_CONFIGS.medium
      },
      {
        queryKey: queryKeys.userPreferences(userId),
        queryFn: async () => {
          const prefs = await base44.entities.UserPreferences.filter({ user_id: userId });
          return prefs[0];
        },
        enabled: !!userId,
        ...CACHE_CONFIGS.static
      },
      {
        queryKey: queryKeys.userGenres(userId),
        queryFn: () => base44.entities.UserGenre.filter({ user_id: userId }),
        enabled: !!userId,
        ...CACHE_CONFIGS.static
      }
    ]
  });
  
  return {
    user: queries[0].data,
    preferences: queries[1].data,
    genres: queries[2].data || [],
    isLoading: queries.some(q => q.isLoading)
  };
}

/**
 * Batch fetch event metrics for multiple events
 */
export function useEventsMetrics(eventIds = []) {
  return useQuery({
    queryKey: ['eventsMetrics', eventIds.join(',')],
    queryFn: async () => {
      if (eventIds.length === 0) return {};
      
      const metrics = await base44.entities.EventMetrics.filter({
        event_id: { $in: eventIds }
      });
      
      return metrics.reduce((acc, m) => {
        acc[m.event_id] = m;
        return acc;
      }, {});
    },
    enabled: eventIds.length > 0,
    ...CACHE_CONFIGS.realtime
  });
}

/**
 * Get user tickets with event details
 */
export function useUserTicketsWithEvents(userId) {
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: queryKeys.userTickets(userId),
    queryFn: () => base44.entities.Ticket.filter({ 
      user_id: userId,
      status: 'valid'
    }, '-created_date'),
    enabled: !!userId,
    ...CACHE_CONFIGS.medium
  });
  
  const eventIds = tickets?.map(t => t.event_id) || [];
  
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['ticketEvents', eventIds.join(',')],
    queryFn: async () => {
      if (eventIds.length === 0) return [];
      return await base44.entities.Event.filter({ id: { $in: eventIds } });
    },
    enabled: eventIds.length > 0,
    ...CACHE_CONFIGS.medium
  });
  
  const ticketsWithEvents = tickets?.map(ticket => {
    const event = events?.find(e => e.id === ticket.event_id);
    return { ...ticket, event };
  }) || [];
  
  return {
    tickets: ticketsWithEvents,
    isLoading: ticketsLoading || eventsLoading
  };
}

/**
 * Prefetch related data
 */
export function usePrefetchEventDetails(eventId) {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.eventDetail(eventId),
      queryFn: async () => {
        const events = await base44.entities.Event.filter({ id: eventId });
        return events[0];
      }
    });
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.eventMetrics(eventId),
      queryFn: async () => {
        const metrics = await base44.entities.EventMetrics.filter({ event_id: eventId });
        return metrics[0];
      }
    });
  };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Invalidate all event-related queries
 */
export function invalidateEventQueries(queryClient, eventId) {
  queryClient.invalidateQueries(queryKeys.eventDetail(eventId));
  queryClient.invalidateQueries(queryKeys.eventMetrics(eventId));
  queryClient.invalidateQueries(queryKeys.eventLikes(eventId));
  queryClient.invalidateQueries(queryKeys.eventComments(eventId));
}

/**
 * Batch update event metrics
 */
export async function batchUpdateEventMetrics(eventIds) {
  const promises = eventIds.map(async (eventId) => {
    const [tickets, likes, comments] = await Promise.all([
      base44.entities.Ticket.filter({ event_id: eventId }),
      base44.entities.Like.filter({ event_id: eventId }),
      base44.entities.Comment.filter({ event_id: eventId })
    ]);
    
    const metrics = await base44.entities.EventMetrics.filter({ event_id: eventId });
    
    const metricsData = {
      tickets_sold: tickets.length,
      attendees_count: tickets.filter(t => t.status === 'valid').length,
      revenue: tickets.reduce((sum, t) => sum + (t.price || 0), 0),
      likes_count: likes.length,
      comments_count: comments.length,
      last_updated: new Date().toISOString()
    };
    
    if (metrics[0]) {
      return base44.entities.EventMetrics.update(metrics[0].id, metricsData);
    } else {
      return base44.entities.EventMetrics.create({ event_id: eventId, ...metricsData });
    }
  });
  
  return Promise.allSettled(promises);
}