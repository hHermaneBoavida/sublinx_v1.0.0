import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, TrendingUp, Calendar, MapPin, DollarSign, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export const SORT_OPTIONS = [
  {
    value: 'distance',
    label: 'Mais Próximos',
    icon: MapPin,
    description: 'Por distância de você',
    requiresLocation: true
  },
  {
    value: 'date_asc',
    label: 'Data (Próximos Primeiro)',
    icon: Calendar,
    description: 'Eventos que acontecem primeiro'
  },
  {
    value: 'date_desc',
    label: 'Data (Últimos Primeiro)',
    icon: Calendar,
    description: 'Eventos mais distantes'
  },
  {
    value: 'popularity',
    label: 'Popularidade',
    icon: TrendingUp,
    description: 'Mais participantes confirmados'
  },
  {
    value: 'likes',
    label: 'Mais Curtidos',
    icon: TrendingUp,
    description: 'Eventos com mais curtidas'
  },
  {
    value: 'price_asc',
    label: 'Preço (Menor)',
    icon: DollarSign,
    description: 'Do mais barato ao mais caro'
  },
  {
    value: 'price_desc',
    label: 'Preço (Maior)',
    icon: DollarSign,
    description: 'Do mais caro ao mais barato'
  },
  {
    value: 'capacity',
    label: 'Capacidade',
    icon: Users,
    description: 'Maior capacidade primeiro'
  }
];

export default function SortControls({ value, onChange, hasLocation }) {
  const currentOption = SORT_OPTIONS.find(opt => opt.value === value);
  const Icon = currentOption?.icon || ArrowUpDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-2 mb-2">
        <ArrowUpDown className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-gray-400">Ordenar por:</span>
      </div>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-gray-900/80 border-gray-700 text-white h-10">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-cyan-400" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600 text-white">
          {SORT_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const isDisabled = option.requiresLocation && !hasLocation;
            
            return (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={isDisabled}
                className="cursor-pointer hover:bg-gray-700 py-3"
              >
                <div className="flex items-start gap-3">
                  <OptionIcon className={`w-4 h-4 mt-0.5 ${isDisabled ? 'text-gray-600' : 'text-cyan-400'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${isDisabled ? 'text-gray-600' : 'text-white'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-400">
                      {option.description}
                      {isDisabled && ' (localização necessária)'}
                    </p>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Active Sort Info */}
      {currentOption && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-2 text-xs text-gray-500"
        >
          <div className="w-1 h-1 rounded-full bg-cyan-400" />
          <span>{currentOption.description}</span>
        </motion.div>
      )}
    </motion.div>
  );
}