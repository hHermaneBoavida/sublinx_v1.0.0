/**
 * OTIMIZAÇÕES GLOBAIS
 */

// CACHE CONFIGS OTIMIZADOS
export const CACHE_CONFIG = {
  // Dados que mudam frequentemente (likes, comments)
  REALTIME: { 
    staleTime: 10000, // 10s
    cacheTime: 30000, // 30s
    refetchOnWindowFocus: true,
    refetchOnMount: false
  },
  
  // Dados que mudam ocasionalmente (eventos, tickets)
  SHORT: { 
    staleTime: 60000, // 1min
    cacheTime: 300000, // 5min
    refetchOnWindowFocus: false,
    refetchOnMount: false
  },
  
  // Dados que mudam raramente (badges, histórico)
  MEDIUM: { 
    staleTime: 300000, // 5min
    cacheTime: 600000, // 10min
    refetchOnWindowFocus: false,
    refetchOnMount: false
  },
  
  // Dados que quase nunca mudam (user info, planos)
  LONG: { 
    staleTime: 600000, // 10min
    cacheTime: 1800000, // 30min
    refetchOnWindowFocus: false,
    refetchOnMount: false
  },
  
  // Dados estáticos
  STATIC: { 
    staleTime: Infinity, 
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  }
};

// DEBOUNCE HELPER
export function debounce(func, wait) {
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

// THROTTLE HELPER
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// BATCH PROCESSOR - Agrupa múltiplas requisições
export class BatchProcessor {
  constructor(processFn, delay = 100) {
    this.processFn = processFn;
    this.delay = delay;
    this.queue = [];
    this.timer = null;
  }

  add(item) {
    this.queue.push(item);
    
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.process();
    }, this.delay);
  }

  async process() {
    if (this.queue.length === 0) return;

    const items = [...this.queue];
    this.queue = [];

    try {
      await this.processFn(items);
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }
}

// VIRTUAL SCROLLING HELPER
export function useVirtualization(items = [], itemHeight = 100, containerHeight = 600) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = React.useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + 2
    );
    return { start, end };
  }, [scrollTop, items.length, itemHeight, containerHeight]);

  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      ...item,
      index: visibleRange.start + index,
      offsetTop: (visibleRange.start + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  return { visibleItems, setScrollTop, totalHeight: items.length * itemHeight };
}

// MEMORY CLEANUP
export function useMemoryCleanup(cleanupFn, dependencies = []) {
  React.useEffect(() => {
    return () => {
      cleanupFn();
    };
  }, dependencies);
}

// IMAGE PRELOADER
export function preloadImages(urls = []) {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

// LOCAL STORAGE COM LIMITE
export const SafeStorage = {
  setItem(key, value, maxSize = 5 * 1024 * 1024) { // 5MB default
    try {
      const serialized = JSON.stringify(value);
      
      if (serialized.length > maxSize) {
        console.warn(`Item ${key} exceeds size limit`);
        return false;
      }

      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // Limpar itens antigos
        this.clearOldest();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  },

  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  clearOldest() {
    const items = Object.keys(localStorage)
      .filter(key => key.startsWith('sublinx_'))
      .sort();
    
    // Remove oldest 25%
    const toRemove = Math.floor(items.length * 0.25);
    items.slice(0, toRemove).forEach(key => localStorage.removeItem(key));
  }
};

// PERFORMANCE MONITOR
export function measurePerformance(label, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (end - start > 100) {
    console.warn(`⚠️ Slow operation: ${label} took ${Math.round(end - start)}ms`);
  }
  
  return result;
}

// QUERY KEY FACTORY - Evita duplicação de queries
export const queryKeys = {
  user: (id) => ['user', id],
  event: (id) => ['event', id],
  events: (filters) => ['events', filters],
  tickets: (userId) => ['tickets', userId],
  likes: (eventId) => ['likes', eventId],
  comments: (eventId) => ['comments', eventId],
  notifications: (userId) => ['notifications', userId],
  followers: (userId) => ['followers', userId],
  following: (userId) => ['following', userId]
};