import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, Clock, Users, Music, MapPin, 
  X, Filter, TrendingUp, Calendar 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchFacets({ 
  results, 
  filters, 
  onFilterChange,
  onClearAll 
}) {
  // Calcular facets dinamicamente dos resultados
  const facets = useMemo(() => {
    if (!results || results.length === 0) return null;

    const eventResults = results.filter(r => r.type === 'event');
    
    if (eventResults.length === 0) return null;

    // Extrair ranges e valores únicos
    const prices = eventResults
      .map(e => parseFloat(e.price) || 0)
      .filter(p => p > 0);
    
    const genres = [...new Set(eventResults.map(e => e.genre).filter(Boolean))];
    const cities = [...new Set(eventResults.map(e => {
      const location = e.location || '';
      return location.split(',').pop().trim();
    }).filter(Boolean))];

    const hours = eventResults
      .map(e => {
        try {
          return new Date(e.date).getHours();
        } catch {
          return null;
        }
      })
      .filter(h => h !== null);

    const attendees = eventResults
      .map(e => e.current_attendees || 0)
      .filter(a => a > 0);

    return {
      priceRange: prices.length > 0 ? {
        min: Math.floor(Math.min(...prices)),
        max: Math.ceil(Math.max(...prices)),
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      } : null,
      
      genres: genres.slice(0, 8).map(genre => ({
        value: genre,
        count: eventResults.filter(e => e.genre === genre).length
      })),
      
      cities: cities.slice(0, 6).map(city => ({
        value: city,
        count: eventResults.filter(e => e.location?.includes(city)).length
      })),

      timeOfDay: {
        morning: hours.filter(h => h >= 6 && h < 12).length,
        afternoon: hours.filter(h => h >= 12 && h < 18).length,
        evening: hours.filter(h => h >= 18 && h < 24).length,
        night: hours.filter(h => h >= 0 && h < 6).length,
      },

      popularityRange: attendees.length > 0 ? {
        min: Math.min(...attendees),
        max: Math.max(...attendees),
        avg: Math.round(attendees.reduce((a, b) => a + b, 0) / attendees.length)
      } : null
    };
  }, [results]);

  if (!facets) return null;

  const hasActiveFilters = Object.values(filters || {}).some(v => 
    v !== 'all' && v !== null && (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Filtros</h3>
          {hasActiveFilters && (
            <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-[9px]">
              Ativos
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-red-400 hover:text-red-300 h-7 px-2 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Faixa de Preço */}
      {facets.priceRange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
              Preço
            </label>
            <span className="text-xs text-gray-400">
              R$ {filters.priceRange?.[0] || facets.priceRange.min} - R$ {filters.priceRange?.[1] || facets.priceRange.max}
            </span>
          </div>
          <Slider
            min={facets.priceRange.min}
            max={facets.priceRange.max}
            step={10}
            value={filters.priceRange || [facets.priceRange.min, facets.priceRange.max]}
            onValueChange={(value) => onFilterChange('priceRange', value)}
            className="py-2"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>R$ {facets.priceRange.min}</span>
            <span className="text-cyan-400">Média: R$ {facets.priceRange.avg}</span>
            <span>R$ {facets.priceRange.max}</span>
          </div>
        </div>
      )}

      {/* Horário do Dia */}
      {facets.timeOfDay && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Horário
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'morning', label: 'Manhã', emoji: '🌅', hours: '6h-12h' },
              { key: 'afternoon', label: 'Tarde', emoji: '☀️', hours: '12h-18h' },
              { key: 'evening', label: 'Noite', emoji: '🌆', hours: '18h-00h' },
              { key: 'night', label: 'Madrugada', emoji: '🌙', hours: '0h-6h' },
            ].map(period => {
              const count = facets.timeOfDay[period.key] || 0;
              const isActive = filters.timeOfDay === period.key;
              
              return (
                <Button
                  key={period.key}
                  onClick={() => onFilterChange('timeOfDay', isActive ? 'all' : period.key)}
                  variant="outline"
                  size="sm"
                  disabled={count === 0}
                  className={`h-auto py-2 px-2 flex flex-col items-start ${
                    isActive 
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' 
                      : 'bg-gray-800/50 border-gray-600 text-gray-300'
                  } ${count === 0 ? 'opacity-30' : ''}`}
                >
                  <div className="flex items-center gap-1 w-full justify-between">
                    <span className="text-xs font-semibold">{period.emoji} {period.label}</span>
                    <Badge className="bg-black/30 text-white text-[9px] px-1">
                      {count}
                    </Badge>
                  </div>
                  <span className="text-[9px] text-gray-400">{period.hours}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Gêneros */}
      {facets.genres && facets.genres.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
            <Music className="w-3.5 h-3.5 text-pink-400" />
            Gêneros
          </label>
          <div className="flex flex-wrap gap-1.5">
            {facets.genres.map(({ value: genre, count }) => {
              const isActive = filters.genres?.includes(genre);
              
              return (
                <Badge
                  key={genre}
                  onClick={() => {
                    const current = filters.genres || [];
                    const newGenres = isActive
                      ? current.filter(g => g !== genre)
                      : [...current, genre];
                    onFilterChange('genres', newGenres);
                  }}
                  className={`cursor-pointer transition-all text-xs ${
                    isActive
                      ? 'bg-pink-600/30 border-pink-500/60 text-pink-300 scale-105'
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {genre} ({count})
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Cidades */}
      {facets.cities && facets.cities.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            Localização
          </label>
          <div className="flex flex-wrap gap-1.5">
            {facets.cities.map(({ value: city, count }) => {
              const isActive = filters.cities?.includes(city);
              
              return (
                <Badge
                  key={city}
                  onClick={() => {
                    const current = filters.cities || [];
                    const newCities = isActive
                      ? current.filter(c => c !== city)
                      : [...current, city];
                    onFilterChange('cities', newCities);
                  }}
                  className={`cursor-pointer transition-all text-xs ${
                    isActive
                      ? 'bg-orange-600/30 border-orange-500/60 text-orange-300 scale-105'
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  📍 {city} ({count})
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Popularidade */}
      {facets.popularityRange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Participantes
            </label>
            <span className="text-xs text-gray-400">
              Mín: {filters.minAttendees || facets.popularityRange.min}
            </span>
          </div>
          <Slider
            min={facets.popularityRange.min}
            max={facets.popularityRange.max}
            step={5}
            value={[filters.minAttendees || facets.popularityRange.min]}
            onValueChange={(value) => onFilterChange('minAttendees', value[0])}
            className="py-2"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>{facets.popularityRange.min}</span>
            <span className="text-blue-400">Média: {facets.popularityRange.avg}</span>
            <span>{facets.popularityRange.max}</span>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="pt-3 border-t border-gray-700/50 flex items-center justify-between">
        <span className="text-[10px] text-gray-500">
          {results.length} resultado{results.length !== 1 ? 's' : ''}
        </span>
        {hasActiveFilters && (
          <span className="text-[10px] text-cyan-400 font-semibold">
            {Object.keys(filters).length} filtro{Object.keys(filters).length !== 1 ? 's' : ''} ativo{Object.keys(filters).length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </motion.div>
  );
}