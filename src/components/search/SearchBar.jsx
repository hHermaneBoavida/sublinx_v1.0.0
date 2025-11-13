import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Clock, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SEARCH BAR COM AUTOCOMPLETE INTELIGENTE
 * - Histórico do usuário
 * - Eventos populares
 * - Sugestões baseadas em contexto
 */
export default function SearchBar({ 
  onSearch, 
  value,
  onChange,
  popularEvents = [],
  placeholder = "Buscar eventos, artistas, locais...",
  autoFocus = false 
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);

  // Carregar histórico
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sublinx_search_history');
      if (stored) {
        const history = JSON.parse(stored);
        setRecentSearches(history.slice(0, 10));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Sugestões inteligentes
  const suggestions = useMemo(() => {
    const items = [];
    
    if (!value || value.length === 0) {
      // Mostrar recentes
      if (recentSearches.length > 0) {
        items.push({
          type: 'section',
          label: 'RECENTES'
        });
        recentSearches.slice(0, 5).forEach(search => {
          items.push({
            type: 'history',
            value: search,
            icon: Clock
          });
        });
      }

      // Mostrar populares
      if (popularEvents.length > 0) {
        items.push({
          type: 'section',
          label: 'POPULARES AGORA'
        });
        popularEvents.slice(0, 3).forEach(event => {
          items.push({
            type: 'popular',
            value: event.genre || event.title,
            icon: TrendingUp,
            subtitle: event.title
          });
        });
      }
      
      return items;
    }

    // Filtrar histórico
    const lower = value.toLowerCase();
    const matchingHistory = recentSearches
      .filter(s => s.toLowerCase().includes(lower))
      .slice(0, 3);

    if (matchingHistory.length > 0) {
      matchingHistory.forEach(search => {
        items.push({
          type: 'history',
          value: search,
          icon: Clock
        });
      });
    }

    // Sugestões contextuais
    const contextual = getContextualSuggestions(value);
    contextual.forEach(s => {
      items.push({
        type: 'suggestion',
        value: s,
        icon: Sparkles
      });
    });

    return items.slice(0, 8);
  }, [value, recentSearches, popularEvents]);

  const saveToHistory = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) return;

    try {
      const normalized = searchQuery.trim();
      
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.toLowerCase() !== normalized.toLowerCase());
        const updated = [normalized, ...filtered].slice(0, 20);
        
        localStorage.setItem('sublinx_search_history', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Erro ao salvar histórico:', e);
    }
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleSearch = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) return;

    saveToHistory(searchQuery);
    setShowSuggestions(false);
    onSearch(searchQuery);
  }, [saveToHistory, onSearch]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(value);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.value);
    handleSearch(suggestion.value);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('sublinx_search_history');
    setRecentSearches([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 z-10" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="pl-10 pr-12 h-10 bg-black/70 backdrop-blur-xl border border-cyan-500/40 text-white placeholder:text-gray-500 text-sm rounded-lg"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {value && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="h-6 w-6 text-gray-400"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-black/95 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            {suggestions.map((item, index) => {
              if (item.type === 'section') {
                return (
                  <div key={index} className="px-3 py-2 bg-gray-900/50 border-b border-gray-700/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">{item.label}</span>
                    {item.label === 'RECENTES' && recentSearches.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                );
              }

              const Icon = item.icon;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-600/10 transition-colors text-left"
                  whileHover={{ x: 4 }}
                >
                  <Icon className={`w-4 h-4 ${
                    item.type === 'history' ? 'text-gray-400' :
                    item.type === 'popular' ? 'text-yellow-400' :
                    'text-cyan-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {item.value}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-400 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sugestões contextuais baseadas na query
function getContextualSuggestions(query) {
  const lower = query.toLowerCase();
  const suggestions = [];

  // Correções comuns
  const corrections = {
    'tekno': 'techno',
    'eletronica': 'electronic',
    'balada': 'evento',
    'rolê': 'evento',
    'sp': 'são paulo',
    'rj': 'rio de janeiro'
  };

  Object.entries(corrections).forEach(([wrong, correct]) => {
    if (lower.includes(wrong)) {
      suggestions.push(lower.replace(wrong, correct));
    }
  });

  // Sugestões de gêneros
  const genres = ['techno', 'house', 'trance', 'funk', 'trap', 'drum_bass'];
  genres.forEach(genre => {
    if (genre.startsWith(lower) || lower.startsWith(genre.substring(0, 3))) {
      suggestions.push(genre);
    }
  });

  // Sugestões temporais
  if (lower.includes('hoj') || lower.includes('agora')) {
    suggestions.push('eventos hoje');
  }
  if (lower.includes('amanh') || lower.includes('tomorrow')) {
    suggestions.push('eventos amanhã');
  }
  if (lower.includes('fim') || lower.includes('semana')) {
    suggestions.push('eventos fim de semana');
  }

  return [...new Set(suggestions)].slice(0, 3);
}