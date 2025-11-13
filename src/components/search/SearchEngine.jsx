import React, { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Clock, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { intelligentSearch } from "@/functions/intelligentSearch";
import { debounce } from "lodash";

/**
 * MOTOR DE BUSCA COMPLETO
 * - Autocomplete
 * - Search history
 * - Debounce
 * - Cache de resultados
 * - Sugestões em tempo real
 */
export default function SearchEngine({ 
  onSearch, 
  onClose,
  userLocation,
  placeholder = "Buscar eventos, artistas, locais...",
  autoFocus = true 
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Carregar histórico ao montar
  useEffect(() => {
    const stored = localStorage.getItem('sublinx_search_history');
    if (stored) {
      try {
        const history = JSON.parse(stored);
        setRecentSearches(history.slice(0, 5));
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
      }
    }

    // Trending (mock - seria analytics real)
    setTrendingSearches([
      { query: 'techno são paulo', count: 245 },
      { query: 'house rio', count: 189 },
      { query: 'trap hoje', count: 156 },
      { query: 'rave fim de semana', count: 134 },
      { query: 'underground sp', count: 98 }
    ]);
  }, []);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Salvar busca no histórico
  const saveToHistory = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) return;

    const normalized = searchQuery.toLowerCase().trim();
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== normalized);
      const updated = [searchQuery, ...filtered].slice(0, 10);
      
      localStorage.setItem('sublinx_search_history', JSON.stringify(updated));
      return updated;
    });

    // Analytics (incrementar contador)
    const analytics = JSON.parse(localStorage.getItem('sublinx_search_analytics') || '{}');
    analytics[normalized] = (analytics[normalized] || 0) + 1;
    localStorage.setItem('sublinx_search_analytics', JSON.stringify(analytics));
  }, []);

  // Buscar sugestões com debounce
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);

      try {
        // Verificar cache
        if (cacheRef.current.has(searchQuery)) {
          const cached = cacheRef.current.get(searchQuery);
          if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5min
            setSuggestions(cached.suggestions);
            setIsLoadingSuggestions(false);
            return;
          }
        }

        // Buscar sugestões (simplified para performance)
        const matches = recentSearches
          .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 3);

        const combined = [
          ...matches.map(s => ({ type: 'history', value: s })),
          ...trendingSearches
            .filter(t => t.query.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 2)
            .map(t => ({ type: 'trending', value: t.query, count: t.count }))
        ];

        setSuggestions(combined);

        // Cache
        cacheRef.current.set(searchQuery, {
          suggestions: combined,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300),
    [recentSearches, trendingSearches]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);

    if (value.length >= 2) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) return;

    saveToHistory(searchQuery);
    setShowSuggestions(false);
    
    onSearch({
      query: searchQuery,
      userLocation
    });
  }, [saveToHistory, onSearch, userLocation]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.value);
    handleSearch(suggestion.value);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('sublinx_search_history');
    setRecentSearches([]);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 z-10" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-11 pr-24 h-12 bg-gray-900/90 backdrop-blur-xl border-2 border-cyan-500/30 text-white placeholder:text-gray-500 text-base rounded-xl focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            onClick={() => handleSearch(query)}
            disabled={!query || query.trim().length === 0}
            className="h-8 px-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-40"
          >
            {isLoadingSuggestions ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (query.length >= 2 || recentSearches.length > 0 || trendingSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-gray-900/98 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden z-50"
            style={{
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)'
            }}
          >
            {/* Sugestões baseadas no input */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-[10px] font-semibold text-gray-400 px-3 py-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  SUGESTÕES
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-cyan-600/10 transition-colors rounded-lg text-left group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {suggestion.type === 'history' ? (
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-white truncate group-hover:text-cyan-300">
                        {suggestion.value}
                      </span>
                    </div>
                    {suggestion.count && (
                      <Badge className="bg-orange-600/20 border-orange-500/30 text-orange-300 text-[9px]">
                        {suggestion.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Buscas recentes */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-2 border-t border-gray-700/50">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-[10px] font-semibold text-gray-400 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-purple-400" />
                    RECENTES
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="text-[10px] text-red-400 hover:text-red-300"
                  >
                    Limpar
                  </button>
                </div>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-600/10 transition-colors rounded-lg text-left group"
                  >
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-white truncate group-hover:text-purple-300">
                      {search}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Trending */}
            {query.length === 0 && trendingSearches.length > 0 && (
              <div className="p-2 border-t border-gray-700/50">
                <div className="text-[10px] font-semibold text-gray-400 px-3 py-2 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-orange-400" />
                  EM ALTA
                </div>
                {trendingSearches.slice(0, 5).map((trend, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(trend.query)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-orange-600/10 transition-colors rounded-lg text-left group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-orange-400 font-bold text-xs w-4">#{index + 1}</span>
                      <span className="text-sm text-white truncate group-hover:text-orange-300">
                        {trend.query}
                      </span>
                    </div>
                    <Badge className="bg-orange-600/20 border-orange-500/30 text-orange-300 text-[9px]">
                      {trend.count}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {query.length === 0 && recentSearches.length === 0 && (
              <div className="p-6 text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  Digite para buscar eventos, artistas e locais
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}