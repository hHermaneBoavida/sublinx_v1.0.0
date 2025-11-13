import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, TrendingUp, Calendar, Navigation, DollarSign, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância', icon: TrendingUp, description: 'Mais relevante primeiro' },
  { value: 'distance', label: 'Distância', icon: Navigation, description: 'Mais perto primeiro', requiresLocation: true },
  { value: 'date_asc', label: 'Data (mais cedo)', icon: Calendar, description: 'Próximos eventos' },
  { value: 'date_desc', label: 'Data (mais tarde)', icon: Calendar, description: 'Eventos futuros' },
  { value: 'popularity', label: 'Popularidade', icon: TrendingUp, description: 'Mais participantes' },
  { value: 'price_asc', label: 'Preço (menor)', icon: DollarSign, description: 'Mais barato' },
  { value: 'price_desc', label: 'Preço (maior)', icon: DollarSign, description: 'Mais caro' },
];

export default function SearchSortControls({ value, onChange, hasLocation, compact = false }) {
  const selectedOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0];
  const Icon = selectedOption.icon;

  if (compact) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white h-9 text-xs">
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-cyan-400" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600 text-white">
          {SORT_OPTIONS.map(option => {
            const OptionIcon = option.icon;
            const disabled = option.requiresLocation && !hasLocation;
            
            return (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={disabled}
                className="text-sm"
              >
                <div className="flex items-center gap-2">
                  <OptionIcon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {disabled && (
                    <Badge variant="outline" className="text-[9px] border-gray-600">
                      Requer localização
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <ArrowUpDown className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Ordenar Por</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {SORT_OPTIONS.map(option => {
          const OptionIcon = option.icon;
          const isActive = value === option.value;
          const disabled = option.requiresLocation && !hasLocation;
          
          return (
            <Button
              key={option.value}
              onClick={() => !disabled && onChange(option.value)}
              variant="outline"
              size="sm"
              disabled={disabled}
              className={`justify-start h-auto py-2 px-3 ${
                isActive 
                  ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300' 
                  : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
              } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-start gap-1 w-full">
                <div className="flex items-center gap-2">
                  <OptionIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{option.label}</span>
                </div>
                {!disabled && (
                  <span className="text-[10px] text-gray-400">{option.description}</span>
                )}
                {disabled && (
                  <span className="text-[9px] text-orange-400">📍 Precisa localização</span>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}