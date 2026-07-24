import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Zap, Globe, Music, Moon, Users, Flame, MapPin } from 'lucide-react';

const vibes = [
  { 
    id: 'all', 
    label: 'Todas', 
    icon: Globe,
    glow: 'rgba(6, 182, 212, 0.8)',
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgHover: 'hover:bg-cyan-500/10',
    bgGradient: 'from-cyan-500/20 to-blue-500/20',
    description: 'Explore tudo que está rolando',
    genres: [],
    vibeTypes: []
  },
  { 
    id: 'dançar', 
    label: 'Dançar', 
    icon: Music,
    glow: 'rgba(236, 72, 153, 0.8)',
    iconColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgHover: 'hover:bg-pink-500/10',
    bgGradient: 'from-pink-500/20 to-purple-500/20',
    description: 'Alta energia, pista lotada, som pesado',
    genres: ['techno', 'house', 'trance', 'drum_bass', 'dubstep', 'funk', 'trap'],
    vibeTypes: ['dançar']
  },
  { 
    id: 'relaxar', 
    label: 'Relaxar', 
    icon: Moon,
    glow: 'rgba(59, 130, 246, 0.8)',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgHover: 'hover:bg-blue-500/10',
    bgGradient: 'from-blue-500/20 to-indigo-500/20',
    description: 'Vibes calmas, lounge, conversar',
    genres: ['ambient', 'experimental', 'minimal'],
    vibeTypes: ['relaxar']
  },
  { 
    id: 'socializar', 
    label: 'Socializar', 
    icon: Users,
    glow: 'rgba(168, 85, 247, 0.8)',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgHover: 'hover:bg-purple-500/10',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    description: 'Conectar, networking, novas amizades',
    genres: ['samba', 'pagode', 'kizomba', 'kuduro', 'reggae'],
    vibeTypes: ['socializar']
  },
  { 
    id: 'adrenalina', 
    label: 'Adrenalina', 
    icon: Flame,
    glow: 'rgba(249, 115, 22, 0.8)',
    iconColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgHover: 'hover:bg-orange-500/10',
    bgGradient: 'from-orange-500/20 to-red-500/20',
    description: 'Underground radical, experiências extremas',
    genres: ['hardcore', 'acid', 'experimental'],
    vibeTypes: ['adrenalina']
  },
];

