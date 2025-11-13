import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Music, TrendingUp, Sparkles, X, SlidersHorizontal, Zap
} from "lucide-react";
import SearchSortControls from "../search/SearchSortControls";
import SearchFacets from "../search/SearchFacets";
import QuickFilters from "../search/QuickFilters";
import SearchResultCard from "../search/SearchResultCard";

export default function SearchResults({ 
  searchData, 
  onClose, 
  onEventClick,
  isLoading,
  userLocation
}) {
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [activeQuickFilters, setActiveQuickFilters] = useState([]);
  const [facetFilters, setFacetFilters] = useState({
    priceRange: null,
    timeOfDay: 'all',
    genres: [],
    cities: [],
    minAttendees: null
  });

  if (!searchData || (!isLoading && !searchData.results)) return null;

  const { query, normalized_query, detected_type, search_intent, results, suggestions, total_results } = searchData;

  // Aplicar quick filters e facets
  const filteredResults = useMemo(() => {
    if (!results) return [];
    
    let filtered = [...results];

    // Quick filters
    activeQuickFilters.forEach(filterId => {
      // Lógica seria aplicada aqui (simplificado)
    });

    // Facet filters
    if (facetFilters.priceRange) {
      filtered = filtered.filter(r => {
        if (r.type !== 'event') return true;
        const price = parseFloat(r.price) || 0;
        return price >= facetFilters.priceRange[0] && price <= facetFilters.priceRange[1];
      });
    }

    if (facetFilters.timeOfDay !== 'all') {
      filtered = filtered.filter(r => {
        if (r.type !== 'event' || !r.date) return true;
        const hour = new Date(r.date).getHours();
        
        switch(facetFilters.timeOfDay) {
          case 'morning': return hour >= 6 && hour < 12;
          case 'afternoon': return hour >= 12 && hour < 18;
          case 'evening': return hour >= 18 && hour < 24;
          case 'night': return hour >= 0 && hour < 6;
          default: return true;
        }
      });
    }

    if (facetFilters.genres && facetFilters.genres.length > 0) {
      filtered = filtered.filter(r => 
        r.type !== 'event' || facetFilters.genres.includes(r.genre)
      );
    }

    if (facetFilters.cities && facetFilters.cities.length > 0) {
      filtered = filtered.filter(r => 
        r.type !== 'event' || facetFilters.cities.some(city => r.location?.includes(city))
      );
    }

    if (facetFilters.minAttendees) {
      filtered = filtered.filter(r => 
        r.type !== 'event' || (r.current_attendees || 0) >= facetFilters.minAttendees
      );
    }

    return filtered;
  }, [results, facetFilters, activeQuickFilters]);

  // Aplicar sorting
  const sortedResults = useMemo(() => {
    if (!filteredResults) return [];
    
    const sorted = [...filteredResults];

    switch(sortBy) {
      case 'distance':
        return sorted.sort((a, b) => {
          if (a.type !== 'event' || b.type !== 'event') return 0;
          const distA = parseFloat(a.distance) || Infinity;
          const distB = parseFloat(b.distance) || Infinity;
          return distA - distB;
        });
      
      case 'date_asc':
        return sorted.sort((a, b) => {
          if (a.type !== 'event' || b.type !== 'event') return 0;
          return new Date(a.date) - new Date(b.date);
        });
      
      case 'date_desc':
        return sorted.sort((a, b) => {
          if (a.type !== 'event' || b.type !== 'event') return 0;
          return new Date(b.date) - new Date(a.date);
        });
      
      case 'popularity':
        return sorted.sort((a, b) => {
          if (a.type !== 'event' || b.type !== 'event') return 0;
          return (b.current_attendees || 0) - (a.current_attendees || 0);
        });
      
      case 'price_asc':
        return sorted.sort((a, b) => {
          if (a.type !== 'event' || b.type !== 'event') return 0;
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        });
      
      case 'price_desc':
        return sorted.sort((a, b) => {
          if (a.type !== 'event' || b.type !== 'event') return 0;
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        });
      
      case 'relevance':
      default:
        return sorted.sort((a, b) => (b._score || b._fuzzyScore || 0) - (a._score || a._fuzzyScore || 0));
    }
  }, [filteredResults, sortBy]);

  const handleFacetChange = (key, value) => {
    setFacetFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFacetFilters({
      priceRange: null,
      timeOfDay: 'all',
      genres: [],
      cities: [],
      minAttendees: null
    });
    setActiveQuickFilters([]);
  };

  const handleQuickFilter = (filterId, filterConfig) => {
    setActiveQuickFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
    
    // Aplicar config do quick filter aos facets
    if (filterConfig.priceRange) {
      setFacetFilters(prev => ({ ...prev, priceRange: filterConfig.priceRange }));
    }
    if (filterConfig.minAttendees) {
      setFacetFilters(prev => ({ ...prev, minAttendees: filterConfig.minAttendees }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/95 backdrop-blur-xl z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="max-w-4xl mx-auto px-4 py-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Music className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <h2 className="text-xl font-bold text-white">
                <span className="text-cyan-400">"{query}"</span>
              </h2>
            </div>
            {normalized_query && (
              <p className="text-sm text-yellow-400 flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                Corrigido: "{normalized_query}"
              </p>
            )}
            {search_intent && (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                {search_intent}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 mx-auto mb-4 border-4 border-cyan-500 border-t-transparent rounded-full"
            />
            <p className="text-gray-400">Buscando com IA e fuzzy matching...</p>
            <p className="text-xs text-gray-500 mt-2">Analisando 100+ eventos • Corrigindo typos • Calculando relevância</p>
          </div>
        )}

        {/* Quick Filters */}
        {!isLoading && sortedResults && sortedResults.length > 0 && (
          <div className="mb-4">
            <QuickFilters 
              onApplyQuickFilter={handleQuickFilter}
              activeFilters={activeQuickFilters}
            />
          </div>
        )}

        {/* Controls */}
        {!isLoading && sortedResults && sortedResults.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
                  {sortedResults.length} de {total_results}
                </Badge>
                {detected_type && (
                  <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
                    {detected_type}
                  </Badge>
                )}
                {sortBy !== 'relevance' && (
                  <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-300 text-xs">
                    {sortBy}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <SearchSortControls
                  value={sortBy}
                  onChange={setSortBy}
                  hasLocation={!!userLocation}
                  compact={true}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-9 px-3 ${
                    showFilters 
                      ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300' 
                      : 'border-gray-600 text-gray-300'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <SearchFacets
                    results={results}
                    filters={facetFilters}
                    onFilterChange={handleFacetChange}
                    onClearAll={handleClearFilters}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Results */}
        {!isLoading && sortedResults && sortedResults.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {sortedResults.map((result, index) => (
                <SearchResultCard
                  key={`${result.type}-${result.id}`}
                  result={result}
                  index={index}
                  onClick={() => onEventClick && result.type === 'event' && onEventClick(result)}
                  highlightTerm={query}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedResults && sortedResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <TrendingUp className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">
              Nenhum resultado
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Não encontramos nada para "{query}"
            </p>

            {suggestions && suggestions.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4 max-w-md mx-auto mb-6">
                <p className="text-sm font-semibold text-cyan-400 mb-3">
                  💡 Dicas:
                </p>
                <ul className="text-left text-xs text-gray-400 space-y-2">
                  {suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Limpar Filtros
              </Button>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-cyan-600 to-purple-600"
              >
                Voltar ao Mapa
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}