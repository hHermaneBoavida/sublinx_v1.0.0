/**
 * SEARCH CACHE SERVICE
 * Cache inteligente de resultados de busca
 * Evita re-processar buscas repetidas
 */

class SearchCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 50; // Máximo de 50 buscas em cache
    this.ttl = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Gera chave normalizada da busca
   */
  generateKey(query, filters = {}) {
    const normalizedQuery = query.toLowerCase().trim();
    const filterStr = JSON.stringify(filters);
    return `${normalizedQuery}::${filterStr}`;
  }

  /**
   * Busca no cache
   */
  get(query, filters = {}) {
    const key = this.generateKey(query, filters);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Verificar expiração
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar last access
    cached.lastAccess = Date.now();
    cached.hits++;

    console.log(`✅ Cache HIT: "${query}" (${cached.hits} hits)`);
    return cached.data;
  }

  /**
   * Salva no cache
   */
  set(query, filters = {}, data) {
    const key = this.generateKey(query, filters);

    // Se cache cheio, remover menos usado
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      hits: 0
    });

    console.log(`💾 Cache SET: "${query}" (total: ${this.cache.size})`);
  }

  /**
   * Remove item menos recentemente usado
   */
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
      console.log(`🗑️ Cache EVICT: ${oldestKey}`);
    }
  }

  /**
   * Limpa cache expirado
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cache CLEANUP: ${cleaned} itens removidos`);
    }
  }

  /**
   * Limpa todo cache
   */
  clear() {
    this.cache.clear();
    console.log('🗑️ Cache CLEARED');
  }

  /**
   * Estatísticas do cache
   */
  getStats() {
    let totalHits = 0;
    let avgAge = 0;

    this.cache.forEach(value => {
      totalHits += value.hits;
      avgAge += (Date.now() - value.timestamp);
    });

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      avgHits: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      avgAge: this.cache.size > 0 ? avgAge / this.cache.size / 1000 : 0, // em segundos
      hitRate: totalHits > 0 ? (totalHits / (totalHits + this.cache.size)) * 100 : 0
    };
  }
}

// Singleton instance
export const searchCache = new SearchCache();

// Cleanup periódico (a cada 2 minutos)
if (typeof window !== 'undefined') {
  setInterval(() => {
    searchCache.cleanup();
  }, 2 * 60 * 1000);
}

export default searchCache;