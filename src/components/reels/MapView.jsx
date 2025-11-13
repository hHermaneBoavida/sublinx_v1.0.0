
import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Menu, Search, MapPin, Navigation, Music2, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Clustering inteligente
const clusterEvents = (events, zoomLevel = 1) => {
  if (!events || events.length === 0) return [];
  
  const CLUSTER_RADIUS = 0.01 * (1 / zoomLevel);
  const clusters = [];
  const processed = new Set();

  events.forEach((event, index) => {
    if (processed.has(index)) return;

    const cluster = {
      events: [event],
      center: { lat: event.location.lat, lng: event.location.lng },
      isCluster: false
    };

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

// Cores por tipo de evento
const getEventColor = (event) => {
  const colorMap = {
    'rave': 'rgba(236, 72, 153, 0.9)',
    'warehouse': 'rgba(168, 85, 247, 0.9)',
    'rooftop': 'rgba(6, 182, 212, 0.9)',
    'underground': 'rgba(139, 92, 246, 0.9)',
    'club': 'rgba(20, 184, 166, 0.9)',
    'secret': 'rgba(251, 191, 36, 0.9)',
  };
  return colorMap[event.type] || 'rgba(6, 182, 212, 0.9)';
};

// Componente de Pin com aura luminosa
const EventPin = memo(({ cluster, position, onClick, theme }) => {
  const { events, isCluster: isClusterGroup } = cluster;
  const mainEvent = events[0];
  const eventColor = getEventColor(mainEvent);
  
  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto z-10"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
      }}
      whileHover={{ scale: 1.15, zIndex: 20 }}
      onClick={() => onClick(cluster)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute bottom-full mb-2 px-3 py-2 bg-black/95 backdrop-blur-xl rounded-xl text-white text-[11px] whitespace-nowrap border-2 shadow-2xl pointer-events-none z-50"
        style={{
          borderColor: eventColor,
          boxShadow: `0 0 25px ${eventColor}, 0 0 50px ${eventColor}70`
        }}
      >
        {isClusterGroup ? (
          <>
            <div className="font-bold mb-1" style={{ color: eventColor }}>
              ⚡ {events.length} eventos próximos
            </div>
            <div className="text-[9px] text-gray-400">
              Clique para expandir
            </div>
          </>
        ) : (
          <>
            <div className="font-bold mb-1 flex items-center gap-1" style={{ color: eventColor }}>
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

      {/* Zona de movimento - glow pulsante */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: isClusterGroup ? '80px' : '60px',
          height: isClusterGroup ? '80px' : '60px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${eventColor}30 0%, ${eventColor}10 40%, transparent 70%)`,
          filter: 'blur(12px)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.8, 0.4]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Segundo glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: isClusterGroup ? '100px' : '80px',
          height: isClusterGroup ? '100px' : '80px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle at center, ${eventColor}20 0%, transparent 60%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.6, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />

      {/* Pin Principal */}
      <motion.div 
        className="relative"
        animate={{
          boxShadow: [
            `0 0 20px ${eventColor}, 0 0 40px ${eventColor}70`,
            `0 0 35px ${eventColor}, 0 0 60px ${eventColor}90`,
            `0 0 20px ${eventColor}, 0 0 40px ${eventColor}70`
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          filter: `drop-shadow(0 0 ${isClusterGroup ? '15px' : '10px'} ${eventColor})`
        }}
      >
        <div 
          className={`${isClusterGroup ? 'w-14 h-14' : 'w-10 h-10'} rounded-full border-3 border-white/90 bg-gradient-to-br flex items-center justify-center relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${eventColor}, ${eventColor}CC)`,
            boxShadow: `0 0 20px ${eventColor}, inset 0 0 15px rgba(255,255,255,0.3)`
          }}
        >
          {/* Reflexo interno */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
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
              className="w-4 h-4 rounded-full bg-white z-10"
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
        </div>

        {/* Anel orbital */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 pointer-events-none"
          style={{
            borderColor: eventColor,
            width: isClusterGroup ? '70px' : '50px',
            height: isClusterGroup ? '70px' : '50px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0, 0.6],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
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
  const [expandedCluster, setExpandedCluster] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(15);

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

  // Temas por vibe
  const vibeTheme = useMemo(() => {
    const themes = {
      'all': {
        glowColor: 'rgba(6, 182, 212, 0.9)',
        secondaryGlow: 'rgba(139, 92, 246, 0.7)',
        overlayGradient: 'from-blue-900/15 via-black to-purple-900/15',
        accentColor: '#06B6D4'
      },
      'dançar': {
        glowColor: 'rgba(236, 72, 153, 0.9)',
        secondaryGlow: 'rgba(168, 85, 247, 0.7)',
        overlayGradient: 'from-pink-900/20 via-black to-purple-900/20',
        accentColor: '#EC4899'
      },
      'relaxar': {
        glowColor: 'rgba(59, 130, 246, 0.9)',
        secondaryGlow: 'rgba(99, 102, 241, 0.7)',
        overlayGradient: 'from-blue-900/20 via-black to-indigo-900/20',
        accentColor: '#3B82F6'
      },
      'socializar': {
        glowColor: 'rgba(168, 85, 247, 0.9)',
        secondaryGlow: 'rgba(236, 72, 153, 0.7)',
        overlayGradient: 'from-purple-900/20 via-black to-pink-900/20',
        accentColor: '#A855F7'
      },
      'adrenalina': {
        glowColor: 'rgba(249, 115, 22, 0.9)',
        secondaryGlow: 'rgba(239, 68, 68, 0.7)',
        overlayGradient: 'from-orange-900/20 via-black to-red-900/20',
        accentColor: '#F97316'
      }
    };
    return themes[activeVibe] || themes['all'];
  }, [activeVibe]);

  const validEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    return events.filter(e => e?.id && e?.title && e?.location?.lat && e?.location?.lng);
  }, [events]);

  const eventClusters = useMemo(() => {
    return clusterEvents(validEvents, zoomLevel / 15);
  }, [validEvents, zoomLevel]);

  const mapBounds = useMemo(() => {
    const latRange = 0.5 / Math.pow(2, zoomLevel - 10);
    const lngRange = 0.5 / Math.pow(2, zoomLevel - 10);
    
    return {
      minLat: userLocation.lat - latRange,
      maxLat: userLocation.lat + latRange,
      minLng: userLocation.lng - lngRange,
      maxLng: userLocation.lng + lngRange
    };
  }, [userLocation, zoomLevel]);

  const bbox = useMemo(() => {
    return `${mapBounds.minLng},${mapBounds.minLat},${mapBounds.maxLng},${mapBounds.maxLat}`;
  }, [mapBounds]);

  const coordToPosition = useCallback((lat, lng) => {
    if (mapBounds.maxLng === mapBounds.minLng || mapBounds.maxLat === mapBounds.minLat) {
      return { x: 50, y: 50 };
    }
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

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 10));
  };

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
      {/* Background Cyberpunk */}
      <div className="absolute inset-0 z-0" style={{ 
        background: 'linear-gradient(135deg, #0a1628 0%, #000000 50%, #0f0f23 100%)' 
      }}>
        {/* Gradiente atmosférico */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, 
              ${vibeTheme.glowColor}08 0%, 
              transparent 30%, 
              ${vibeTheme.secondaryGlow}08 70%, 
              transparent 100%)`,
            mixBlendMode: 'screen'
          }}
        />
        
        {/* Grid Cyberpunk */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${vibeTheme.glowColor} 0.5px, transparent 0.5px),
              linear-gradient(to bottom, ${vibeTheme.glowColor} 0.5px, transparent 0.5px)
            `,
            backgroundSize: '40px 40px',
            animation: 'grid-pulse 5s ease-in-out infinite'
          }}
        />

        {/* Linhas Diagonais */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                ${vibeTheme.glowColor} 0px,
                ${vibeTheme.glowColor} 1px,
                transparent 1px,
                transparent 50px
              ),
              repeating-linear-gradient(
                -45deg,
                ${vibeTheme.secondaryGlow} 0px,
                ${vibeTheme.secondaryGlow} 0.5px,
                transparent 0.5px,
                transparent 60px
              )
            `,
            animation: 'diagonal-slide 20s linear infinite'
          }}
        />

        {/* Hotspots - Zonas de alta atividade */}
        {eventClusters.filter(c => c.isCluster || c.events.length >= 2).map((cluster, idx) => {
          const pos = coordToPosition(cluster.center.lat, cluster.center.lng);
          const color = getEventColor(cluster.events[0]);
          
          return (
            <motion.div
              key={`hotspot-${idx}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: '150px',
                height: '150px',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${color}20 0%, ${color}10 40%, transparent 70%)`,
                filter: 'blur(30px)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: idx * 0.5
              }}
            />
          );
        })}

        {/* Spots de Luz */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{
            background: `radial-gradient(circle, ${vibeTheme.glowColor}, transparent 70%)`,
            animation: 'pulse-slow 7s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-12"
          style={{
            background: `radial-gradient(circle, ${vibeTheme.secondaryGlow}, transparent 70%)`,
            animation: 'pulse-slow 9s ease-in-out infinite 1.5s'
          }}
        />
      </div>

      {/* Mapa OpenStreetMap - SEM MARCADOR */}
      <div className="absolute inset-0 z-1">
        <iframe
          key={`map-${zoomLevel}-${bbox}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&zoom=${zoomLevel}`}
          className="absolute inset-0"
          style={{
            filter: 'grayscale(80%) invert(96%) brightness(0.85) contrast(1.3) hue-rotate(200deg) saturate(0.9)',
            opacity: 0.92,
            pointerEvents: 'none',
            mixBlendMode: 'luminosity'
          }}
          loading="lazy"
        />
      </div>

      {/* Overlay Gradiente */}
      <div 
        className="absolute inset-0 pointer-events-none z-2"
        style={{
          background: `linear-gradient(135deg, 
            ${vibeTheme.glowColor}12 0%, 
            transparent 25%, 
            ${vibeTheme.secondaryGlow}10 75%, 
            transparent 100%)`,
          mixBlendMode: 'screen'
        }}
      />

      {/* Scan Line */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-3"
        style={{
          background: `linear-gradient(to bottom, 
            transparent 0%, 
            ${vibeTheme.glowColor}08 48%, 
            ${vibeTheme.glowColor}12 50%, 
            ${vibeTheme.glowColor}08 52%, 
            transparent 100%)`,
          height: '100%',
        }}
        animate={{
          y: ['-100%', '200%']
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Vinheta */}
      <div 
        className="absolute inset-0 pointer-events-none z-3"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 60%, rgba(0,0,0,0.3) 100%)'
        }}
      />

      {/* Markers Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* ⭐ ÚNICO MARCADOR MINI - SUA LOCALIZAÇÃO ⭐ */}
        <motion.div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
          style={{ 
            left: `${userPosition.x}%`, 
            top: `${userPosition.y}%`,
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            duration: 0.6
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Layer 1: Glow Ambiente MINI (70px) */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '70px',
                height: '70px',
                background: `radial-gradient(circle at center, 
                  ${vibeTheme.glowColor}25 0%, 
                  ${vibeTheme.secondaryGlow}12 45%, 
                  transparent 70%)`,
                filter: 'blur(15px)',
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Layer 2: Rastro de Energia (50px) */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '50px',
                height: '50px',
                background: `radial-gradient(circle at center, 
                  ${vibeTheme.glowColor}22 0%, 
                  ${vibeTheme.secondaryGlow}10 50%, 
                  transparent 70%)`,
                filter: 'blur(8px)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.6
              }}
            />

            {/* Layer 3: Pulso Sonar MINI */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '4px',
                height: '4px',
                background: `radial-gradient(circle, ${vibeTheme.glowColor} 0%, transparent 70%)`,
                boxShadow: `0 0 20px ${vibeTheme.glowColor}, 0 0 40px ${vibeTheme.glowColor}80`
              }}
              animate={{
                scale: [1, 15, 1],
                opacity: [0.9, 0, 0.9]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeOut",
                repeatDelay: 3
              }}
            />

            {/* Layer 4: Marcador Central MINI (6x6px) - SEM ANEL */}
            <motion.div 
              className="relative z-50" 
              style={{
                filter: `drop-shadow(0 0 15px ${vibeTheme.glowColor}) drop-shadow(0 0 30px ${vibeTheme.glowColor}90) drop-shadow(0 0 45px ${vibeTheme.secondaryGlow}70)`,
              }}
              animate={{
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div 
                className="w-6 h-6 rounded-full relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(circle at 30% 30%, 
                      ${vibeTheme.glowColor} 0%,
                      ${vibeTheme.secondaryGlow} 50%,
                      ${vibeTheme.accentColor} 100%)
                  `,
                  border: `2.5px solid rgba(255, 255, 255, 1)`,
                  boxShadow: `
                    0 0 20px ${vibeTheme.glowColor},
                    0 0 40px ${vibeTheme.glowColor}80,
                    0 0 60px ${vibeTheme.secondaryGlow}60,
                    inset 0 0 18px rgba(255, 255, 255, 0.5)
                  `,
                }}
              >
                {/* Brilho Interno */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, 
                      rgba(255, 255, 255, 0.9) 0%, 
                      rgba(255, 255, 255, 0.4) 40%,
                      transparent 70%)`,
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Ícone de Navegação MINI */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Navigation 
                    className="w-3 h-3 text-white" 
                    strokeWidth={3.5}
                    style={{
                      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.9))'
                    }}
                  />
                </div>

                {/* Reflexo Superior */}
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.4), transparent)'
                  }}
                  animate={{
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              </div>
            </motion.div>

            {/* Partículas Flutuantes MINI - 3 partículas */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '2px',
                  height: '2px',
                  background: i % 2 === 0 ? vibeTheme.glowColor : vibeTheme.secondaryGlow,
                  filter: `blur(${0.8 + Math.random()}px)`,
                  left: `${25 + (i * 25)}%`,
                  top: `${20 + (i * 25)}%`,
                  boxShadow: `0 0 10px ${i % 2 === 0 ? vibeTheme.glowColor : vibeTheme.secondaryGlow}`
                }}
                animate={{
                  y: [0, -10, 0],
                  x: [0, Math.sin(i) * 6, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Event Clusters */}
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

      {/* Header Simplificado */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-30 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenVibe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border-2 transition-all text-white text-xs"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}15, ${vibeTheme.secondaryGlow}10)`,
              borderColor: `${vibeTheme.glowColor}50`,
              boxShadow: `0 0 20px ${vibeTheme.glowColor}50, inset 0 0 20px ${vibeTheme.glowColor}15`
            }}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Vibes</span>
          </motion.button>

          <Link to={createPageUrl("Feed")} className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="backdrop-blur-xl border-2 text-white hover:bg-white/10 h-8 w-8"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderColor: 'rgba(107, 114, 128, 0.4)'
              }}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: vibeTheme.accentColor }} />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 backdrop-blur-xl border-2 text-white placeholder:text-gray-500 text-sm h-9 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              borderColor: `${vibeTheme.glowColor}30`,
              boxShadow: `0 0 15px ${vibeTheme.glowColor}20`
            }}
          />
        </div>
      </div>

      {/* Controles de Zoom */}
      <div className="absolute right-3 bottom-32 z-30 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleZoomIn}
          disabled={zoomLevel >= 18}
          className="w-11 h-11 rounded-full backdrop-blur-xl border-2 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${vibeTheme.glowColor}20, ${vibeTheme.secondaryGlow}15)`,
            borderColor: `${vibeTheme.glowColor}60`,
            boxShadow: `0 0 20px ${vibeTheme.glowColor}50`
          }}
        >
          <ZoomIn className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleZoomOut}
          disabled={zoomLevel <= 10}
          className="w-11 h-11 rounded-full backdrop-blur-xl border-2 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${vibeTheme.glowColor}20, ${vibeTheme.secondaryGlow}15)`,
            borderColor: `${vibeTheme.glowColor}60`,
            boxShadow: `0 0 20px ${vibeTheme.glowColor}50`
          }}
        >
          <ZoomOut className="w-5 h-5" />
        </motion.button>
        
        {/* Indicador de Zoom */}
        <div 
          className="w-11 h-11 rounded-full backdrop-blur-xl border-2 flex items-center justify-center text-xs font-bold"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            borderColor: 'rgba(107, 114, 128, 0.6)',
            color: vibeTheme.accentColor,
            textShadow: `0 0 10px ${vibeTheme.glowColor}`
          }}
        >
          {zoomLevel}
        </div>
      </div>

      {/* FAB Upload */}
      {canCreateReels && (
        <motion.div
          className="absolute bottom-20 right-3 z-30"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
        >
          <Button
            onClick={onOpenUpload}
            size="icon"
            className="w-14 h-14 rounded-full border-3 border-white/30 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              boxShadow: `0 0 30px ${vibeTheme.glowColor}, 0 0 60px ${vibeTheme.glowColor}70`
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 70%)',
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
            <Plus className="w-6 h-6 relative z-10" />
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
          {/* Indicador de Arraste */}
          <motion.div
            className="w-12 h-1.5 rounded-full mb-2"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              boxShadow: `0 0 15px ${vibeTheme.glowColor}, 0 0 30px ${vibeTheme.glowColor}70`
            }}
            animate={{ 
              scaleX: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Botão Líquido */}
          <motion.button
            className="backdrop-blur-xl px-6 py-3 rounded-full shadow-xl border-2 flex items-center gap-2 text-sm font-semibold relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              boxShadow: `0 0 30px ${vibeTheme.glowColor}80, 0 0 60px ${vibeTheme.secondaryGlow}60`
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: `0 0 40px ${vibeTheme.glowColor}, 0 0 80px ${vibeTheme.secondaryGlow}80`
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Distorção Líquida */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 50%, 
                  rgba(255, 255, 255, 0.3) 0%, 
                  transparent 50%)`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Reflexo Superior */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.25), transparent)',
              }}
              animate={{
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />

            <Eye className="w-5 h-5 text-white relative z-10" />
            <span className="text-white relative z-10">Ver Reels</span>
          </motion.button>

          <motion.p 
            className="text-white/50 text-xs mt-1.5"
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            Arraste para cima
          </motion.p>
        </div>
      </motion.div>

      {/* Modal de Cluster */}
      <AnimatePresence>
        {expandedCluster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.92)'
            }}
            onClick={() => setExpandedCluster(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="rounded-2xl border-2 p-4 max-w-md w-full max-h-[70vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95))',
                borderColor: vibeTheme.glowColor,
                boxShadow: `0 0 50px ${vibeTheme.glowColor}60`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: vibeTheme.accentColor }} />
                {expandedCluster.events.length} Eventos Próximos
              </h3>
              
              <div className="space-y-2">
                {expandedCluster.events.map(event => {
                  const eventColor = getEventColor(event);
                  
                  return (
                    <motion.div
                      key={event.id}
                      className="p-3 rounded-lg border cursor-pointer transition-all"
                      style={{
                        background: 'rgba(31, 41, 55, 0.5)',
                        borderColor: `${eventColor}30`
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        borderColor: eventColor,
                        boxShadow: `0 0 20px ${eventColor}50`
                      }}
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
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes grid-pulse {
          0%, 100% {
            opacity: 0.12;
          }
          50% {
            opacity: 0.22;
          }
        }

        @keyframes diagonal-slide {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 100px 100px;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.15;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.25;
          }
        }
      `}</style>
    </motion.div>
  );
}
