
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

// Componente de Pin OTIMIZADO COM EFEITO 3D
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
      whileHover={{ scale: 1.15, zIndex: 20, y: -5 }}
      onClick={() => onClick(cluster)}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0, y: 20 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 350, damping: 20 }}
    >
      {/* Tooltip ao Hover - MELHORADO */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        className="absolute bottom-full mb-3 px-4 py-3 bg-white/95 backdrop-blur-xl rounded-2xl text-gray-900 text-xs whitespace-nowrap border-2 shadow-2xl pointer-events-none"
        style={{
          borderColor: theme?.glowColor || 'rgba(6, 182, 212, 0.8)',
          boxShadow: `0 8px 32px ${theme?.glowColor || 'rgba(6, 182, 212, 0.6)'}, 0 0 0 1px rgba(255,255,255,0.1)`
        }}
      >
        {isClusterGroup ? (
          <>
            <div className="font-bold text-transparent bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text mb-1 text-sm">
              {events.length} eventos próximos
            </div>
            <div className="text-[10px] text-gray-600">
              Clique para ver todos
            </div>
          </>
        ) : (
          <>
            <div className="font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-purple-600" />
              {mainEvent.title}
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <MapPin className="w-3 h-3 text-cyan-600" />
              <span className="text-gray-700 truncate max-w-[140px]">
                {mainEvent.location.venue_name}
              </span>
            </div>
          </>
        )}
        
        {/* Seta do tooltip */}
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 -mt-px"
          style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${theme?.glowColor || 'rgba(6, 182, 212, 0.8)'}`
          }}
        />
      </motion.div>

      {/* Pin Visual REDESENHADO COM EFEITO 3D */}
      <motion.div 
        className="relative"
        style={{
          filter: `drop-shadow(0 4px 12px ${theme?.glowColor || 'rgba(6, 182, 212, 0.5)'}) drop-shadow(0 8px 24px ${theme?.glowColor || 'rgba(6, 182, 212, 0.3)'})`
        }}
      >
        {/* Sombra 3D no chão */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1"
          style={{
            width: isClusterGroup ? '48px' : '36px',
            height: isClusterGroup ? '12px' : '8px',
            background: `radial-gradient(ellipse, ${theme?.glowColor || 'rgba(6, 182, 212, 0.4)'} 0%, transparent 70%)`,
            filter: 'blur(4px)',
            opacity: 0.6
          }}
        />

        {/* Pin Principal com gradiente 3D */}
        <motion.div 
          className={`${isClusterGroup ? 'w-14 h-14' : 'w-10 h-10'} rounded-full border-4 border-white bg-gradient-to-br flex items-center justify-center relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, 
              ${theme?.glowColor || 'rgba(6, 182, 212, 1)'} 0%, 
              ${theme?.glowColor || 'rgba(168, 85, 247, 1)'} 100%)`,
            boxShadow: `
              0 4px 16px ${theme?.glowColor || 'rgba(6, 182, 212, 0.5)'},
              0 8px 32px ${theme?.glowColor || 'rgba(6, 182, 212, 0.3)'},
              inset 0 -2px 8px rgba(0,0,0,0.3),
              inset 0 2px 8px rgba(255,255,255,0.3)
            `
          }}
          animate={{
            boxShadow: [
              `0 4px 16px ${theme?.glowColor || 'rgba(6, 182, 212, 0.5)'}, 0 8px 32px ${theme?.glowColor || 'rgba(6, 182, 212, 0.3)'}, inset 0 -2px 8px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.3)`,
              `0 4px 20px ${theme?.glowColor || 'rgba(6, 182, 212, 0.7)'}, 0 8px 40px ${theme?.glowColor || 'rgba(6, 182, 212, 0.5)'}, inset 0 -2px 8px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.4)`,
              `0 4px 16px ${theme?.glowColor || 'rgba(6, 182, 212, 0.5)'}, 0 8px 32px ${theme?.glowColor || 'rgba(6, 182, 212, 0.3)'}, inset 0 -2px 8px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.3)`
            ]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Reflexo superior 3D */}
          <div
            className="absolute top-0 left-0 right-0 h-1/3 rounded-t-full"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, transparent 100%)'
            }}
          />

          {/* Conteúdo do pin */}
          {isClusterGroup ? (
            <div className="text-white font-bold text-base drop-shadow-lg relative z-10">
              {events.length}
            </div>
          ) : (
            <motion.div 
              className="w-4 h-4 rounded-full bg-white relative z-10"
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}

          {/* Brilho animado interno */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Halo de Glow Externo */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${theme?.glowColor || 'rgba(6, 182, 212, 0.4)'} 0%, transparent 70%)`
          }}
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />

        {/* Anel orbital brilhante */}
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: `${theme?.glowColor || 'rgba(6, 182, 212, 0.6)'}`,
            boxShadow: `0 0 12px ${theme?.glowColor || 'rgba(6, 182, 212, 0.6)'}`
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.8, 0, 0.8]
          }}
          transition={{
            duration: 2.2,
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
      maxLng: Math.max(...lngs, userLocation.lng) + 0.01, // ✅ CORRIGIDO: era userLocation.lat
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
      {/* Background Escuro - DARK MOON MODE */}
      <div className="absolute inset-0 z-0 bg-black">
        <div className={`absolute inset-0 bg-gradient-to-br ${vibeTheme.overlayGradient} opacity-15`} />
      </div>

      {/* Mapa OpenStreetMap - MODO DARK MOON */}
      <div className="absolute inset-0 z-1">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}`}
          className="absolute inset-0"
          style={{
            filter: 'grayscale(80%) brightness(0.35) contrast(1.4) saturate(0.2) invert(92%) hue-rotate(180deg)',
            opacity: 0.65,
            pointerEvents: 'none'
          }}
          loading="lazy"
        />
      </div>

      {/* Overlay Escuro Forte */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/50 pointer-events-none z-2" />

      {/* Markers Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Marcador do Usuário ESTILO APPLE - MENOR */}
        <motion.div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-40"
          style={{ 
            left: `${userPosition.x}%`, 
            top: `${userPosition.y}%`,
          }}
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            duration: 0.4
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Camada 1: Glow Ambiente REDUZIDO */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '140px',
                height: '140px',
                background: `radial-gradient(circle at center, 
                  ${vibeTheme.glowColor}28 0%, 
                  ${vibeTheme.glowColor}15 40%, 
                  transparent 70%)`,
                filter: 'blur(16px)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Camada 2: Pulso Discreto */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '100px',
                height: '100px',
                background: `radial-gradient(circle at center, 
                  ${vibeTheme.glowColor}20 0%, 
                  transparent 65%)`,
                filter: 'blur(10px)',
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />

            {/* Sombra 3D Sutil */}
            <div
              className="absolute top-full mt-1 left-1/2 -translate-x-1/2"
              style={{
                width: '32px',
                height: '8px',
                background: `radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)`,
                filter: 'blur(4px)'
              }}
            />

            {/* Marcador Central REDUZIDO - Estilo Apple */}
            <motion.div 
              className="relative z-50" 
              style={{
                filter: `drop-shadow(0 4px 12px ${vibeTheme.glowColor}50) drop-shadow(0 2px 6px rgba(0,0,0,0.3))`,
              }}
              animate={{
                scale: [1, 1.05, 1],
                y: [0, -1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ scale: 1.1, y: -2 }}
            >
              {/* Anel Externo Branco */}
              <div 
                className="w-10 h-10 rounded-full relative overflow-hidden border-[3px] border-white"
                style={{
                  background: `
                    radial-gradient(circle at 40% 35%, 
                      rgba(59, 130, 246, 1) 0%,
                      ${vibeTheme.glowColor} 100%)
                  `,
                  boxShadow: `
                    0 2px 12px ${vibeTheme.glowColor}60,
                    0 4px 20px ${vibeTheme.glowColor}30,
                    inset 0 -2px 6px rgba(0,0,0,0.3),
                    inset 0 2px 6px rgba(255, 255, 255, 0.4)
                  `,
                }}
              >
                {/* Brilho Interno */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 40% 35%, 
                      rgba(255, 255, 255, 0.7) 0%, 
                      rgba(255, 255, 255, 0.2) 50%,
                      transparent 70%)`,
                  }}
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Reflexo Superior */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 0%, transparent 100%)'
                  }}
                />

                {/* Ícone de Navegação MENOR */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Navigation 
                    className="w-5 h-5 text-white" 
                    strokeWidth={2.5}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'
                    }}
                  />
                </div>
              </div>

              {/* Anel de Precisão Externo */}
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: `${vibeTheme.glowColor}50`,
                  boxShadow: `0 0 10px ${vibeTheme.glowColor}40`,
                  transform: 'scale(1.25)'
                }}
                animate={{
                  scale: [1.25, 1.5, 1.25],
                  opacity: [0.6, 0, 0.6]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            </motion.div>

            {/* Partículas Sutis */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '3px',
                  height: '3px',
                  background: vibeTheme.glowColor,
                  boxShadow: `0 0 6px ${vibeTheme.glowColor}`,
                  filter: `blur(${Math.random() * 0.5}px)`,
                  left: `${25 + (i * 50 / 2)}%`,
                  top: `${15 + (i * 70 / 2)}%`,
                }}
                animate={{
                  y: [0, -12, 0],
                  x: [0, Math.sin(i) * 8, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{
                  duration: 3 + Math.random() * 1.5,
                  repeat: Infinity,
                  delay: Math.random() * 2,
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

      {/* Header COM MAIS CONTRASTE */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-30 flex flex-col gap-2">
        {/* Barra de Controles */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenVibe}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/98 backdrop-blur-xl border shadow-lg transition-all text-gray-900 text-xs font-semibold"
            style={{
              borderColor: vibeTheme.glowColor,
              boxShadow: `0 4px 16px ${vibeTheme.glowColor}30, 0 2px 6px rgba(0,0,0,0.1)`
            }}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Vibes</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRadiusInfo(!showRadiusInfo)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-full bg-blue-500/95 backdrop-blur-xl border-2 border-white/30 text-white text-xs font-semibold shadow-lg"
            style={{
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4), 0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <MapPin className="w-3 h-3" />
            <span>{RADIUS_KM}km</span>
          </motion.button>

          <Link to={createPageUrl("Feed")} className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/95 backdrop-blur-xl border border-gray-300 text-gray-900 hover:bg-white hover:shadow-lg h-9 w-9 shadow-md"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600 z-10" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-3 py-2.5 bg-white/98 backdrop-blur-xl border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 text-sm h-10 rounded-xl shadow-lg font-medium"
          />
        </div>

        {/* Info do Raio */}
        <AnimatePresence>
          {showRadiusInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-white/98 backdrop-blur-xl border rounded-2xl p-4 text-xs text-gray-900 shadow-2xl"
              style={{
                borderColor: `${vibeTheme.glowColor}`,
                boxShadow: `0 8px 32px ${vibeTheme.glowColor}20, 0 4px 12px rgba(0,0,0,0.1)`
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-cyan-600" />
                <span className="font-bold text-cyan-700">Área de Eventos</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-700 font-medium">
                  📍 {validEvents.length} evento(s) próximo(s)
                </p>
                <p className="text-gray-700 font-medium">
                  🎯 Raio: {RADIUS_KM}km da sua localização
                </p>
                {eventClusters.length > 0 && (
                  <p className="text-gray-700 font-medium">
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
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.93 }}
        >
          <Button
            onClick={onOpenUpload}
            size="icon"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 shadow-2xl border-3 border-white hover:shadow-cyan-500/50"
            style={{
              boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4), 0 4px 12px rgba(168, 85, 247, 0.3), inset 0 -2px 6px rgba(0,0,0,0.2), inset 0 2px 6px rgba(255,255,255,0.3)'
            }}
          >
            <Plus className="w-6 h-6" />
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
            className="w-12 h-1.5 rounded-full mb-2.5"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.glowColor}, rgba(168, 85, 247, 1))`,
              boxShadow: `0 2px 10px ${vibeTheme.glowColor}50`
            }}
            animate={{ 
              scaleX: [1, 1.3, 1],
              boxShadow: [
                `0 2px 10px ${vibeTheme.glowColor}50`,
                `0 2px 16px ${vibeTheme.glowColor}70`,
                `0 2px 10px ${vibeTheme.glowColor}50`
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <motion.button
            className="backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border-2 border-white/60 flex items-center gap-2 text-sm font-bold"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.glowColor}, rgba(168, 85, 247, 1))`,
              boxShadow: `0 8px 24px ${vibeTheme.glowColor}50, inset 0 -2px 6px rgba(0,0,0,0.2), inset 0 2px 6px rgba(255,255,255,0.3)`
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="w-5 h-5 text-white" />
            <span className="text-white">Ver Reels</span>
          </motion.button>

          <motion.p 
            className="text-white/80 text-xs mt-2 font-semibold"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              textShadow: `0 2px 6px ${vibeTheme.glowColor}50`
            }}
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
