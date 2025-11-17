import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { X, Calendar, MapPin, TrendingUp, DollarSign } from 'lucide-react';

export default function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onClose,
  eventStats 
}) {
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
      maxPrice: 500
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl border-t sm:border border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Filtros Avançados</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Distância */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <label className="text-sm font-semibold text-white">Distância Máxima</label>
              </div>
              <Badge className="bg-green-600">{localFilters.maxDistance} km</Badge>
            </div>
            <Slider
              value={[localFilters.maxDistance]}
              onValueChange={(value) => setLocalFilters({ ...localFilters, maxDistance: value[0] })}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Data */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <label className="text-sm font-semibold text-white">Período</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'today', label: 'Hoje' },
                { value: 'week', label: 'Esta Semana' },
                { value: 'month', label: 'Este Mês' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={localFilters.dateRange === option.value ? 'default' : 'outline'}
                  onClick={() => setLocalFilters({ ...localFilters, dateRange: option.value })}
                  className={localFilters.dateRange === option.value ? 'bg-cyan-600' : 'border-gray-700'}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Popularidade */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <label className="text-sm font-semibold text-white">Participantes Mínimos</label>
              </div>
              <Badge className="bg-purple-600">{localFilters.minAttendees}+</Badge>
            </div>
            <Slider
              value={[localFilters.minAttendees]}
              onValueChange={(value) => setLocalFilters({ ...localFilters, minAttendees: value[0] })}
              min={0}
              max={500}
              step={10}
              className="w-full"
            />
          </div>

          {/* Preço */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <label className="text-sm font-semibold text-white">Preço Máximo</label>
              </div>
              <Badge className="bg-yellow-600">
                {localFilters.maxPrice === 500 ? 'Sem limite' : `R$ ${localFilters.maxPrice}`}
              </Badge>
            </div>
            <Slider
              value={[localFilters.maxPrice]}
              onValueChange={(value) => setLocalFilters({ ...localFilters, maxPrice: value[0] })}
              min={0}
              max={500}
              step={10}
              className="w-full"
            />
          </div>

          {/* Stats */}
          {eventStats && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Eventos encontrados:</p>
              <p className="text-2xl font-bold text-cyan-400">{eventStats.filtered}</p>
              <p className="text-xs text-gray-500">de {eventStats.total} eventos</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-4 flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 border-gray-700 text-gray-300"
          >
            Limpar
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            Aplicar Filtros
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}