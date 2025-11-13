import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, TrendingUp, X, SlidersHorizontal, Calendar, DollarSign } from "lucide-react";
import SearchSortControls from "../search/SearchSortControls";
import SearchResultCard from "../search/SearchResultCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export default function SearchResults({ 
  searchData, 
  onClose, 
  onEventClick,
  isLoading,
  userLocation
}) {
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [genreFilter, setGenreFilter] = useState('all');

  if (!searchData && !isLoading) return null;

  const { query, normalized_query, detected_type, search_intent, results = [], suggestions = [] } = searchData || {};

  // Aplicar filtros
  const filteredResults = useMemo(() => {
    if (!results) return [];
    
    let filtered = [...results];

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(r => {
        if (r.type !== 'event' || !r.date) return true;
        const eventDate = new Date(r.date);
        const daysDiff = (eventDate - now) / (1000 * 60 * 60 * 24);

        switch(dateFilter) {
          case 'today':
            return daysDiff >= 0 && daysDiff < 1;
          case 'tomorrow':
            return daysDiff >= 1 && daysDiff < 2;
          case 'week':
            return daysDiff >= 0 && daysDiff <= 7;
          case 'month':
            return daysDiff >= 0 && daysDiff <= 30;
          default:
            return true;
        }
      });
    }

    // Filtro de preço
    filtered = filtered.filter(r => {
      if (r.type !== 'event') return true;
      const price = parseFloat(r.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Filtro de gênero
    if (genreFilter !== 'all') {
      filtered = filtered.filter(r => 
        r.type !== 'event' || r.genre === genreFilter
      );
    }

    return filtered;
  }, [results, dateFilter, priceRange, genreFilter]);

  // Aplicar sorting
  const sortedResults = useMemo(() => {
    if (!filteredResults) return [];
    
    const sorted = [...filteredResults];

    switch(sortBy) {
      case 'distance':
        return sorted.sort((a, b) => {
          const distA = parseFloat(a.distance) || Infinity;
          const distB = parseFloat(b.distance) || Infinity;
          return distA - distB;
        });
      
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      case 'popularity':
        return sorted.sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0));
      
      case 'price_asc':
        return sorted.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
      
      case 'relevance':
      default:
        return sorted.sort((a, b) => (b._score || b._fuzzyScore || 0) - (a._score || a._fuzzyScore || 0));
    }
  }, [filteredResults, sortBy]);

  const handleClearFilters = () => {
    setDateFilter('all');
    setPriceRange([0, 200]);
    setGenreFilter('all');
  };

  // Gêneros disponíveis nos resultados
  const availableGenres = useMemo(() => {
    const genres = new Set();
    results.filter(r => r.type === 'event' && r.genre).forEach(r => genres.add(r.genre));
    return ['all', ...Array.from(genres)];
  }, [results]);

  const hasActiveFilters = dateFilter !== 'all' || priceRange[0] > 0 || priceRange[1] < 200 || genreFilter !== 'all';

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
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-cyan-400">
                "{query}"
              </h2>
            </div>
            {normalized_query && normalized_query !== query.toLowerCase() && (
              <p className="text-sm text-yellow-400">
                Corrigido: "{normalized_query}"
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400"
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
            <p className="text-gray-400">Buscando...</p>
          </div>
        )}

        {/* Controls */}
        {!isLoading && sortedResults && sortedResults.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
                {sortedResults.length} resultado{sortedResults.length !== 1 ? 's' : ''}
              </Badge>

              <div className="flex gap-2">
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
                  className={showFilters ? 'bg-cyan-600/20 border-cyan-500/50' : 'border-gray-600'}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros
                  {hasActiveFilters && (
                    <Badge className="ml-2 bg-cyan-500 text-white w-5 h-5 rounded-full text-xs p-0 flex items-center justify-center">
                      !
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* FILTROS AVANÇADOS */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 space-y-4"
                >
                  {/* Filtro de Data */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      Data do Evento
                    </label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">Todas as datas</SelectItem>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="tomorrow">Amanhã</SelectItem>
                        <SelectItem value="week">Esta semana</SelectItem>
                        <SelectItem value="month">Este mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Preço */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                      Preço: R$ {priceRange[0]} - R$ {priceRange[1]}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>Grátis</span>
                      <span>R$ 200+</span>
                    </div>
                  </div>

                  {/* Filtro de Gênero */}
                  {availableGenres.length > 2 && (
                    <div>
                      <label className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                        <Music className="w-4 h-4 text-pink-400" />
                        Gênero Musical
                      </label>
                      <Select value={genreFilter} onValueChange={setGenreFilter}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="all">Todos os gêneros</SelectItem>
                          {availableGenres.filter(g => g !== 'all').map(genre => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      size="sm"
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-600/10"
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Suggestions - MELHORADO */}
        {!isLoading && suggestions && suggestions.length > 0 && sortedResults.length > 0 && (
          <div className="mb-4 bg-purple-900/20 border border-purple-500/30 rounded-xl p-3">
            <p className="text-xs font-semibold text-purple-300 mb-2">💡 Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((s, i) => (
                <Badge key={i} className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs cursor-default">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && sortedResults && sortedResults.length > 0 && (
          <div className="space-y-3">
            {sortedResults.map((result, index) => (
              <SearchResultCard
                key={`${result.type}-${result.id}`}
                result={result}
                index={index}
                onClick={() => onEventClick && result.type === 'event' && onEventClick(result)}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && sortedResults && sortedResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">
              Nenhum resultado
            </h3>
            <p className="text-gray-500 mb-6">
              Não encontramos nada para "{query}"
            </p>

            {suggestions && suggestions.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4 max-w-md mx-auto mb-6">
                <p className="text-sm font-semibold text-cyan-400 mb-3">💡 Tente:</p>
                <ul className="text-left text-xs text-gray-400 space-y-2">
                  {suggestions.map((s, i) => (
                    <li key={i}>→ {s}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={onClose} className="bg-gradient-to-r from-cyan-600 to-purple-600">
              Voltar ao Mapa
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}