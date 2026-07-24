import { useEffect, useState } from 'react';

// CONFIGURAÇÕES DE CACHE OTIMIZADAS - V2
// ====================================

export const CACHE_CONFIG = {
  // Dados em tempo real (30s) - Eventos ao vivo, notificações
  REALTIME: {
    staleTime: 30000,
    gcTime: 60000,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  },
  
  // Dados que mudam frequentemente (2min) - Feed, interactions
  SHORT: {
    staleTime: 120000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  },
  
  // Dados moderados (10min) - Eventos, tickets
  MEDIUM: {
    staleTime: 600000,
    gcTime: 1200000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  },
  
  // Dados que raramente mudam (1h) - Badges, histórico, reviews
  LONG: {
    staleTime: 3600000,
    gcTime: 7200000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  },
  
  // Dados estáticos (infinito) - User, schemas, venues
  STATIC: {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  }
};

// ====================================
// QUERY KEYS PADRONIZADOS
// ====================================

export const queryKeys = {
  // User
  currentUser: () => ['currentUser'],
  profileUser: (userId) => ['profileUser', userId],
  userTickets: (userId) => ['userTickets', userId],
  organizerStats: (userId) => ['organizerStats', userId],
  
  // Events
  events: () => ['events'],
  event: (eventId) => ['event', eventId],
  eventsByOrganizer: (organizerId) => ['eventsByOrganizer', organizerId],
  futureEvents: () => ['futureEvents'],
  nearbyEvents: (lat, lng) => ['nearbyEvents', lat, lng],
  
  // Interactions
  feedInteractions: (userId, eventIds) => ['feedInteractions', userId, eventIds?.length],
  likes: (eventId) => ['likes', eventId],
  comments: (eventId) => ['comments', eventId],
  
  // Reviews
  eventReviews: (eventId) => ['eventReviews', eventId],
  reviewUsers: (count) => ['reviewUsers', count],
  
  // Guest List
  guestList: (eventId) => ['guestList', eventId],
  guestStatus: (eventId, userId) => ['guestStatus', eventId, userId],
  
  // Notifications
  notifications: (userId) => ['notifications', userId],
  unreadCount: (userId) => ['unreadCount', userId],

  // Analytics
  dashboardMetrics: (userId) => ['dashboardMetrics', userId],
  eventPolls: (eventId) => ['eventPolls', eventId],
  pollVotes: (eventId) => ['pollVotes', eventId],
};

// ====================================
// PREFETCH HELPERS
// ====================================

export function prefetchEventDetails(queryClient, eventId) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.event(eventId),
    queryFn: async () => {
      const { base44 } = await import('@/api/base44Client');
      const events = await base44.entities.Event.filter({ id: eventId });
      return events[0];
    },
    staleTime: Infinity,
  });
}

export function prefetchUserProfile(queryClient, userId) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.profileUser(userId),
    queryFn: async () => {
      const { base44 } = await import('@/api/base44Client');
      const users = await base44.entities.User.filter({ id: userId });
      return users[0];
    },
    staleTime: Infinity,
  });
}

export function prefetchEventInteractions(queryClient, eventId) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.likes(eventId),
      queryFn: async () => {
        const { base44 } = await import('@/api/base44Client');
        return await base44.entities.Like.filter({ event_id: eventId });
      },
      staleTime: 120000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.comments(eventId),
      queryFn: async () => {
        const { base44 } = await import('@/api/base44Client');
        return await base44.entities.Comment.filter({ event_id: eventId });
      },
      staleTime: 120000,
    }),
  ]);
}

// ====================================
// DEBOUNCE E THROTTLE
// ====================================

export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ====================================
// BATCH PROCESSOR
// ====================================

export class BatchProcessor {
  constructor(batchSize = 10, delay = 50) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.processing = false;
  }

  add(item) {
    this.queue.push(item);
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      try {
        await Promise.all(batch.map(item => 
          typeof item === 'function' ? item() : item
        ));
      } catch (error) {
        console.error('Batch processing error:', error);
      }
      
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.processing = false;
  }
}

// ====================================
// LAZY IMAGE LOADING
// ====================================

export function preloadImages(urls) {
  return Promise.all(
    urls.map(url => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(url);
      img.src = url;
    }))
  );
}

// ====================================
// LOCAL STORAGE COM LIMITE
// ====================================

export const SafeStorage = {
  set(key, value, maxAge = 86400000) {
    try {
      const item = { value, timestamp: Date.now(), maxAge };
      localStorage.setItem(key, JSON.stringify(item));
      this.cleanup();
    } catch (e) {
      console.warn('LocalStorage full, clearing old items');
      this.cleanup(true);
      try {
        localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now(), maxAge }));
      } catch (err) {
        console.error('Failed to save to localStorage');
      }
    }
  },
  
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const { value, timestamp, maxAge } = JSON.parse(item);
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(key);
        return null;
      }
      return value;
    } catch (e) {
      return null;
    }
  },
  
  cleanup(force = false) {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    keys.forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (force || (item.timestamp && now - item.timestamp > item.maxAge)) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    });
  }
};

// ====================================
// PERFORMANCE MONITOR
// ====================================

export function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  if (end - start > 16) {
    console.warn(`Slow operation: ${name} took ${(end - start).toFixed(2)}ms`);
  }
  return result;
}

// ====================================
// INTERSECTION OBSERVER
// ====================================

export function createIntersectionObserver(callback, options = {}) {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}

// ====================================
// REACT HOOKS
// ====================================

export function useMemoryCleanup(callback, deps = []) {
  useEffect(() => {
    return () => {
      if (typeof callback === 'function') {
        callback();
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useVirtualization(items, containerHeight, itemHeight) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    onScroll: (e) => setScrollTop(e.target.scrollTop)
  };
}

export default {
  CACHE_CONFIG,
  queryKeys,
  prefetchEventDetails,
  prefetchUserProfile,
  debounce,
  throttle,
  BatchProcessor,
  preloadImages,
  SafeStorage,
  measurePerformance,
  createIntersectionObserver,
  useMemoryCleanup,
  useVirtualization
};