import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdvancedFilters({ filters, onChange, onClose, eventsCount }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      genre: "all",
      type: "all",
      dateRange: "all",
      maxDistance: 50,
      minPopularity: 0,
      sortBy: "distance"
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border-t border-gray-700 md:border md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">Filtros Avançados</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Data */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Período
            </label>
            <Select 
              value={localFilters.dateRange} 
              onValueChange={(value) => setLocalFilters({...localFilters, dateRange: value})}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="weekend">Fim de semana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Distância */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                Distância Máxima
              </span>
              <span className="text-cyan-400">{localFilters.maxDistance}km</span>
            </label>
            <Slider
              value={[localFilters.maxDistance]}
              onValueChange={(value) => setLocalFilters({...localFilters, maxDistance: value[0]})}
              min={1}
              max={50}
              step={1}
              className="py-4"
            />
          </div>

          {/* Popularidade */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Popularidade Mínima
              </span>
              <span className="text-cyan-400">{localFilters.minPopularity}</span>
            </label>
            <Slider
              value={[localFilters.minPopularity]}
              onValueChange={(value) => setLocalFilters({...localFilters, minPopularity: value[0]})}
              min={0}
              max={100}
              step={5}
              className="py-4"
            />
          </div>

          {/* Ordenação */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">
              Ordenar por
            </label>
            <Select 
              value={localFilters.sortBy} 
              onValueChange={(value) => setLocalFilters({...localFilters, sortBy: value})}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="distance">Distância</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="popularity">Popularidade</SelectItem>
                <SelectItem value="price">Preço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultados */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-cyan-300">Eventos encontrados:</span>
            <Badge className="bg-cyan-600">{eventsCount}</Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 flex gap-2">
          <Button onClick={handleReset} variant="outline" className="flex-1 border-gray-700 text-gray-300">
            Limpar
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600">
            Aplicar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}