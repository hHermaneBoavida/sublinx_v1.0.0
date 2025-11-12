
import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Menu, Search, MapPin, Music2, ZoomIn, ZoomOut, Map as MapIcon, Radar } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import VenuePin from '../map/VenuePin';
import VenueDetailsModal from '../map/VenueDetailsModal';
import { validateCoordinates } from '@/utils/geo';
import { logger } from '@/utils/logger';

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

const getEventColor = (event) => {
  const colorMap = {
    'rave': 'rgba(236, 72, 153, 0.95)',      // Pink neon vibrante
    'warehouse': 'rgba(168, 85, 247, 0.95)', // Purple neon
    'rooftop': 'rgba(6, 182, 212, 0.95)',    // Cyan neon
    'underground': 'rgba(139, 92, 246, 0.95)',// Violet neon
    'club': 'rgba(20, 184, 166, 0.95)',      // Teal neon
    'secret': 'rgba(251, 191, 36, 0.95)',    // Amber neon
  };
  return colorMap[event.type] || 'rgba(6, 182, 212, 0.95)';
};

// ✅ STABLE KEY: Evitar re-renders desnecessários
const getClusterKey = (cluster, index) => {
  if (cluster.isCluster) {
    const sortedIds = cluster.events
      .map(e => e.id)
      .sort()
      .join('-');
    return `cluster-multi-${sortedIds}`;
  }
  return `cluster-single-${cluster.events[0].id}-${index}`;
};

