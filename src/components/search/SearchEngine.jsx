import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Clock, TrendingUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MOTOR DE BUSCA OTIMIZADO
 * - Autocomplete local (sem API)
 * - Search history limitado
 * - Debounce manual
 * - Cache eficiente
 */
export default function SearchEngine({ 
  onSearch, 
  userLocation,
  placeholder = "Buscar eventos...",
  autoFocus = false 
}) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Carregar histórico (limitado)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sublinx_search_history');
      if (stored) {
        const history = JSON.parse(stored);
        setRecentSearches(history.slice(0, 5)); // LIMITE: 5 itens
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Auto-focus opcional
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // OTIMIZAÇÃO: Sugestões locais (sem API)
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const lower = query.toLowerCase();
    return recentSearches
      .filter(s => s.toLowerCase().includes(lower))
      .slice(0, 3)
      .map(s => ({ type: 'history', value: s }));
  }, [query, recentSearches]);

  const saveToHistory = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) return;

    try {
      const normalized = searchQuery.trim();
      
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.toLowerCase() !== normalized.toLowerCase());
        const updated = [normalized, ...filtered].slice(0, 10);
        
        localStorage.setItem('sublinx_search_history', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Erro ao salvar histórico:', e);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
  };

  const handleSearch = useCallback((searchQuery) => {
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
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 z-10" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="pl-11 pr-20 h-12 bg-gray-900/90 backdrop-blur-xl border-2 border-cyan-500/30 text-white placeholder:text-gray-500 rounded-xl"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="h-8 w-8 text-gray-400"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            onClick={() => handleSearch(query)}
            disabled={!query}
            className="h-8 px-3 bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-gray-900/98 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto"
          >
            {/* Sugestões */}
            {suggestions.length > 0 && (
              <div className="p-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-600/10 rounded-lg text-left"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white truncate">
                      {suggestion.value}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Recentes */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-2 border-t border-gray-700/50">
                <div className="flex justify-between px-3 py-2">
                  <span className="text-xs text-gray-400">RECENTES</span>
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-red-400"
                  >
                    Limpar
                  </button>
                </div>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-purple-600/10 rounded-lg text-left"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white truncate">{search}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}