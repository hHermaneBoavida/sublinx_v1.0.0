import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, Users, Zap, Music } from "lucide-react";
import { motion } from "framer-motion";

/**
 * FILTROS RÁPIDOS POPULARES
 * Um clique para aplicar filtros comuns
 */
export default function QuickFilters({ onApplyQuickFilter, activeFilters = [] }) {
  const quickFilters = [
    {
      id: 'hoje',
      label: 'Hoje',
      icon: Calendar,
      color: 'from-cyan-600 to-blue-600',
      filter: { date_context: 'hoje' }
    },
    {
      id: 'amanha',
      label: 'Amanhã',
      icon: Calendar,
      color: 'from-purple-600 to-pink-600',
      filter: { date_context: 'amanhã' }
    },
    {
      id: 'fim_semana',
      label: 'Fim de Semana',
      icon: Calendar,
      color: 'from-orange-600 to-yellow-600',
      filter: { date_context: 'fim_de_semana' }
    },
    {
      id: 'perto',
      label: 'Perto de Mim',
      icon: MapPin,
      color: 'from-green-600 to-emerald-600',
      filter: { sort: 'distance', maxDistance: 5 }
    },
    {
      id: 'gratis',
      label: 'Grátis',
      icon: DollarSign,
      color: 'from-yellow-600 to-orange-600',
      filter: { priceRange: [0, 0] }
    },
    {
      id: 'barato',
      label: 'Até R$ 50',
      icon: DollarSign,
      color: 'from-blue-600 to-cyan-600',
      filter: { priceRange: [0, 50] }
    },
    {
      id: 'popular',
      label: 'Populares',
      icon: Users,
      color: 'from-red-600 to-pink-600',
      filter: { sort: 'popularity', minAttendees: 50 }
    },
    {
      id: 'hot',
      label: 'Bombando 🔥',
      icon: Zap,
      color: 'from-orange-600 to-red-600',
      filter: { sort: 'popularity', minOccupancy: 70 }
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-white">Filtros Rápidos</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((qf, index) => {
          const Icon = qf.icon;
          const isActive = activeFilters.includes(qf.id);

          return (
            <motion.div
              key={qf.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                onClick={() => onApplyQuickFilter(qf.id, qf.filter)}
                size="sm"
                className={`h-8 px-3 text-xs font-semibold transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${qf.color} text-white scale-105`
                    : 'bg-gray-800/50 border border-gray-600 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {qf.label}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-700/50">
          <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-[10px]">
            {activeFilters.length} filtro{activeFilters.length > 1 ? 's' : ''} ativo{activeFilters.length > 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
}