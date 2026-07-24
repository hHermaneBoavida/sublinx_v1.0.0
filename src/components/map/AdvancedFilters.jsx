import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, TrendingUp, X, SlidersHorizontal } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdvancedFilters({ filters, onFiltersChange, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      genre: 'all',
      type: 'all',
      dateRange: 'all',
      maxDistance: 50,
      minAttendees: 0,
      maxPrice: 500,
      sortBy: 'distance'
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const dateRangeOptions = [
    { value: 'all', label: 'Qualquer data' },
    { value: 'today', label: 'Hoje' },
    { value: 'tomorrow', label: 'Amanhã' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mês' }
  ];

  const sortOptions = [
    { value: 'distance', label: 'Mais próximos', icon: MapPin },
    { value: 'date', label: 'Data mais próxima', icon: Calendar },
    { value: 'popularity', label: 'Mais populares', icon: TrendingUp }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-gray-900 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl border border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Filtros Avançados</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Date Range */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Quando?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {dateRangeOptions.map(option => (
                <Button
                  key={option.value}
                  variant={localFilters.dateRange === option.value ? 'default' : 'outline'}
                  onClick={() => setLocalFilters({ ...localFilters, dateRange: option.value })}
                  className={localFilters.dateRange === option.value 
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                    : 'border-gray-700 text-muted-foreground hover:bg-gray-800 hover:text-foreground'}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                Distância Máxima
              </span>
              <span className="text-cyan-400">{localFilters.maxDistance} km</span>
            </label>
            <Slider
              value={[localFilters.maxDistance]}
              onValueChange={([value]) => setLocalFilters({ ...localFilters, maxDistance: value })}
              min={1}
              max={100}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Min Attendees */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Mínimo de Participantes
              </span>
              <span className="text-cyan-400">{localFilters.minAttendees}+</span>
            </label>
            <Slider
              value={[localFilters.minAttendees]}
              onValueChange={([value]) => setLocalFilters({ ...localFilters, minAttendees: value })}
              min={0}
              max={500}
              step={10}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>500+</span>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-3 block">
              Ordenar por
            </label>
            <div className="space-y-2">
              {sortOptions.map(option => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={localFilters.sortBy === option.value ? 'default' : 'outline'}
                    onClick={() => setLocalFilters({ ...localFilters, sortBy: option.value })}
                    className={`w-full justify-start ${
                      localFilters.sortBy === option.value 
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                        : 'border-gray-700 text-muted-foreground hover:bg-gray-800 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Genre & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block">Gênero</label>
              <select
                value={localFilters.genre}
                onChange={(e) => setLocalFilters({ ...localFilters, genre: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="all">Todos</option>
                <option value="techno">Techno</option>
                <option value="house">House</option>
                <option value="trance">Trance</option>
                <option value="drum_bass">Drum & Bass</option>
                <option value="funk">Funk</option>
                <option value="trap">Trap</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block">Tipo</label>
              <select
                value={localFilters.type}
                onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="all">Todos</option>
                <option value="rave">Rave</option>
                <option value="club">Club</option>
                <option value="warehouse">Warehouse</option>
                <option value="rooftop">Rooftop</option>
                <option value="underground">Underground</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 flex gap-3">
          <Button onClick={handleReset} variant="outline" className="flex-1 border-gray-700 text-muted-foreground hover:text-foreground">
            Limpar
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 text-white">
            Aplicar Filtros
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}