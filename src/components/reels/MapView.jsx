
import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Menu, Search, MapPin, Navigation, Compass, Music2, Layers } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// NOVO: Sistema de clustering inteligente
const clusterEvents = (events, zoomLevel = 1) => {
  if (!events || events.length === 0) return [];
  
  const CLUSTER_RADIUS = 0.01 * (1 / zoomLevel); // Ajusta com zoom
  const clusters = [];
  const processed = new Set();

  events.forEach((event, index) => {
    if (processed.has(index)) return;

    const cluster = {
      events: [event],
      center: { lat: event.location.lat, lng: event.location.lng },
      isCluster: false
    };

    // Buscar eventos próximos
    events.forEach((other, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;

      const distance = Math.sqrt(
        Math.pow(event.location.lat - other.location.lat, 2) +
        Math.pow(event.location.lng - other.location.lng, 2)
      );

      if (distance < CLUSTER_RADIUS) {
        cluster.events.push(other);
        processed.add(otherIndex);
      }
    });

    // Calcular centro do cluster
    if (cluster.events.length > 1) {
      cluster.isCluster = true;
      cluster.center = {
        lat: cluster.events.reduce((sum, e) => sum + e.location.lat, 0) / cluster.events.length,
        lng: cluster.events.reduce((sum, e) => sum + e.location.lng, 0) / cluster.events.length
      };
    }

    processed.add(index);
    clusters.push(cluster);
  });

  return clusters;
};

