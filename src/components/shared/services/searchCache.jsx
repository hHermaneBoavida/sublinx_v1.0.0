/**
 * SEARCH CACHE SERVICE - OTIMIZADO
 * Cache inteligente com cleanup automático
 */

class SearchCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 30; // REDUZIDO: 30 itens (era 50)
    this.ttl = 3 * 60 * 1000; // REDUZIDO: 3min (era 5min)
  }

  generateKey(query, filters = {}) {
    const normalizedQuery = query.toLowerCase().trim();
    const filterStr = JSON.stringify(filters);
    return `${normalizedQuery}::${filterStr}`;
  }

  get(query, filters = {}) {
    const key = this.generateKey(query, filters);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Verificar expiração
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    cached.lastAccess = Date.now();
    cached.hits++;

    return cached.data;
  }

  set(query, filters = {}, data) {
    const key = this.generateKey(query, filters);

    // Se cache cheio, limpar automaticamente
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      hits: 0
    });
  }

  evictLRU() {
    let oldestKey = null;
    let oldestAccess = Infinity;

    this.cache.forEach((value, key) => {
      if (value.lastAccess < oldestAccess) {
        oldestAccess = value.lastAccess;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    return cleaned;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    let totalHits = 0;

    this.cache.forEach(value => {
      totalHits += value.hits;
    });

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      hitRate: totalHits > 0 ? (totalHits / (totalHits + this.cache.size)) * 100 : 0
    };
  }
}

// Singleton
export const searchCache = new SearchCache();

// OTIMIZAÇÃO: Cleanup mais frequente (1min)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cleaned = searchCache.cleanup();
    if (cleaned > 0) {
      console.log(`Cache: ${cleaned} itens expirados removidos`);
    }
  }, 60 * 1000); // 1min
}

export default searchCache;