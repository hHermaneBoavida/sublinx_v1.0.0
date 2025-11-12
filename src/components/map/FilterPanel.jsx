import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, Calendar, DollarSign, TrendingUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function FilterPanel({ onClose, onApplyFilters, currentFilters = {} }) {
  const [filters, setFilters] = useState({
    genre: currentFilters.genre || "all",
    type: currentFilters.type || "all",
    dateRange: currentFilters.dateRange || "all",
    customStartDate: currentFilters.customStartDate || "",
    customEndDate: currentFilters.customEndDate || "",
    priceRange: currentFilters.priceRange || "all",
    minPrice: currentFilters.minPrice || "",
    maxPrice: currentFilters.maxPrice || "",
    sortBy: currentFilters.sortBy || "date",
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      genre: "all",
      type: "all",
      dateRange: "all",
      customStartDate: "",
      customEndDate: "",
      priceRange: "all",
      minPrice: "",
      maxPrice: "",
      sortBy: "date",
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'customStartDate' || key === 'customEndDate' || key === 'minPrice' || key === 'maxPrice') return false;
    return value !== "all" && value !== "date";
  }).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="bg-gradient-to-b from-gray-900 to-black border-t sm:border border-gray-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-600 to-purple-600 rounded-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Filtros Avançados</h2>
                  <p className="text-xs text-gray-400">
                    Personalize sua busca por eventos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Badge className="bg-cyan-600 text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-4 space-y-6">
            {/* Gênero Musical */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full" />
                Gênero Musical
              </Label>
              <Select value={filters.genre} onValueChange={(value) => handleFilterChange("genre", value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">Todos os Gêneros</SelectItem>
                  <SelectItem value="techno">Techno</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="trance">Trance</SelectItem>
                  <SelectItem value="drum_bass">Drum & Bass</SelectItem>
                  <SelectItem value="dubstep">Dubstep</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                  <SelectItem value="funk">Funk</SelectItem>
                  <SelectItem value="trap">Trap</SelectItem>
                  <SelectItem value="rap">Rap</SelectItem>
                  <SelectItem value="reggae">Reggae</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-gray-700" />

            {/* Tipo de Evento */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full" />
                Tipo de Evento
              </Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="rave">Rave</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="rooftop">Rooftop</SelectItem>
                  <SelectItem value="underground">Underground</SelectItem>
                  <SelectItem value="club">Club</SelectItem>
                  <SelectItem value="secret">Secret</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-gray-700" />

            {/* Data */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Data do Evento
              </Label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">Todas as Datas</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="tomorrow">Amanhã</SelectItem>
                  <SelectItem value="this_week">Esta Semana</SelectItem>
                  <SelectItem value="this_weekend">Este Final de Semana</SelectItem>
                  <SelectItem value="next_week">Próxima Semana</SelectItem>
                  <SelectItem value="this_month">Este Mês</SelectItem>
                  <SelectItem value="custom">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {filters.dateRange === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-3 mt-3"
                >
                  <div>
                    <Label className="text-xs text-gray-400 mb-1.5 block">Data Inicial</Label>
                    <Input
                      type="date"
                      value={filters.customStartDate}
                      onChange={(e) => handleFilterChange("customStartDate", e.target.value)}
                      className="bg-gray-800/50 border-gray-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 mb-1.5 block">Data Final</Label>
                    <Input
                      type="date"
                      value={filters.customEndDate}
                      onChange={(e) => handleFilterChange("customEndDate", e.target.value)}
                      className="bg-gray-800/50 border-gray-600 text-white text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <Separator className="bg-gray-700" />

            {/* Preço */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Faixa de Preço
              </Label>
              <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange("priceRange", value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">Todos os Preços</SelectItem>
                  <SelectItem value="free">Grátis (R$ 0)</SelectItem>
                  <SelectItem value="low">Econômico (R$ 1 - 50)</SelectItem>
                  <SelectItem value="medium">Moderado (R$ 51 - 100)</SelectItem>
                  <SelectItem value="high">Premium (R$ 101 - 200)</SelectItem>
                  <SelectItem value="vip">VIP (R$ 200+)</SelectItem>
                  <SelectItem value="custom">Faixa Personalizada</SelectItem>
                </SelectContent>
              </Select>

              {filters.priceRange === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-3 mt-3"
                >
                  <div>
                    <Label className="text-xs text-gray-400 mb-1.5 block">Preço Mínimo (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      placeholder="0"
                      className="bg-gray-800/50 border-gray-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 mb-1.5 block">Preço Máximo (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      placeholder="1000"
                      className="bg-gray-800/50 border-gray-600 text-white text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <Separator className="bg-gray-700" />

            {/* Ordenação */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Ordenar Por
              </Label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="date">Data (mais próximo)</SelectItem>
                  <SelectItem value="date_desc">Data (mais distante)</SelectItem>
                  <SelectItem value="price_asc">Preço (menor → maior)</SelectItem>
                  <SelectItem value="price_desc">Preço (maior → menor)</SelectItem>
                  <SelectItem value="popularity">Popularidade (curtidas)</SelectItem>
                  <SelectItem value="capacity">Lotação (mais participantes)</SelectItem>
                  <SelectItem value="distance">Distância (mais próximo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-t from-black via-gray-900 to-gray-900/95 border-t border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Limpar Filtros
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                Aplicar Filtros
                {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}