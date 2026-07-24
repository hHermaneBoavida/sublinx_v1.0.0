/**
 * SEARCH ANALYTICS - OTIMIZADO
 * Tracking com limite de armazenamento
 */

class SearchAnalytics {
  constructor() {
    this.storageKey = 'sublinx_search_analytics';
    this.historyKey = 'sublinx_search_history';
    this.maxHistorySize = 20; // LIMITE
    this.maxAnalyticsSize = 100; // LIMITE
  }

  trackSearch(query, resultsCount = 0) {
    if (!query || query.trim().length === 0) return;

    try {
      const normalized = query.toLowerCase().trim();
      const analytics = this.getAnalytics();

      if (!analytics[normalized]) {
        analytics[normalized] = {
          query: query,
          count: 0,
          lastSearched: null
        };
      }

      analytics[normalized].count++;
      analytics[normalized].lastSearched = Date.now(); // OTIMIZAÇÃO: timestamp direto

      // LIMITE: Manter apenas top 100
      const sorted = Object.entries(analytics)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, this.maxAnalyticsSize);
      
      this.saveAnalytics(Object.fromEntries(sorted));
    } catch (e) {
      // Silenciar erro
    }
  }

  getTrending(limit = 5) {
    try {
      const analytics = this.getAnalytics();
      
      return Object.values(analytics)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(a => ({
          query: a.query,
          count: a.count
        }));
    } catch {
      return [];
    }
  }

  getRecentSearches(limit = 10) {
    try {
      const stored = localStorage.getItem(this.historyKey);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return history.slice(0, limit);
    } catch {
      return [];
    }
  }

  saveSearch(query) {
    if (!query || query.trim().length === 0) return;

    try {
      const history = this.getRecentSearches(50);
      const normalized = query.trim();
      
      const filtered = history.filter(s => s.toLowerCase() !== normalized.toLowerCase());
      const updated = [normalized, ...filtered].slice(0, this.maxHistorySize);
      
      localStorage.setItem(this.historyKey, JSON.stringify(updated));
    } catch {
      // Silenciar erro
    }
  }

  clearHistory() {
    try {
      localStorage.removeItem(this.historyKey);
    } catch {
      // Silenciar erro
    }
  }

  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.historyKey);
      localStorage.removeItem(this.storageKey + '_clicks');
    } catch {
      // Silenciar erro
    }
  }

  // Helpers
  getAnalytics() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  saveAnalytics(analytics) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(analytics));
    } catch (e) {
      console.error('localStorage cheio:', e);
      // Se cheio, limpar tudo
      this.clearAll();
    }
  }
}

// Singleton
export const searchAnalytics = new SearchAnalytics();

// CLEANUP: Limpar dados antigos ao iniciar
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
      
      const analytics = searchAnalytics.getAnalytics();
      const cleaned = {};
      
      Object.entries(analytics).forEach(([key, value]) => {
        if (value.lastSearched && (now - value.lastSearched) < maxAge) {
          cleaned[key] = value;
        }
      });
      
      searchAnalytics.saveAnalytics(cleaned);
      console.log('Analytics antigas limpas');
    } catch (e) {
      console.error('Erro no cleanup:', e);
    }
  }, 2000); // 2s após load
}

export default searchAnalytics;