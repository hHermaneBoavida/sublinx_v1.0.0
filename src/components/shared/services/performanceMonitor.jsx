/**
 * PERFORMANCE MONITOR
 * Monitora e otimiza performance da app
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTimes: [],
      apiCalls: [],
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  // Medir tempo de render
  measureRender(componentName, startTime) {
    const duration = performance.now() - startTime;
    
    this.metrics.renderTimes.push({
      component: componentName,
      duration,
      timestamp: Date.now()
    });

    // Manter apenas últimos 50
    if (this.metrics.renderTimes.length > 50) {
      this.metrics.renderTimes.shift();
    }

    // Alertar se lento
    if (duration > 100) {
      console.warn(`Render lento: ${componentName} (${duration.toFixed(2)}ms)`);
    }
  }

  // Medir API call
  measureAPI(endpoint, startTime, success = true) {
    const duration = performance.now() - startTime;
    
    this.metrics.apiCalls.push({
      endpoint,
      duration,
      success,
      timestamp: Date.now()
    });

    if (this.metrics.apiCalls.length > 50) {
      this.metrics.apiCalls.shift();
    }

    if (duration > 1000) {
      console.warn(`API lenta: ${endpoint} (${duration.toFixed(2)}ms)`);
    }
  }

  // Cache hit/miss
  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  // Estatísticas
  getStats() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    
    return {
      avgRenderTime: this.metrics.renderTimes.length > 0
        ? this.metrics.renderTimes.reduce((sum, r) => sum + r.duration, 0) / this.metrics.renderTimes.length
        : 0,
      avgAPITime: this.metrics.apiCalls.length > 0
        ? this.metrics.apiCalls.reduce((sum, a) => sum + a.duration, 0) / this.metrics.apiCalls.length
        : 0,
      cacheHitRate: total > 0 ? (this.metrics.cacheHits / total) * 100 : 0,
      totalAPICalls: this.metrics.apiCalls.length,
      slowRenders: this.metrics.renderTimes.filter(r => r.duration > 100).length
    };
  }

  // Limpar localStorage se muito cheio
  checkLocalStorage() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error('localStorage cheio!');
      this.clearOldData();
      return false;
    }
  }

  clearOldData() {
    try {
      // Manter apenas essenciais
      const keep = ['sublinx_search_history'];
      const toRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keep.includes(key) && key.startsWith('sublinx_')) {
          toRemove.push(key);
        }
      }

      toRemove.forEach(key => localStorage.removeItem(key));
      console.log(`${toRemove.length} itens removidos do localStorage`);
    } catch (e) {
      console.error('Erro ao limpar localStorage:', e);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Check localStorage ao iniciar
if (typeof window !== 'undefined') {
  setTimeout(() => {
    performanceMonitor.checkLocalStorage();
  }, 3000);
}

export default performanceMonitor;