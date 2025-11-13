/**
 * SEARCH ANALYTICS SERVICE
 * Track de buscas para insights e melhorias
 */

class SearchAnalytics {
  constructor() {
    this.storageKey = 'sublinx_search_analytics';
    this.historyKey = 'sublinx_search_history';
  }

  /**
   * Registra uma busca
   */
  trackSearch(query, resultsCount = 0, filters = {}) {
    if (!query || query.trim().length === 0) return;

    const normalized = query.toLowerCase().trim();
    const analytics = this.getAnalytics();

    if (!analytics[normalized]) {
      analytics[normalized] = {
        query: query, // Original com capitalização
        count: 0,
        lastSearched: null,
        avgResults: 0,
        totalResults: 0,
        filters: {}
      };
    }

    const entry = analytics[normalized];
    entry.count++;
    entry.lastSearched = new Date().toISOString();
    entry.totalResults += resultsCount;
    entry.avgResults = Math.round(entry.totalResults / entry.count);

    // Track filters usados
    Object.keys(filters).forEach(filterKey => {
      if (!entry.filters[filterKey]) entry.filters[filterKey] = 0;
      entry.filters[filterKey]++;
    });

    this.saveAnalytics(analytics);
  }

  /**
   * Registra clique em resultado
   */
  trackResultClick(query, resultId, resultType, position) {
    const normalized = query.toLowerCase().trim();
    const clicks = this.getClicks();

    const key = `${normalized}::${resultId}`;
    if (!clicks[key]) {
      clicks[key] = {
        query: normalized,
        resultId,
        resultType,
        clicks: 0,
        positions: []
      };
    }

    clicks[key].clicks++;
    clicks[key].positions.push(position);
    clicks[key].lastClick = new Date().toISOString();

    this.saveClicks(clicks);
  }

  /**
   * Retorna trending searches
   */
  getTrending(limit = 10) {
    const analytics = this.getAnalytics();
    
    return Object.values(analytics)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(a => ({
        query: a.query,
        count: a.count,
        avgResults: a.avgResults
      }));
  }

  /**
   * Retorna buscas recentes do usuário
   */
  getRecentSearches(limit = 10) {
    try {
      const stored = localStorage.getItem(this.historyKey);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return history.slice(0, limit);
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
      return [];
    }
  }

  /**
   * Salva busca no histórico
   */
  saveSearch(query) {
    if (!query || query.trim().length === 0) return;

    try {
      const history = this.getRecentSearches(100);
      const normalized = query.trim();
      
      // Remover duplicatas
      const filtered = history.filter(s => s.toLowerCase() !== normalized.toLowerCase());
      
      // Adicionar no topo
      const updated = [normalized, ...filtered].slice(0, 50);
      
      localStorage.setItem(this.historyKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao salvar histórico:', e);
    }
  }

  /**
   * Limpa histórico
   */
  clearHistory() {
    localStorage.removeItem(this.historyKey);
  }

  /**
   * Sugestões baseadas em analytics
   */
  getSuggestions(partialQuery, limit = 5) {
    if (!partialQuery || partialQuery.length < 2) return [];

    const analytics = this.getAnalytics();
    const lower = partialQuery.toLowerCase();

    return Object.values(analytics)
      .filter(a => a.query.toLowerCase().includes(lower))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(a => ({
        query: a.query,
        count: a.count,
        type: 'analytics'
      }));
  }

  /**
   * Estatísticas gerais
   */
  getStats() {
    const analytics = this.getAnalytics();
    const clicks = this.getClicks();

    const totalSearches = Object.values(analytics).reduce((sum, a) => sum + a.count, 0);
    const totalClicks = Object.values(clicks).reduce((sum, c) => sum + c.clicks, 0);
    const uniqueQueries = Object.keys(analytics).length;

    return {
      totalSearches,
      totalClicks,
      uniqueQueries,
      avgResultsPerSearch: totalSearches > 0 
        ? Object.values(analytics).reduce((sum, a) => sum + a.avgResults, 0) / uniqueQueries 
        : 0,
      clickThroughRate: totalSearches > 0 ? (totalClicks / totalSearches) * 100 : 0
    };
  }

  // Helpers privados
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
      console.error('Erro ao salvar analytics:', e);
    }
  }

  getClicks() {
    try {
      const stored = localStorage.getItem(this.storageKey + '_clicks');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  saveClicks(clicks) {
    try {
      localStorage.setItem(this.storageKey + '_clicks', JSON.stringify(clicks));
    } catch (e) {
      console.error('Erro ao salvar clicks:', e);
    }
  }
}

// Singleton
export const searchAnalytics = new SearchAnalytics();

export default searchAnalytics;