// Componente de Pin MELHORADO com VIBRAÇÃO e AURA LUMINOSA
const EventPin = memo(({ cluster, position, onClick, theme }) => {
  const { events, isCluster: isClusterGroup } = cluster;
  const mainEvent = events[0];
  const eventColor = getEventColor(mainEvent);
  
  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        zIndex: 15,
      }}
      whileHover={{ scale: 1.2, zIndex: 25 }}
      onClick={() => onClick(cluster)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        // Vibração suave
        y: [0, -3, 0],
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ 
        duration: 0.4, 
        type: "spring", 
        stiffness: 300,
        y: {
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
    >
      {/* Tooltip ao Hover */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute bottom-full mb-3 px-4 py-2.5 bg-black/95 backdrop-blur-xl rounded-2xl text-white text-xs whitespace-nowrap border-2 shadow-2xl pointer-events-none z-50"
        style={{
          borderColor: eventColor,
          boxShadow: `0 0 30px ${eventColor}, 0 0 60px ${eventColor}70`
        }}
      >
        {isClusterGroup ? (
          <>
            <div className="font-bold mb-1.5 flex items-center gap-2" style={{ color: eventColor }}>
              <Music2 className="w-4 h-4" />
              ⚡ {events.length} eventos próximos
            </div>
            <div className="text-[10px] text-gray-400">
              Clique para expandir
            </div>
          </>
        ) : (
          <>
            <div className="font-bold mb-1.5 flex items-center gap-2" style={{ color: eventColor }}>
              <Music2 className="w-4 h-4" />
              {mainEvent.title}
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-gray-300 truncate max-w-[150px]">
                {mainEvent.location.venue_name || mainEvent.location.city}
              </span>
            </div>
          </>
        )}
      </motion.div>

      {/* AURA LUMINOSA Externa - Layer 1 (mais distante) */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: isClusterGroup ? '120px' : '100px',
          height: isClusterGroup ? '120px' : '100px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${eventColor}25 0%, ${eventColor}15 40%, transparent 70%)`,
          filter: 'blur(25px)',
        }}
        animate={{
          scale: [1, 1.6, 1],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* AURA LUMINOSA Média - Layer 2 */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: isClusterGroup ? '90px' : '70px',
          height: isClusterGroup ? '90px' : '70px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${eventColor}35 0%, ${eventColor}20 40%, transparent 70%)`,
          filter: 'blur(15px)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.9, 0.4]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3
        }}
      />

      {/* AURA LUMINOSA Interna - Layer 3 (mais próxima) */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: isClusterGroup ? '60px' : '50px',
          height: isClusterGroup ? '60px' : '50px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${eventColor}45 0%, ${eventColor}25 50%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6
        }}
      />

      {/* Pin Principal com VIBRAÇÃO */}
      <motion.div 
        className="relative"
        animate={{
          boxShadow: [
            `0 0 25px ${eventColor}, 0 0 50px ${eventColor}80`,
            `0 0 40px ${eventColor}, 0 0 80px ${eventColor}95`,
            `0 0 25px ${eventColor}, 0 0 50px ${eventColor}80`
          ],
          // Vibração sutil
          rotate: [0, 2, -2, 0],
        }}
        transition={{ 
          boxShadow: {
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut"
          },
          rotate: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        style={{
          filter: `drop-shadow(0 0 ${isClusterGroup ? '20px' : '15px'} ${eventColor})`
        }}
      >
        <div 
          className={`${isClusterGroup ? 'w-16 h-16' : 'w-12 h-12'} rounded-full border-3 bg-gradient-to-br flex items-center justify-center relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${eventColor}, ${eventColor}DD)`,
            borderColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: `0 0 25px ${eventColor}, inset 0 0 20px rgba(255,255,255,0.4)`
          }}
        >
          {/* Reflexo interno animado INTENSO */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 0%, transparent 60%)',
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Conteúdo do Pin */}
          {isClusterGroup ? (
            <div className="text-white font-bold text-lg z-10 relative">
              {events.length}
            </div>
          ) : (
            <motion.div 
              className="w-5 h-5 rounded-full bg-white z-10 relative"
              animate={{
                scale: [1, 1.5, 1],
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

        {/* Anel orbital pulsante */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 pointer-events-none"
          style={{
            borderColor: eventColor,
            width: isClusterGroup ? '80px' : '60px',
            height: isClusterGroup ? '80px' : '60px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.7, 0, 0.7],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Anel orbital secundário */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 pointer-events-none"
          style={{
            borderColor: eventColor,
            width: isClusterGroup ? '90px' : '70px',
            height: isClusterGroup ? '90px' : '70px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>
    </motion.div>
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
  const [showVenues, setShowVenues] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [radarActive, setRadarActive] = useState(false);

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

  const { data: venues = [] } = useQuery({
    queryKey: ['venues', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) return [];
      
      try {
        const allVenues = await base44.entities.Venue.list('-rating', 100);
        
        return (allVenues || []).filter(venue => {
          if (!venue?.location?.lat || !venue?.location?.lng) return false;
          
          const R = 6371;
          const dLat = (venue.location.lat - userLocation.lat) * Math.PI / 180;
          const dLng = (venue.location.lng - userLocation.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(venue.location.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          
          return distance <= 10;
        });
      } catch (error) {
        console.error('Erro ao buscar venues:', error);
        return [];
      }
    },
    enabled: !!userLocation,
    staleTime: 30 * 60 * 1000,
    initialData: []
  });

  const canCreateReels = user && (user.is_pro_member || user.is_organizer);

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

  const RADIUS_KM = 10;

  const validEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    // ✅ USAR UTILITÁRIO de validação
    return events.filter(e => {
      if (!e?.id || !e?.title) return false;
      
      // Validar coordenadas com utilitário
      if (!validateCoordinates(e.location?.lat, e.location?.lng)) {
        logger.warn('⚠️ Evento com coordenadas inválidas:', e.id, e.title, e.location);
        return false;
      }
      
      // Verificar proximidade (já filtrado antes, mas double-check)
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

  const eventClusters = useMemo(() => {
    return clusterEvents(validEvents, zoomLevel / 15);
  }, [validEvents, zoomLevel]);

  // ✅ LOG APENAS EM DEV
  useEffect(() => {
    logger.group('📊 [MAPA] Debug Info', () => {
      logger.table({
        totalEvents: events?.length || 0,
        validEvents: validEvents.length,
        eventClusters: eventClusters.length,
        userLocation,
        zoomLevel
      });
    });
  }, [events, validEvents, eventClusters, userLocation, zoomLevel]);

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

  const handleVenueClick = useCallback((venue) => {
    setSelectedVenue(venue);
  }, []);

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
      {/* Background Cyberpunk Underground - Azul Petróleo → Preto Carbono */}
      <div className="absolute inset-0 z-0" style={{ 
        background: 'linear-gradient(135deg, #0a1628 0%, #000000 50%, #0f0f23 100%)' 
      }}>
        {/* Gradiente atmosférico translúcido (azul → violeta) */}
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
        
        {/* Grid Cyberpunk - Linhas azul aço */}
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

        {/* Linhas Diagonais Pulsantes */}
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

        {/* Zonas de Alta Atividade - Glows pulsantes (roxo, lilás, ciano, magenta) */}
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

        {/* Spots de Luz Underground - Roxo neon e Ciano */}
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

      {/* Mapa OpenStreetMap - SEM MARKER */}
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

      {/* Overlay Gradiente Atmosférico (azul → violeta) */}
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

      {/* Efeito de Scan Line Neon */}
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

      {/* MODO VIBE RADAR - Radar Neon Girando */}
      <AnimatePresence>
        {radarActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-4 flex items-center justify-center"
          >
            {/* Radar Sweep - Cone girando */}
            <motion.div
              className="absolute"
              style={{
                width: '100%',
                height: '100%',
                background: `conic-gradient(from 0deg, 
                  transparent 0deg, 
                  ${vibeTheme.glowColor}40 45deg, 
                  ${vibeTheme.glowColor}20 90deg, 
                  transparent 135deg)`,
                transformOrigin: 'center center',
              }}
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Radar Rings - Anéis concêntricos */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 pointer-events-none"
                style={{
                  width: `${(i + 1) * 25}%`,
                  height: `${(i + 1) * 25}%`,
                  borderColor: `${vibeTheme.glowColor}30`,
                  boxShadow: `0 0 20px ${vibeTheme.glowColor}40, inset 0 0 20px ${vibeTheme.glowColor}20`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2
                }}
              />
            ))}

            {/* Radar Center Pulse */}
            <motion.div
              className="absolute w-4 h-4 rounded-full"
              style={{
                background: vibeTheme.glowColor,
                boxShadow: `0 0 30px ${vibeTheme.glowColor}, 0 0 60px ${vibeTheme.glowColor}80`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vinheta Sutil */}
      <div 
        className="absolute inset-0 pointer-events-none z-3"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 60%, rgba(0,0,0,0.3) 100%)'
        }}
      />

      {/* Markers Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* PONTO DE LOCALIZAÇÃO REDUZIDO (24px) com FLUTUAÇÃO */}
        <motion.div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-50"
          style={{ 
            left: `${userPosition.x}%`, 
            top: `${userPosition.y}%`,
          }}
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            y: [0, -8, 0], // Flutuação suave
          }}
          transition={{ 
            scale: {
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              duration: 0.4
            },
            y: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          {/* PIN REDUZIDO - 24px (era 32px) com FLUTUAÇÃO */}
          <motion.div 
            className="w-6 h-6 rounded-full border-2 flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              borderColor: 'rgba(229, 231, 235, 0.95)',
              boxShadow: `
                0 0 20px ${vibeTheme.glowColor}, 
                0 0 40px ${vibeTheme.glowColor}70,
                0 0 60px ${vibeTheme.secondaryGlow}50
              `,
            }}
            animate={{
              boxShadow: [
                `0 0 20px ${vibeTheme.glowColor}, 0 0 40px ${vibeTheme.glowColor}70, 0 0 60px ${vibeTheme.secondaryGlow}50`,
                `0 0 25px ${vibeTheme.glowColor}, 0 0 50px ${vibeTheme.glowColor}80, 0 0 75px ${vibeTheme.secondaryGlow}60`,
                `0 0 20px ${vibeTheme.glowColor}, 0 0 40px ${vibeTheme.glowColor}70, 0 0 60px ${vibeTheme.secondaryGlow}50`
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Brilho interno suave */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />

            {/* Círculo central branco menor */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-3 h-3 rounded-full bg-white"
                style={{
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)'
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Venue Pins */}
        {showVenues && (
          <AnimatePresence>
            {venues.map((venue) => {
              const position = coordToPosition(venue.location.lat, venue.location.lng);
              return (
                <VenuePin
                  key={`venue-${venue.id}`}
                  venue={venue}
                  position={position}
                  onClick={handleVenueClick}
                  theme={vibeTheme}
                />
              );
            })}
          </AnimatePresence>
        )}

        {/* Event Clusters - ✅ STABLE KEYS */}
        <AnimatePresence>
          {eventClusters.map((cluster, index) => {
            const position = coordToPosition(cluster.center.lat, cluster.center.lng);
            
            // ✅ LOG apenas em dev
            logger.debug(`📍 Renderizando evento ${index}:`, {
              position,
              cluster: cluster.events.length,
              title: cluster.events[0]?.title
            });
            
            return (
              <EventPin
                key={getClusterKey(cluster, index)}
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

          {/* Botão Vibe Radar */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setRadarActive(!radarActive)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-xl border-2 text-xs transition-all ${
              radarActive 
                ? 'text-white' 
                : 'text-gray-400'
            }`}
            style={{
              background: radarActive 
                ? `linear-gradient(135deg, ${vibeTheme.glowColor}25, ${vibeTheme.secondaryGlow}20)` 
                : 'rgba(0, 0, 0, 0.6)',
              borderColor: radarActive ? `${vibeTheme.glowColor}60` : 'rgba(107, 114, 128, 0.5)',
              boxShadow: radarActive ? `0 0 25px ${vibeTheme.glowColor}60` : 'none'
            }}
          >
            <Radar className={`w-3 h-3 ${radarActive ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>Radar</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowVenues(!showVenues)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-xl border-2 text-xs ${
              showVenues 
                ? 'text-white' 
                : 'text-gray-400'
            }`}
            style={{
              background: showVenues 
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.2))' 
                : 'rgba(0, 0, 0, 0.6)',
              borderColor: showVenues ? 'rgba(251, 191, 36, 0.6)' : 'rgba(107, 114, 128, 0.5)',
              boxShadow: showVenues ? '0 0 20px rgba(251, 191, 36, 0.5)' : 'none'
            }}
          >
            <MapIcon className="w-3 h-3" />
            <span>Locais ({venues.length})</span>
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
            placeholder="Buscar eventos ou locais..."
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

      {/* Controles de Zoom - SEM INDICADOR "15" */}
      <div className="absolute right-3 bottom-32 z-30 flex flex-col gap-2">
        <motion.button
          whileHover={{ 
            scale: 1.08,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
          whileTap={{ 
            scale: 0.92,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
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
          whileHover={{ 
            scale: 1.08,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
          whileTap={{ 
            scale: 0.92,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
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

      {/* Ver Reels Button - Distorção Líquida Neon */}
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
          {/* Indicador de Arraste Neon */}
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
          
          {/* Botão Ver Reels - Efeito Água Neon */}
          <motion.button
            className="backdrop-blur-xl px-6 py-3 rounded-full shadow-xl border-2 flex items-center gap-2 text-sm font-semibold relative overflow-hidden group"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              boxShadow: `0 0 30px ${vibeTheme.glowColor}80, 0 0 60px ${vibeTheme.secondaryGlow}60`
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: `0 0 40px ${vibeTheme.glowColor}, 0 0 80px ${vibeTheme.secondaryGlow}80`,
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ 
              scale: 0.95,
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
          >
            {/* Efeito de Distorção Líquida */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 50%, 
                  rgba(255, 255, 255, 0.4) 0%, 
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

            {/* Reflexo Superior Animado */}
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

      {/* Modal de Cluster Expandido */}
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

      {/* Modal de Detalhes do Venue */}
      {selectedVenue && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
        />
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.22; }
        }

        @keyframes diagonal-slide {
          0% { background-position: 0 0; }
          100% { background-position: 100px 100px; }
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