export default function VibeSelector({ onClose, onVibeSelect, events = [] }) {
  const handleVibeClick = (vibeId) => {
    console.log('🎵 Vibe selecionada:', vibeId);
    onVibeSelect(vibeId);
  };

  // Calcular eventos por vibe
  const eventsPerVibe = useMemo(() => {
    if (!events || events.length === 0) return {};
    
    const counts = {};
    vibes.forEach(vibe => {
      if (vibe.id === 'all') {
        counts[vibe.id] = events.length;
      } else {
        counts[vibe.id] = events.filter(event => {
          // Filtrar por gênero
          const genreMatch = vibe.genres.length === 0 || vibe.genres.includes(event.genre);
          
          // Filtrar por vibe tags
          const vibeMatch = vibe.vibeTypes.length === 0 || 
            (event.vibe_tags && event.vibe_tags.some(tag => vibe.vibeTypes.includes(tag)));
          
          return genreMatch || vibeMatch;
        }).length;
      }
    });
    
    return counts;
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="bg-black border-2 border-cyan-500/30 rounded-xl p-4 sm:p-5 w-full max-w-sm relative overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.2), 0 0 80px rgba(168, 85, 247, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full h-7 w-7 z-50"
        >
          <X className="w-4 h-4" />
        </Button>
        
        {/* Header Neon */}
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
            className="flex items-center justify-center gap-2 mb-2"
          >
            <Zap 
              className="w-6 h-6 text-cyan-400"
              style={{
                filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 1)) drop-shadow(0 0 30px rgba(6, 182, 212, 0.6))'
              }}
            />
            <h2 
              className="text-lg sm:text-xl font-bold text-cyan-400 uppercase tracking-wide"
              style={{
                textShadow: `
                  0 0 10px rgba(6, 182, 212, 1),
                  0 0 20px rgba(6, 182, 212, 0.8),
                  0 0 40px rgba(6, 182, 212, 0.6)
                `,
                letterSpacing: '0.05em'
              }}
            >
              SENTE A FREQUÊNCIA
            </h2>
          </motion.div>
          
          <p className="text-gray-400 text-xs">
            Escolhe tua vibe e entra no fluxo.
          </p>
        </div>
        
        {/* Grid de Vibes - MELHORADO */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {vibes.slice(0, 4).map((vibe, index) => {
            const Icon = vibe.icon;
            const eventCount = eventsPerVibe[vibe.id] || 0;
            
            return (
              <motion.button
                key={vibe.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleVibeClick(vibe.id)}
                className={`relative group p-3 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm ${vibe.borderColor} ${vibe.bgHover} active:scale-95 overflow-hidden`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: `linear-gradient(135deg, ${vibe.glow}15, transparent)`
                }}
              >
                {/* Glow Animado */}
                <motion.div 
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${vibe.glow} 0%, transparent 70%)`,
                    filter: 'blur(20px)'
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0, 0.3, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <Icon 
                    className={`w-7 h-7 ${vibe.iconColor}`}
                    style={{
                      filter: `drop-shadow(0 0 8px ${vibe.glow})`
                    }}
                  />
                  
                  <span 
                    className="text-xs font-bold text-white"
                    style={{
                      textShadow: `0 0 15px ${vibe.glow}`
                    }}
                  >
                    {vibe.label}
                  </span>

                  {/* Badge com contador de eventos */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-xs text-gray-400 font-semibold">
                      {eventCount} {eventCount === 1 ? 'evento' : 'eventos'}
                    </span>
                  </div>

                  {/* Descrição da vibe */}
                  <p className="text-xs text-gray-500 text-center line-clamp-2 mt-0.5">
                    {vibe.description}
                  </p>
                </div>

                {/* Partículas temáticas */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-60"
                    style={{
                      background: vibe.glow,
                      left: `${20 + i * 30}%`,
                      top: `${10 + i * 20}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0, 0.6, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.button>
            );
          })}
        </div>

        {/* Card Adrenalina - Full Width MELHORADO */}
        {vibes.slice(4).map((vibe) => {
          const Icon = vibe.icon;
          const eventCount = eventsPerVibe[vibe.id] || 0;
          
          return (
            <motion.button
              key={vibe.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => handleVibeClick(vibe.id)}
              className={`relative group p-3 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm ${vibe.borderColor} ${vibe.bgHover} w-full active:scale-95 overflow-hidden`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: `linear-gradient(135deg, ${vibe.glow}15, transparent)`
              }}
            >
              {/* Glow Animado */}
              <motion.div 
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${vibe.glow} 0%, transparent 70%)`,
                  filter: 'blur(20px)'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0, 0.3, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2.5 mb-1">
                  <Icon 
                    className={`w-8 h-8 ${vibe.iconColor}`}
                    style={{
                      filter: `drop-shadow(0 0 12px ${vibe.glow})`
                    }}
                  />
                  
                  <span 
                    className="text-base font-bold text-white"
                    style={{
                      textShadow: `0 0 15px ${vibe.glow}`
                    }}
                  >
                    {vibe.label}
                  </span>
                </div>

                {/* Info adicional */}
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400 font-semibold">
                    {eventCount} {eventCount === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  {vibe.description}
                </p>
              </div>

              {/* Chamas animadas para Adrenalina */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-70"
                  style={{
                    background: `linear-gradient(to top, ${vibe.glow}, transparent)`,
                    left: `${15 + i * 18}%`,
                    bottom: '5px',
                  }}
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0, 0.7, 0],
                    scale: [0.5, 1.5, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.button>
          );
        })}

        {/* Footer com dica */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-600">
            💡 Cada vibe filtra eventos com a energia perfeita para você
          </p>
        </div>
      </motion.div>

      {/* Background Particles Temáticos */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, rgba(6, 182, 212, 0.8), rgba(168, 85, 247, 0.8))`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  );
}