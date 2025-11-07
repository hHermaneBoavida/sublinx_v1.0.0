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

// Componente de Pin OTIMIZADO COM NEON INTENSO
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
      whileHover={{ scale: 1.15, zIndex: 20 }}
      onClick={() => onClick(cluster)}
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0, rotate: 180 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 400, damping: 15 }}
    >
      {/* Tooltip NEON ao Hover */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-full mb-3 px-4 py-2.5 bg-black/95 backdrop-blur-2xl rounded-2xl text-white text-xs whitespace-nowrap border-2 shadow-2xl pointer-events-none"
        style={{
          borderColor: theme?.glowColor || 'rgba(6, 182, 212, 0.6)',
          boxShadow: `0 0 30px ${theme?.glowColor || 'rgba(6, 182, 212, 0.5)'}, 0 0 60px ${theme?.glowColor || 'rgba(6, 182, 212, 0.3)'}`
        }}
      >
        {isClusterGroup ? (
          <>
            <div className="font-bold text-cyan-300 mb-1.5 text-sm">
              🎯 {events.length} eventos próximos
            </div>
            <div className="text-[10px] text-gray-400">
              Clique para expandir
            </div>
          </>
        ) : (
          <>
            <div className="font-bold text-cyan-300 mb-1.5 flex items-center gap-2 text-sm">
              <Music2 className="w-4 h-4" />
              {mainEvent.title}
            </div>
            <div className="flex items-center gap-2 text-[11px] mb-1">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-gray-300 truncate max-w-[140px]">
                {mainEvent.location.venue_name}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              <span className="px-2 py-0.5 bg-purple-600/30 rounded-full">
                {mainEvent.genre}
              </span>
            </div>
          </>
        )}
        
        {/* Triangulo do tooltip */}
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent"
          style={{
            borderTopColor: theme?.glowColor || 'rgba(6, 182, 212, 0.6)'
          }}
        />
      </motion.div>

      {/* Pin Visual NEON INTENSO */}
      <motion.div 
        className="relative"
        animate={{
          boxShadow: [
            `0 0 20px ${theme?.glowColor || 'rgba(6, 182, 212, 0.7)'}`,
            `0 0 40px ${theme?.glowColor || 'rgba(6, 182, 212, 1)'}`,
            `0 0 20px ${theme?.glowColor || 'rgba(6, 182, 212, 0.7)'}`
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          filter: `drop-shadow(0 0 ${isClusterGroup ? '15px' : '10px'} ${theme?.glowColor || 'rgba(6, 182, 212, 0.8)'})`
        }}
      >
        {/* Pin Principal REDESENHADO */}
        <motion.div 
          className={`${isClusterGroup ? 'w-14 h-14' : 'w-10 h-10'} rounded-full border-2 flex items-center justify-center relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${theme?.glowColor || 'rgba(6, 182, 212, 1)'}, rgba(168, 85, 247, 1))`,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: `0 0 20px ${theme?.glowColor}, inset 0 0 15px rgba(255, 255, 255, 0.3)`
          }}
          whileHover={{
            rotate: [0, 5, -5, 0],
            transition: { duration: 0.3 }
          }}
        >
          {/* Reflexo animado */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)`
            }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {isClusterGroup ? (
            <div className="text-white font-bold text-base z-10">
              {events.length}
            </div>
          ) : (
            <motion.div 
              className="w-3.5 h-3.5 rounded-full bg-white z-10"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [1, 0.6, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>

        {/* Halo de Glow INTENSO */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme?.glowColor || 'rgba(6, 182, 212, 0.4)'} 0%, transparent 70%)`
          }}
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
        
        {/* Partículas orbitantes */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: theme?.glowColor || 'rgba(6, 182, 212, 1)',
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, Math.cos((i * 120) * Math.PI / 180) * 20, 0],
              y: [0, Math.sin((i * 120) * Math.PI / 180) * 20, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
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
        glowColor: 'rgba(6, 182, 212, 0.7)', // Cyan mais suave
        overlayGradient: 'from-cyan-900/5 via-black to-purple-900/5'
      },
      'dançar': {
        glowColor: 'rgba(236, 72, 153, 0.7)',
        overlayGradient: 'from-pink-900/8 via-black to-purple-900/8'
      },
      'relaxar': {
        glowColor: 'rgba(59, 130, 246, 0.7)',
        overlayGradient: 'from-blue-900/8 via-black to-indigo-900/8'
      },
      'socializar': {
        glowColor: 'rgba(168, 85, 247, 0.7)',
        overlayGradient: 'from-purple-900/8 via-black to-pink-900/8'
      },
      'adrenalina': {
        glowColor: 'rgba(249, 115, 22, 0.7)',
        overlayGradient: 'from-orange-900/8 via-black to-red-900/8'
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
      {/* Background MINIMALISTA ESCURO */}
      <div className="absolute inset-0 z-0" style={{ background: '#0A0E1A' }}>
        {/* Gradiente base sutil */}
        <div className={`absolute inset-0 bg-gradient-to-br ${vibeTheme.overlayGradient} opacity-30`} />
      </div>

      {/* Mapa OpenStreetMap LOW CONTRAST */}
      <div className="absolute inset-0 z-1">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}`}
          className="absolute inset-0"
          style={{
            filter: 'grayscale(100%) brightness(0.25) contrast(0.8) saturate(0)',
            opacity: 0.4,
            pointerEvents: 'none'
          }}
          loading="lazy"
        />
      </div>

      {/* Overlay sutil */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none z-2" />
      
      {/* Markers Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Marcador do Usuário MINIMALISTA */}
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
            {/* Pulso Sonar Discreto */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '8px',
                height: '8px',
                background: `radial-gradient(circle, ${vibeTheme.glowColor} 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 20, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
                repeatDelay: 2
              }}
            />

            {/* Anel de Alcance Sutil */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '100px',
                height: '100px',
                border: `1px solid ${vibeTheme.glowColor}15`,
                boxShadow: `0 0 15px ${vibeTheme.glowColor}08`,
              }}
              animate={{
                scale: [1, 1.01, 1],
                opacity: [0.2, 0.35, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Marcador Central PEQUENO */}
            <motion.div 
              className="relative z-50" 
              style={{
                filter: `drop-shadow(0 0 10px ${vibeTheme.glowColor}70)`,
              }}
              animate={{
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div 
                className="w-9 h-9 rounded-full relative overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 30% 30%, 
                    rgba(59, 130, 246, 0.9) 0%,
                    ${vibeTheme.glowColor} 100%)`,
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: `0 0 15px ${vibeTheme.glowColor}70, inset 0 0 10px rgba(255, 255, 255, 0.2)`,
                }}
              >
                {/* Brilho Interno */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, 
                      rgba(255, 255, 255, 0.5) 0%, 
                      transparent 60%)`,
                  }}
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Ícone de Navegação */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Navigation 
                    className="w-4 h-4 text-white" 
                    strokeWidth={2.5}
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                    }}
                  />
                </div>
              </div>

              {/* Anel Orbital Único */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `1px solid ${vibeTheme.glowColor}30`,
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            </motion.div>
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

      {/* Header MINIMALISTA */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-black/30 backdrop-blur-2xl border-b"
        style={{
          borderColor: `${vibeTheme.glowColor}10`,
          boxShadow: `0 2px 20px rgba(0,0,0,0.2)`
        }}
      >
        <div className="p-3 sm:p-4">
          {/* Barra de Controles */}
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenVibe}
              className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-white text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg, ${vibeTheme.glowColor}15, transparent)`,
                borderColor: `${vibeTheme.glowColor}40`,
                boxShadow: `0 0 10px ${vibeTheme.glowColor}20`
              }}
            >
              <Music2 className="w-4 h-4" />
              <span>Vibes</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRadiusInfo(!showRadiusInfo)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-xl border text-white text-sm font-semibold"
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 0.4)',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
              }}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{RADIUS_KM}km</span>
            </motion.button>

            <Link to={createPageUrl("Feed")} className="ml-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/40 backdrop-blur-xl border-gray-700/30 text-white hover:bg-black/60 h-9 w-9 rounded-full"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
          </div>

          {/* Search MINIMALISTA */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10"
              style={{ color: vibeTheme.glowColor }}
            />
            <Input
              placeholder="Buscar eventos, gêneros, locais..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-3 text-white placeholder:text-gray-600 text-sm h-11 rounded-xl border transition-all duration-300"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(15px)',
                borderColor: searchTerm ? `${vibeTheme.glowColor}40` : 'rgba(75, 85, 99, 0.3)',
                boxShadow: searchTerm ? `0 0 15px ${vibeTheme.glowColor}20` : 'none'
              }}
            />
          </motion.div>

          {/* Info do Raio */}
          <AnimatePresence>
            {showRadiusInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black/95 backdrop-blur-xl border-2 rounded-xl p-4 text-xs text-white mt-3"
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
      </div>

      {/* FAB Upload SUTIL */}
      {canCreateReels && (
        <motion.div
          className="absolute bottom-20 right-4 z-30"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            onClick={onOpenUpload}
            size="icon"
            className="w-14 h-14 rounded-full border shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}, rgba(168, 85, 247, 0.9))`,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              boxShadow: `0 0 20px ${vibeTheme.glowColor}60`
            }}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {/* Ver Reels Button MINIMALISTA */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 pb-4 px-4 bg-black/30 backdrop-blur-2xl border-t"
        style={{
          borderColor: `${vibeTheme.glowColor}10`,
          boxShadow: `0 -2px 20px rgba(0,0,0,0.2)`
        }}
        drag="y"
        dragConstraints={{ top: -100, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(event, info) => {
          if (info.offset.y < -50) onSwipeUp();
        }}
      >
        <div className="flex flex-col items-center cursor-pointer" onClick={onSwipeUp}>
          <motion.div
            className="w-12 h-1.5 rounded-full mb-3"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.glowColor}, rgba(168, 85, 247, 0.8))`,
              boxShadow: `0 0 8px ${vibeTheme.glowColor}60`
            }}
            animate={{ scaleX: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <motion.button
            className="backdrop-blur-xl px-6 py-3 rounded-full shadow-xl border flex items-center gap-2 text-sm font-semibold"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.glowColor}, rgba(168, 85, 247, 0.8))`,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              boxShadow: `0 0 20px ${vibeTheme.glowColor}50`
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Eye className="w-5 h-5 text-white" />
            <span className="text-white font-bold">Ver Reels</span>
          </motion.button>

          <motion.p 
            className="text-xs mt-2"
            style={{ color: `${vibeTheme.glowColor}` }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⬆️ Arraste para cima
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