// Componente de Pin OTIMIZADO
const EventPin = memo(({ cluster, position, onClick, theme, isExpanded }) => {
  const { events, isCluster: isClusterGroup } = cluster;
  const mainEvent = events[0];
  
  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto z-10"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
      }}
      whileHover={{ scale: 1.1, zIndex: 20 }}
      onClick={() => onClick(cluster)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      {/* Tooltip ao Hover */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute bottom-full mb-2 px-3 py-2 bg-black/95 backdrop-blur-xl rounded-xl text-white text-[11px] whitespace-nowrap border-2 shadow-2xl pointer-events-none"
        style={{
          borderColor: theme?.glowColor || 'rgba(6, 182, 212, 0.5)',
          boxShadow: `0 0 20px ${theme?.glowColor || 'rgba(6, 182, 212, 0.5)'}`
        }}
      >
        {isClusterGroup ? (
          <>
            <div className="font-bold text-cyan-300 mb-1">
              {events.length} eventos próximos
            </div>
            <div className="text-[9px] text-gray-400">
              Clique para ver todos
            </div>
          </>
        ) : (
          <>
            <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1">
              <Music2 className="w-3 h-3" />
              {mainEvent.title}
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <MapPin className="w-3 h-3 text-purple-400" />
              <span className="text-gray-300 truncate max-w-[120px]">
                {mainEvent.location.venue_name}
              </span>
            </div>
          </>
        )}
      </motion.div>

      {/* Pin Visual REDESENHADO */}
      <motion.div 
        className="relative"
        animate={{
          boxShadow: [
            `0 0 20px ${theme?.glowColor || 'rgba(6, 182, 212, 0.6)'}`,
            `0 0 30px ${theme?.glowColor || 'rgba(6, 182, 212, 0.8)'}`,
            `0 0 20px ${theme?.glowColor || 'rgba(6, 182, 212, 0.6)'}`
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          filter: `drop-shadow(0 0 ${isClusterGroup ? '12px' : '8px'} ${theme?.glowColor || 'rgba(6, 182, 212, 0.6)'})`
        }}
      >
        {/* Pin Principal */}
        <div 
          className={`${isClusterGroup ? 'w-12 h-12' : 'w-9 h-9'} rounded-full border-3 border-white/90 bg-gradient-to-br flex items-center justify-center relative`}
          style={{
            background: `linear-gradient(135deg, ${theme?.glowColor || 'rgba(6, 182, 212, 0.9)'}, ${theme?.glowColor || 'rgba(168, 85, 247, 0.9)'})`
          }}
        >
          {isClusterGroup ? (
            <div className="text-white font-bold text-sm">
              {events.length}
            </div>
          ) : (
            <motion.div 
              className="w-3 h-3 rounded-full bg-white"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>

        {/* Halo de Glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme?.glowColor || 'rgba(6, 182, 212, 0.3)'} 0%, transparent 70%)`
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </motion.div>
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.cluster.events.length === next.cluster.events.length &&
    prev.position.x === next.position.x &&
    prev.position.y === next.position.y &&
    prev.theme?.glowColor === next.theme?.glowColor
  );
});

EventPin.displayName = 'EventPin';

export default function MapView({
  events,
  userLocation,
  onPinClick,
  onPinDetailsClick,
  onSwipeUp,
  onOpenFilters,
  onOpenVibe,
  onOpenUpload,
  searchTerm,
  onSearchChange,
  activeVibe = 'all'
}) {
  const [showRadiusInfo, setShowRadiusInfo] = useState(false);
  const [expandedCluster, setExpandedCluster] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  const canCreateReels = user && (user.is_pro_member || user.is_organizer);

  // Tema visual por vibe
  const vibeTheme = useMemo(() => {
    const themes = {
      'all': {
        glowColor: 'rgba(6, 182, 212, 0.8)',
        overlayGradient: 'from-cyan-900/10 via-black to-purple-900/10'
      },
      'dançar': {
        glowColor: 'rgba(236, 72, 153, 0.8)',
        overlayGradient: 'from-pink-900/20 via-black to-purple-900/20'
      },
      'relaxar': {
        glowColor: 'rgba(59, 130, 246, 0.8)',
        overlayGradient: 'from-blue-900/20 via-black to-indigo-900/20'
      },
      'socializar': {
        glowColor: 'rgba(168, 85, 247, 0.8)',
        overlayGradient: 'from-purple-900/20 via-black to-pink-900/20'
      },
      'adrenalina': {
        glowColor: 'rgba(249, 115, 22, 0.8)',
        overlayGradient: 'from-orange-900/20 via-black to-red-900/20'
      }
    };
    return themes[activeVibe] || themes['all'];
  }, [activeVibe]);

  const RADIUS_KM = 10;

  // Validar e filtrar eventos
  const validEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    return events.filter(e => {
      if (!e?.id || !e?.title || !e?.location?.lat || !e?.location?.lng) return false;
      
      const R = 6371;
      const dLat = (e.location.lat - userLocation.lat) * Math.PI / 180;
      const dLng = (e.location.lng - userLocation.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(e.location.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return distance <= RADIUS_KM;
    });
  }, [events, userLocation]);

  // Sistema de clustering
  const eventClusters = useMemo(() => {
    return clusterEvents(validEvents, 1);
  }, [validEvents]);

  // Bounds do mapa
  const mapBounds = useMemo(() => {
    if (validEvents.length === 0) {
      return {
        minLat: userLocation.lat - 0.05,
        maxLat: userLocation.lat + 0.05,
        minLng: userLocation.lng - 0.05,
        maxLng: userLocation.lng + 0.05
      };
    }

    const lats = validEvents.map(e => e.location.lat);
    const lngs = validEvents.map(e => e.location.lng);

    return {
      minLat: Math.min(...lats, userLocation.lat) - 0.01,
      maxLat: Math.max(...lats, userLocation.lat) + 0.01,
      minLng: Math.min(...lngs, userLocation.lng) - 0.01,
      maxLng: Math.max(...lngs, userLocation.lat) + 0.01,
    };
  }, [validEvents, userLocation]);

  const bbox = useMemo(() => {
    return `${mapBounds.minLng},${mapBounds.minLat},${mapBounds.maxLng},${mapBounds.maxLat}`;
  }, [mapBounds]);

  const coordToPosition = useCallback((lat, lng) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    return { x, y };
  }, [mapBounds]);

  const userPosition = useMemo(() => {
    return coordToPosition(userLocation.lat, userLocation.lng);
  }, [userLocation, coordToPosition]);

  const handleClusterClick = useCallback((cluster) => {
    if (cluster.isCluster) {
      setExpandedCluster(cluster);
    } else {
      onPinDetailsClick(cluster.events[0]);
    }
  }, [onPinDetailsClick]);

  return (
    <motion.div
      className="w-full h-full relative overflow-hidden"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.1 }}
      onDragEnd={(event, info) => {
        if (info.offset.y < -50 && Math.abs(info.offset.x) < 50) {
          onSwipeUp();
        }
      }}
    >
      {/* Background Temático DARK NEON */}
      <div className="absolute inset-0 z-0 bg-black">
        <div className={`absolute inset-0 bg-gradient-to-br ${vibeTheme.overlayGradient}`} />
        
        {/* Grid Cyber Sutil */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${vibeTheme.glowColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${vibeTheme.glowColor} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Mapa OpenStreetMap DARK */}
      <div className="absolute inset-0 z-1">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}`}
          className="absolute inset-0"
          style={{
            filter: 'grayscale(100%) invert(95%) brightness(0.35) contrast(1.2) hue-rotate(180deg)',
            opacity: 0.6,
            pointerEvents: 'none'
          }}
          loading="lazy"
        />
      </div>

      {/* Overlay Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 pointer-events-none z-2" />

      {/* Markers Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Marcador do Usuário REDESENHADO - MENOR E MAIS ATRAENTE */}
        <motion.div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-40"
          style={{ 
            left: `${userPosition.x}%`, 
            top: `${userPosition.y}%`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.4
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Camada 1: Glow Ambiente Difuso - REDUZIDO */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '200px',
                height: '200px',
                background: `radial-gradient(circle at center, 
                  ${vibeTheme.glowColor}20 0%, 
                  ${vibeTheme.glowColor}12 30%, 
                  ${vibeTheme.glowColor}06 60%,
                  transparent 100%)`,
                filter: 'blur(18px)',
              }}
              animate={{
                scale: [1, 1.12, 1],
                opacity: [0.35, 0.65, 0.35],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Camada 2: Rastro de Energia - REDUZIDO */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '150px',
                height: '150px',
                background: `radial-gradient(circle at center, 
                  ${vibeTheme.glowColor}18 0%, 
                  transparent 65%)`,
                filter: 'blur(12px)',
              }}
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.4
              }}
            />

            {/* Camada 3: Pulso Sonar - MAIS SUTIL */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '10px',
                height: '10px',
                background: `radial-gradient(circle, ${vibeTheme.glowColor} 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 25, 1],
                opacity: [0.9, 0, 0.9]
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeOut",
                repeatDelay: 1.5
              }}
            />

            {/* Camada 4: Anel de Alcance - MAIS REFINADO */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '170px',
                height: '170px',
                background: `radial-gradient(circle at center, 
                  transparent 62%, 
                  ${vibeTheme.glowColor}06 78%, 
                  ${vibeTheme.glowColor}12 92%,
                  transparent 100%)`,
                border: `1px solid ${vibeTheme.glowColor}25`,
                boxShadow: `
                  0 0 30px ${vibeTheme.glowColor}15,
                  inset 0 0 25px ${vibeTheme.glowColor}08
                `,
                filter: 'blur(1.5px)',
              }}
              animate={{
                scale: [1, 1.015, 1],
                opacity: [0.28, 0.48, 0.28],
              }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Camada 5: Marcador Central - MENOR E MAIS ELEGANTE */}
            <motion.div 
              className="relative z-50" 
              style={{
                filter: `drop-shadow(0 0 20px ${vibeTheme.glowColor}) drop-shadow(0 0 40px ${vibeTheme.glowColor}70)`,
              }}
              animate={{
                scale: [1, 1.06, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Núcleo Externo - REDUZIDO PARA 12x12 (48px) */}
              <div 
                className="w-12 h-12 rounded-full relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(circle at 35% 35%, 
                      rgba(59, 130, 246, 1) 0%,
                      rgba(99, 102, 241, 1) 35%,
                      ${vibeTheme.glowColor} 100%)
                  `,
                  border: '2.5px solid rgba(255, 255, 255, 0.95)',
                  boxShadow: `
                    0 0 25px ${vibeTheme.glowColor},
                    0 0 50px ${vibeTheme.glowColor}70,
                    inset 0 0 18px rgba(255, 255, 255, 0.35)
                  `,
                }}
              >
                {/* Brilho Interno Animado */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 42% 42%, 
                      rgba(255, 255, 255, 0.7) 0%, 
                      transparent 55%)`,
                  }}
                  animate={{
                    opacity: [0.5, 0.85, 0.5],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Ícone de Navegação - AJUSTADO */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Navigation 
                    className="w-5 h-5 text-white" 
                    strokeWidth={2.8}
                    style={{
                      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))'
                    }}
                  />
                </div>

                {/* Reflexo Superior */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.25), transparent)'
                  }}
                />
              </div>

              {/* Anel Orbital Externo */}
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{
                  borderColor: `${vibeTheme.glowColor}35`,
                  borderWidth: '1.5px',
                }}
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [0.75, 0, 0.75]
                }}
                transition={{
                  duration: 2.3,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />

              {/* Anel Orbital Interno */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `1px solid ${vibeTheme.glowColor}50`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0, 0.6]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.3
                }}
              />
            </motion.div>

            {/* Camada 6: Partículas Flutuantes - REDUZIDAS */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '3px',
                  height: '3px',
                  background: vibeTheme.glowColor,
                  filter: `blur(${Math.random() * 1.5}px)`,
                  left: `${25 + (i * 50 / 3)}%`,
                  top: `${15 + (i * 70 / 3)}%`,
                }}
                animate={{
                  y: [0, -12, 0],
                  x: [0, Math.sin(i) * 8, 0],
                  opacity: [0, 0.7, 0],
                  scale: [0.6, 1.1, 0.6]
                }}
                transition={{
                  duration: 3.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2.5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Event Clusters com AnimatePresence */}
        <AnimatePresence>
          {eventClusters.map((cluster, index) => {
            const position = coordToPosition(cluster.center.lat, cluster.center.lng);
            return (
              <EventPin
                key={`cluster-${index}-${cluster.events.map(e => e.id).join('-')}`}
                cluster={cluster}
                position={position}
                onClick={handleClusterClick}
                theme={vibeTheme}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Header Minimalista */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-30 flex flex-col gap-2">
        {/* Barra de Controles */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenVibe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border transition-all text-white text-xs"
            style={{
              borderColor: vibeTheme.glowColor,
              boxShadow: `0 0 15px ${vibeTheme.glowColor}40`
            }}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Vibes</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowRadiusInfo(!showRadiusInfo)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600/80 backdrop-blur-xl border border-blue-400/50 text-white text-xs"
          >
            <MapPin className="w-3 h-3" />
            <span>{RADIUS_KM}km</span>
          </motion.button>

          <Link to={createPageUrl("Feed")} className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/40 backdrop-blur-xl border-gray-700/30 text-white hover:bg-black/60 h-8 w-8"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 z-10" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 bg-black/60 backdrop-blur-xl border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-500/60 text-sm h-9 rounded-xl"
          />
        </div>

        {/* Info do Raio */}
        <AnimatePresence>
          {showRadiusInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-black/95 backdrop-blur-xl border-2 rounded-xl p-4 text-xs text-white"
              style={{
                borderColor: `${vibeTheme.glowColor}40`,
                boxShadow: `0 0 30px ${vibeTheme.glowColor}30`
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-cyan-300">Área de Eventos</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-gray-400">
                  📍 {validEvents.length} evento(s) próximo(s)
                </p>
                <p className="text-gray-400">
                  🎯 Raio: {RADIUS_KM}km
                </p>
                {eventClusters.length > 0 && (
                  <p className="text-gray-400">
                    🔗 {eventClusters.filter(c => c.isCluster).length} grupo(s)
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB Upload */}
      {canCreateReels && (
        <motion.div
          className="absolute bottom-20 right-3 z-30"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onOpenUpload}
            size="icon"
            className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 shadow-xl border-2 border-white/20"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </motion.div>
      )}

      {/* Ver Reels Button */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 pb-3 px-4"
        drag="y"
        dragConstraints={{ top: -100, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(event, info) => {
          if (info.offset.y < -50) onSwipeUp();
        }}
      >
        <div className="flex flex-col items-center cursor-pointer" onClick={onSwipeUp}>
          <motion.div
            className="w-10 h-1 rounded-full mb-2"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.glowColor}, rgba(168, 85, 247, 0.8))`
            }}
            animate={{ scaleX: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <motion.button
            className="backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl border border-white/20 flex items-center gap-2 text-sm"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.glowColor}, rgba(168, 85, 247, 0.9))`
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-4 h-4 text-white" />
            <span className="text-white font-semibold">Ver Reels</span>
          </motion.button>

          <motion.p 
            className="text-white/50 text-xs mt-1.5"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Arraste para cima
          </motion.p>
        </div>
      </motion.div>

      {/* Modal de Cluster Expandido */}
      <AnimatePresence>
        {expandedCluster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedCluster(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 rounded-2xl border-2 p-4 max-w-md w-full max-h-[70vh] overflow-y-auto"
              style={{
                borderColor: vibeTheme.glowColor,
                boxShadow: `0 0 40px ${vibeTheme.glowColor}40`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                {expandedCluster.events.length} Eventos Próximos
              </h3>
              
              <div className="space-y-2">
                {expandedCluster.events.map(event => (
                  <motion.div
                    key={event.id}
                    className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 cursor-pointer transition-all"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      onPinDetailsClick(event);
                      setExpandedCluster(null);
                    }}
                  >
                    <h4 className="font-semibold text-white text-sm mb-1">{event.title}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location.venue_name}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
