import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, CheckCircle, Globe } from 'lucide-react';

const genres = ["all", "techno", "house", "trance", "drum_bass", "dubstep", "experimental", "funk", "trap", "kuduro", "kizomba", "samba", "pagode", "rap", "reggae"];
const types = ["all", "rave", "warehouse", "rooftop", "underground", "club", "secret"];

export default function FilterPanel({ onClose, onApplyFilters, currentFilters }) {
  const [localFilters, setLocalFilters] = useState(currentFilters || { genre: 'all', type: 'all', verified: 'all' });

  const handleFilterChange = (filterType, value) => {
    setLocalFilters(prev => ({ ...prev, [filterType]: value }));
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: '0%' }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="absolute top-0 right-0 h-full w-full max-w-sm bg-black/80 backdrop-blur-lg z-30 p-6 border-l border-gray-700"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white font-orbitron">Filtros</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-6 h-6 text-gray-400" />
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* NOVO: Filtro de Verificação */}
        <div>
          <label className="text-gray-300 font-space-grotesk flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            Fonte dos Eventos
          </label>
          <Select value={localFilters.verified} onValueChange={(value) => handleFilterChange('verified', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span>Todos os Eventos</span>
                </div>
              </SelectItem>
              <SelectItem value="verified">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>Apenas Oficiais Sublinx</span>
                </div>
              </SelectItem>
              <SelectItem value="external">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span>Apenas Externos</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            {localFilters.verified === 'verified' && '✓ Eventos verificados pela equipe Sublinx'}
            {localFilters.verified === 'external' && '🌐 Eventos de plataformas externas (Eventbrite, etc)'}
            {localFilters.verified === 'all' && '📍 Mostrando todos os eventos disponíveis'}
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        
        <div>
          <label className="text-gray-300 font-space-grotesk">Gênero Musical</label>
          <Select value={localFilters.genre} onValueChange={(value) => handleFilterChange('genre', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              {genres.map(g => <SelectItem key={g} value={g} className="capitalize">{g === 'all' ? 'Todos os Gêneros' : g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-gray-300 font-space-grotesk">Tipo de Evento</label>
          <Select value={localFilters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              {types.map(t => <SelectItem key={t} value={t} className="capitalize">{t === 'all' ? 'Todos os Tipos' : t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-xs text-purple-300 text-center">
            💡 Para filtrar por vibe (Dançar, Relaxar, etc), use o botão "Vibes" no mapa
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-6 right-6">
        <Button onClick={() => onApplyFilters(localFilters)} className="w-full bg-gradient-to-r from-cyan-500 to-purple-500">
          Aplicar Filtros
        </Button>
      </div>
    </motion.div>
  );
}