import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Calendar, User, Users, Music, TrendingUp, 
  ExternalLink, Navigation, Sparkles, X, SlidersHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SearchSortControls from "../search/SearchSortControls";
import SearchFacets from "../search/SearchFacets";
import { GenreBadge, TypeBadge } from "../shared/EventBadge";

export default function SearchResults({ 
  searchData, 
  onClose, 
  onEventClick,
  isLoading,
  userLocation
}) {
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [facetFilters, setFacetFilters] = useState({
    priceRange: null,
    timeOfDay: 'all',
    genres: [],
    cities: [],
    minAttendees: null
  });

  if (!searchData || (!isLoading && !searchData.results)) return null;

  const { query, detected_type, search_intent, results, suggestions, total_results } = searchData;

  // NOVO: Aplicar facets aos resultados
  const filteredResults = useMemo(() => {
    if (!results) return [];
    
    let filtered = [...results];

    // Filtro de preço
    if (facetFilters.priceRange) {
      filtered = filtered.filter(r => {
        if (r.type !== 'event') return true;
        const price = parseFloat(r.price) || 0;
        return price >= facetFilters.priceRange[0] && price <= facetFilters.priceRange[1];
      });
    }

    // Filtro de horário
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

    // Filtro de gêneros
    if (facetFilters.genres && facetFilters.genres.length > 0) {
      filtered = filtered.filter(r => 
        r.type !== 'event' || facetFilters.genres.includes(r.genre)
      );
    }

    // Filtro de cidades
    if (facetFilters.cities && facetFilters.cities.length > 0) {
      filtered = filtered.filter(r => 
        r.type !== 'event' || facetFilters.cities.some(city => r.location?.includes(city))
      );
    }

    // Filtro de participantes mínimos
    if (facetFilters.minAttendees) {
      filtered = filtered.filter(r => 
        r.type !== 'event' || (r.current_attendees || 0) >= facetFilters.minAttendees
      );
    }

    return filtered;
  }, [results, facetFilters]);

  // NOVO: Aplicar ordenação
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
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceA - priceB;
        });
      
      case 'price_desc':
        return sorted.sort((a, b) => {
          if (a.type !== 'event' || b.type !== 'event') return 0;
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceB - priceA;
        });
      
      case 'relevance':
      default:
        return sorted; // Já vem ordenado por relevância
    }
  }, [filteredResults, sortBy]);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'event': return Calendar;
      case 'artist': return User;
      case 'community': return Users;
      case 'venue': return MapPin;
      default: return Sparkles;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'event': return 'from-cyan-500 to-blue-500';
      case 'artist': return 'from-purple-500 to-pink-500';
      case 'community': return 'from-green-500 to-emerald-500';
      case 'venue': return 'from-orange-500 to-yellow-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'event': return { label: 'Evento', color: 'bg-cyan-600/20 border-cyan-500/30 text-cyan-300' };
      case 'artist': return { label: 'Artista', color: 'bg-purple-600/20 border-purple-500/30 text-purple-300' };
      case 'community': return { label: 'Comunidade', color: 'bg-green-600/20 border-green-500/30 text-green-300' };
      case 'venue': return { label: 'Local', color: 'bg-orange-600/20 border-orange-500/30 text-orange-300' };
      default: return { label: 'Resultado', color: 'bg-gray-600/20 border-gray-500/30 text-gray-300' };
    }
  };

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
              <h2 className="text-xl font-bold text-white truncate">
                Resultados: <span className="text-cyan-400">"{query}"</span>
              </h2>
            </div>
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

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 mx-auto mb-4 border-4 border-cyan-500 border-t-transparent rounded-full"
            />
            <p className="text-gray-400">Buscando com inteligência artificial...</p>
            <p className="text-xs text-gray-500 mt-2">Analisando eventos, artistas e locais</p>
          </div>
        )}

        {/* Controls Bar */}
        {!isLoading && sortedResults && sortedResults.length > 0 && (
          <div className="mb-4 space-y-3">
            {/* Results Count + Sort */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
                  {sortedResults.length} resultado{sortedResults.length > 1 ? 's' : ''}
                </Badge>
                {detected_type && (
                  <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
                    Tipo: {detected_type}
                  </Badge>
                )}
                {sortBy !== 'relevance' && (
                  <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-300 text-xs">
                    Ordenado por: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
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

            {/* Facets Panel */}
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

        {/* Results Grid */}
        {!isLoading && sortedResults && sortedResults.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {sortedResults.map((result, index) => {
                const Icon = getTypeIcon(result.type);
                const badge = getTypeBadge(result.type);
                
                return (
                  <motion.div
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="bg-gray-900/80 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden group"
                      onClick={() => onEventClick && result.type === 'event' && onEventClick(result)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Image/Icon */}
                          {result.image_url || result.avatar ? (
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                              <img 
                                src={result.image_url || result.avatar} 
                                alt={result.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className={`w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br ${getTypeColor(result.type)} flex items-center justify-center`}>
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                                  {result.name}
                                </h3>
                                <Badge className={`${badge.color} text-[10px]`}>
                                  {badge.label}
                                </Badge>
                              </div>
                              {result._fuzzyScore && result._fuzzyScore < 0.9 && (
                                <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-[9px]">
                                  Match: {Math.round(result._fuzzyScore * 100)}%
                                </Badge>
                              )}
                            </div>

                            {/* Type-specific Info */}
                            {result.type === 'event' && (
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Calendar className="w-4 h-4 text-cyan-400" />
                                  <span>{format(new Date(result.date), "PPP 'às' HH:mm", { locale: ptBR })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <MapPin className="w-4 h-4 text-purple-400" />
                                  <span className="truncate">{result.location}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  {result.distance && (
                                    <Badge className="bg-green-600/20 border-green-500/30 text-green-300 text-[10px]">
                                      <Navigation className="w-3 h-3 mr-1" />
                                      {result.distance}
                                    </Badge>
                                  )}
                                  {result.genre && (
                                    <GenreBadge genre={result.genre} size="xs" />
                                  )}
                                  {result.price && (
                                    <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-[10px]">
                                      R$ {parseFloat(result.price).toFixed(2)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {result.type === 'artist' && (
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Music className="w-4 h-4 text-purple-400" />
                                  <span>{result.genre}</span>
                                </div>
                                {result.next_show && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-4 h-4 text-cyan-400" />
                                    <span>Próximo: {format(new Date(result.next_show), "dd/MM", { locale: ptBR })}</span>
                                  </div>
                                )}
                                {result.next_show_name && (
                                  <p className="text-xs text-gray-500 italic line-clamp-1">
                                    "{result.next_show_name}"
                                  </p>
                                )}
                              </div>
                            )}

                            {result.type === 'community' && (
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Users className="w-4 h-4 text-green-400" />
                                  <span>{result.member_count} membros</span>
                                </div>
                                {result.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                                {result.type_label && (
                                  <Badge className="bg-green-600/20 border-green-500/30 text-green-300 text-[10px] capitalize">
                                    {result.type_label}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
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
              Nenhum resultado encontrado
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Não encontramos nada para "{query}"
            </p>

            {suggestions && suggestions.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4 max-w-md mx-auto">
                <p className="text-sm font-semibold text-cyan-400 mb-3">
                  💡 Dicas de busca:
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

            <div className="flex gap-3 mt-6 justify-center">
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

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'distance', label: 'Distância' },
  { value: 'date_asc', label: 'Data (cedo)' },
  { value: 'date_desc', label: 'Data (tarde)' },
  { value: 'popularity', label: 'Popularidade' },
  { value: 'price_asc', label: 'Preço ↑' },
  { value: 'price_desc', label: 'Preço ↓' },
];