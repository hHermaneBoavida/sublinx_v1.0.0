import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Menu, Search, MapPin, Music2, ZoomIn, ZoomOut, Map as MapIcon, Radar, Filter, Target, Layers } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import VenuePin from '../map/VenuePin';
import VenueDetailsModal from '../map/VenueDetailsModal';

const validateCoordinates = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
};

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
    'rave': { base: '#EC4899', glow: 'rgba(236, 72, 153, 1)' },
    'warehouse': { base: '#A855F7', glow: 'rgba(168, 85, 247, 1)' },
    'rooftop': { base: '#06B6D4', glow: 'rgba(6, 182, 212, 1)' },
    'underground': { base: '#8B5CF6', glow: 'rgba(139, 92, 246, 1)' },
    'club': { base: '#14B8A6', glow: 'rgba(20, 184, 166, 1)' },
    'secret': { base: '#FBBF24', glow: 'rgba(251, 191, 36, 1)' },
  };
  return colorMap[event.type] || { base: '#06B6D4', glow: 'rgba(6, 182, 212, 1)' };
};

const getClusterKey = (cluster, index) => {
  if (cluster.isCluster) {
    const sortedIds = cluster.events.map(e => e.id).sort().join('-');
    return `cluster-multi-${sortedIds}`;
  }
  return `cluster-single-${cluster.events[0].id}-${index}`;
};

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
      whileHover={{ scale: 1.3, zIndex: 30 }}
      onClick={() => onClick(cluster)}
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotate: 0,
        y: [0, -4, 0],
      }}
      exit={{ opacity: 0, scale: 0, rotate: 180 }}
      transition={{ 
        opacity: { duration: 0.3 },
        scale: { type: "spring", stiffness: 400, damping: 20 },
        rotate: { duration: 0.5 },
        y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      {/* Tooltip Premium */}
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.9 }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        className="absolute bottom-full mb-4 px-4 py-3 bg-black/98 backdrop-blur-2xl rounded-2xl text-white text-xs whitespace-nowrap border-2 shadow-2xl pointer-events-none z-50"
        style={{
          borderColor: eventColor.glow,
          boxShadow: `0 0 40px ${eventColor.glow}80, 0 0 80px ${eventColor.glow}40, inset 0 0 20px ${eventColor.glow}20`
        }}
      >
        {isClusterGroup ? (
          <div>
            <div className="font-bold mb-2 flex items-center gap-2 text-base" style={{ color: eventColor.base }}>
              <Music2 className="w-5 h-5" />
              ⚡ {events.length} EVENTOS PRÓXIMOS
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">
              Clique para expandir
            </div>
          </div>
        ) : (
          <div>
            <div className="font-bold mb-2 flex items-center gap-2" style={{ color: eventColor.base }}>
              <Music2 className="w-4 h-4" />
              {mainEvent.title}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span className="truncate max-w-[160px]">
                {mainEvent.location.venue_name || mainEvent.location.city}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* MEGA AURA LUMINOSA - 4 Layers */}
      {[0, 1, 2, 3].map(layer => (
        <motion.div
          key={layer}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            width: isClusterGroup ? `${140 - layer * 20}px` : `${120 - layer * 20}px`,
            height: isClusterGroup ? `${140 - layer * 20}px` : `${120 - layer * 20}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${eventColor.glow}${40 - layer * 5} 0%, ${eventColor.glow}${25 - layer * 5} 40%, transparent 70%)`,
            filter: `blur(${30 - layer * 5}px)`,
          }}
          animate={{
            scale: [1, 1.6 - layer * 0.1, 1],
            opacity: [0.4 - layer * 0.05, 0.8 - layer * 0.1, 0.4 - layer * 0.05]
          }}
          transition={{
            duration: 3 + layer * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: layer * 0.2
          }}
        />
      ))}

      {/* Pin Principal ULTRA NEON */}
      <motion.div 
        className="relative"
        animate={{
          boxShadow: [
            `0 0 30px ${eventColor.glow}, 0 0 60px ${eventColor.glow}90, 0 0 90px ${eventColor.glow}50`,
            `0 0 50px ${eventColor.glow}, 0 0 100px ${eventColor.glow}, 0 0 150px ${eventColor.glow}70`,
            `0 0 30px ${eventColor.glow}, 0 0 60px ${eventColor.glow}90, 0 0 90px ${eventColor.glow}50`
          ],
          rotate: [0, 3, -3, 0],
        }}
        transition={{ 
          boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{
          filter: `drop-shadow(0 0 ${isClusterGroup ? '25px' : '20px'} ${eventColor.glow})`
        }}
      >
        <div 
          className={`${isClusterGroup ? 'w-20 h-20' : 'w-14 h-14'} rounded-full border-4 bg-gradient-to-br flex items-center justify-center relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${eventColor.base}, ${eventColor.base}CC)`,
            borderColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: `0 0 35px ${eventColor.glow}, inset 0 0 30px rgba(255,255,255,0.5), inset 0 0 50px ${eventColor.glow}40`
          }}
        >
          {/* Reflexo Premium Animado */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.8) 0%, transparent 60%)',
            }}
            animate={{
              opacity: [0.4, 0.9, 0.4],
              scale: [1, 1.2, 1],
              x: [-2, 2, -2],
              y: [-2, 2, -2]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Conteúdo */}
          {isClusterGroup ? (
            <motion.div 
              className="text-white font-black text-2xl z-10 relative"
              animate={{
                scale: [1, 1.1, 1],
                textShadow: [
                  `0 0 10px ${eventColor.glow}`,
                  `0 0 20px ${eventColor.glow}`,
                  `0 0 10px ${eventColor.glow}`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {events.length}
            </motion.div>
          ) : (
            <motion.div 
              className="w-6 h-6 rounded-full bg-white z-10 relative"
              animate={{
                scale: [1, 1.6, 1],
                opacity: [1, 0.7, 1],
                boxShadow: [
                  `0 0 10px rgba(255,255,255,0.8)`,
                  `0 0 25px rgba(255,255,255,1)`,
                  `0 0 10px rgba(255,255,255,0.8)`
                ]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>

        {/* Anéis Orbitais Duplos */}
        {[1, 2].map(ring => (
          <motion.div
            key={ring}
            className="absolute inset-0 rounded-full border-2 pointer-events-none"
            style={{
              borderColor: eventColor.glow,
              width: isClusterGroup ? `${90 + ring * 15}px` : `${70 + ring * 12}px`,
              height: isClusterGroup ? `${90 + ring * 15}px` : `${70 + ring * 12}px`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 0, 0.8],
              rotate: ring % 2 === 0 ? [0, 360] : [360, 0]
            }}
            transition={{
              duration: 4 + ring,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
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
  activeVibe = 'all',
  activeFiltersCount = 0
}) {
  const [expandedCluster, setExpandedCluster] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [showVenues, setShowVenues] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [radarActive, setRadarActive] = useState(false);
  const [mapStyle, setMapStyle] = useState('dark');

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
      } catch {
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
        glowColor: 'rgba(6, 182, 212, 1)',
        secondaryGlow: 'rgba(139, 92, 246, 1)',
        accentColor: '#06B6D4'
      },
      'dançar': {
        glowColor: 'rgba(236, 72, 153, 1)',
        secondaryGlow: 'rgba(168, 85, 247, 1)',
        accentColor: '#EC4899'
      },
      'relaxar': {
        glowColor: 'rgba(59, 130, 246, 1)',
        secondaryGlow: 'rgba(99, 102, 241, 1)',
        accentColor: '#3B82F6'
      },
      'socializar': {
        glowColor: 'rgba(168, 85, 247, 1)',
        secondaryGlow: 'rgba(236, 72, 153, 1)',
        accentColor: '#A855F7'
      },
      'adrenalina': {
        glowColor: 'rgba(249, 115, 22, 1)',
        secondaryGlow: 'rgba(239, 68, 68, 1)',
        accentColor: '#F97316'
      }
    };
    return themes[activeVibe] || themes['all'];
  }, [activeVibe]);

  const validEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    return events.filter(e => {
      if (!e?.id || !e?.title) return false;
      if (!validateCoordinates(e.location?.lat, e.location?.lng)) return false;
      
      const R = 6371;
      const dLat = (e.location.lat - userLocation.lat) * Math.PI / 180;
      const dLng = (e.location.lng - userLocation.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(e.location.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return distance <= 10;
    });
  }, [events, userLocation]);

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

  const handleVenueClick = useCallback((venue) => {
    setSelectedVenue(venue);
  }, []);

  return (
    <motion.div
      className="w-full h-full relative overflow-hidden"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.15 }}
      onDragEnd={(event, info) => {
        if (info.offset.y < -60) onSwipeUp();
      }}
    >
      {/* BACKGROUND CYBERPUNK ULTRA */}
      <div className="absolute inset-0 z-0" style={{ 
        background: 'linear-gradient(135deg, #0a0e1a 0%, #000000 40%, #0d0520 100%)' 
      }}>
        {/* Gradiente Atmosférico Dinâmico */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${vibeTheme.glowColor}15 0%, transparent 50%),
                         radial-gradient(ellipse at 70% 80%, ${vibeTheme.secondaryGlow}12 0%, transparent 50%)`,
            mixBlendMode: 'screen'
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Grid Cyber Animado */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${vibeTheme.glowColor}40 1px, transparent 1px),
              linear-gradient(to bottom, ${vibeTheme.glowColor}40 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            opacity: 0.08
          }}
          animate={{
            backgroundPosition: ['0px 0px', '50px 50px']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Scanlines Neon */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              ${vibeTheme.glowColor}15 0px,
              transparent 1px,
              transparent 4px
            )`,
            opacity: 0.05
          }}
          animate={{ y: ['-4px', '0px'] }}
          transition={{ duration: 0.1, repeat: Infinity, ease: "linear" }}
        />

        {/* Hotspots de Eventos */}
        {eventClusters.filter(c => c.isCluster || c.events.length >= 2).map((cluster, idx) => {
          const pos = coordToPosition(cluster.center.lat, cluster.center.lng);
          const color = getEventColor(cluster.events[0]).glow;
          
          return (
            <motion.div
              key={`hotspot-${idx}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: '200px',
                height: '200px',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${color}30 0%, ${color}15 40%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: idx * 0.7
              }}
            />
          );
        })}
      </div>

      {/* MAPBOX DARK STYLE */}
      <div className="absolute inset-0 z-1">
        <iframe
          key={`map-${zoomLevel}-${bbox}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/${zoomLevel}/${Math.floor((userLocation.lng + 180) / 360 * Math.pow(2, zoomLevel))}/${Math.floor((1 - Math.log(Math.tan(userLocation.lat * Math.PI / 180) + 1 / Math.cos(userLocation.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoomLevel))}@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
          className="absolute inset-0 opacity-90"
          style={{
            filter: 'contrast(1.2) saturate(0.8) brightness(0.7)',
            pointerEvents: 'none',
            mixBlendMode: 'luminosity'
          }}
          loading="lazy"
        />
      </div>

      {/* Overlay Gradiente Neon */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-2"
        style={{
          background: `linear-gradient(135deg, 
            ${vibeTheme.glowColor}08 0%, 
            transparent 30%, 
            ${vibeTheme.secondaryGlow}08 70%, 
            transparent 100%)`,
          mixBlendMode: 'screen'
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Scan Line Horizontal */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-3"
        style={{
          background: `linear-gradient(to bottom, 
            transparent 0%, 
            ${vibeTheme.glowColor}15 49%, 
            ${vibeTheme.glowColor}25 50%, 
            ${vibeTheme.glowColor}15 51%, 
            transparent 100%)`,
          height: '100%',
        }}
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* RADAR MODE - Pulse Sonar */}
      <AnimatePresence>
        {radarActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-4 flex items-center justify-center"
          >
            <motion.div
              className="absolute"
              style={{
                width: '100%',
                height: '100%',
                background: `conic-gradient(from 0deg, 
                  transparent 0deg, 
                  ${vibeTheme.glowColor}50 30deg, 
                  ${vibeTheme.glowColor}30 60deg, 
                  transparent 120deg)`,
                transformOrigin: 'center center',
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 pointer-events-none"
                style={{
                  width: `${(i + 1) * 20}%`,
                  height: `${(i + 1) * 20}%`,
                  borderColor: `${vibeTheme.glowColor}40`,
                  boxShadow: `0 0 25px ${vibeTheme.glowColor}50, inset 0 0 25px ${vibeTheme.glowColor}30`,
                }}
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.5, 0.9, 0.5]
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
              />
            ))}

            <motion.div
              className="absolute w-5 h-5 rounded-full"
              style={{
                background: vibeTheme.glowColor,
                boxShadow: `0 0 40px ${vibeTheme.glowColor}, 0 0 80px ${vibeTheme.glowColor}90`,
              }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [1, 0.6, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vinheta Premium */}
      <div 
        className="absolute inset-0 pointer-events-none z-3"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 50%, rgba(0,0,0,0.5) 100%)'
        }}
      />

      {/* Markers Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* LOCALIZAÇÃO DO USUÁRIO - ULTRA NEON */}
        <motion.div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-50"
          style={{ left: `${userPosition.x}%`, top: `${userPosition.y}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1,
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{ 
            opacity: { duration: 0.5 },
            scale: { type: "spring", stiffness: 300, damping: 20 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* Pulse Rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: vibeTheme.glowColor,
                width: `${40 + i * 30}px`,
                height: `${40 + i * 30}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [1, 2.5, 1],
                opacity: [0.8, 0, 0.8]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.5
              }}
            />
          ))}

          {/* Pin Central */}
          <motion.div 
            className="w-8 h-8 rounded-full border-3 flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              borderColor: 'rgba(255, 255, 255, 1)',
              boxShadow: `
                0 0 30px ${vibeTheme.glowColor}, 
                0 0 60px ${vibeTheme.glowColor}90,
                0 0 100px ${vibeTheme.secondaryGlow}70,
                inset 0 0 25px rgba(255,255,255,0.6)
              `,
            }}
            animate={{
              boxShadow: [
                `0 0 30px ${vibeTheme.glowColor}, 0 0 60px ${vibeTheme.glowColor}90, 0 0 100px ${vibeTheme.secondaryGlow}70`,
                `0 0 40px ${vibeTheme.glowColor}, 0 0 80px ${vibeTheme.glowColor}, 0 0 140px ${vibeTheme.secondaryGlow}`,
                `0 0 30px ${vibeTheme.glowColor}, 0 0 60px ${vibeTheme.glowColor}90, 0 0 100px ${vibeTheme.secondaryGlow}70`
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7) 0%, transparent 70%)',
              }}
              animate={{
                opacity: [0.4, 0.9, 0.4],
                scale: [1, 1.15, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />

            <Target className="w-4 h-4 text-white relative z-10" strokeWidth={3} />
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

        {/* Event Pins */}
        <AnimatePresence>
          {eventClusters.map((cluster, index) => {
            const position = coordToPosition(cluster.center.lat, cluster.center.lng);
            
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

      {/* HEADER GLASSMORPHISM */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4" style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenVibe}
              className="px-4 py-2 rounded-xl backdrop-blur-2xl border-2 text-white text-xs font-semibold shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${vibeTheme.glowColor}20, ${vibeTheme.secondaryGlow}15, rgba(0,0,0,0.6))`,
                borderColor: `${vibeTheme.glowColor}60`,
                boxShadow: `0 0 25px ${vibeTheme.glowColor}40, inset 0 0 20px ${vibeTheme.glowColor}10`
              }}
            >
              <Music2 className="w-4 h-4 inline mr-1.5" />
              Vibes
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenFilters}
              className="px-4 py-2 rounded-xl backdrop-blur-2xl border-2 text-white text-xs font-semibold relative shadow-lg"
              style={{
                background: activeFiltersCount > 0 
                  ? `linear-gradient(135deg, ${vibeTheme.glowColor}30, ${vibeTheme.secondaryGlow}20, rgba(0,0,0,0.6))` 
                  : 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5))',
                borderColor: activeFiltersCount > 0 ? `${vibeTheme.glowColor}70` : 'rgba(107, 114, 128, 0.5)',
                boxShadow: activeFiltersCount > 0 ? `0 0 30px ${vibeTheme.glowColor}50` : 'none'
              }}
            >
              <Filter className="w-4 h-4 inline mr-1.5" />
              Filtros
              {activeFiltersCount > 0 && (
                <motion.span 
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {activeFiltersCount}
                </motion.span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRadarActive(!radarActive)}
              className="px-3 py-2 rounded-xl backdrop-blur-2xl border-2 text-xs font-semibold shadow-lg"
              style={{
                background: radarActive 
                  ? `linear-gradient(135deg, ${vibeTheme.glowColor}30, ${vibeTheme.secondaryGlow}20, rgba(0,0,0,0.6))` 
                  : 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5))',
                borderColor: radarActive ? `${vibeTheme.glowColor}70` : 'rgba(107, 114, 128, 0.5)',
                boxShadow: radarActive ? `0 0 30px ${vibeTheme.glowColor}60` : 'none',
                color: radarActive ? 'white' : '#9CA3AF'
              }}
            >
              <Radar className={`w-4 h-4 inline mr-1 ${radarActive ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              Radar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVenues(!showVenues)}
              className="px-3 py-2 rounded-xl backdrop-blur-2xl border-2 text-xs font-semibold shadow-lg"
              style={{
                background: showVenues 
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2), rgba(0,0,0,0.6))' 
                  : 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5))',
                borderColor: showVenues ? 'rgba(251, 191, 36, 0.7)' : 'rgba(107, 114, 128, 0.5)',
                boxShadow: showVenues ? '0 0 25px rgba(251, 191, 36, 0.6)' : 'none',
                color: showVenues ? 'white' : '#9CA3AF'
              }}
            >
              <MapIcon className="w-4 h-4 inline mr-1" />
              Locais
            </motion.button>

            <Link to={createPageUrl("Feed")} className="ml-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="backdrop-blur-2xl border-2 text-white hover:bg-white/10 h-9 w-9 rounded-xl shadow-lg"
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderColor: 'rgba(107, 114, 128, 0.5)'
                  }}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
          </div>

          {/* SEARCH BAR PREMIUM */}
          <motion.div 
            className="relative"
            whileFocus={{ scale: 1.02 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: vibeTheme.accentColor }} />
            <Input
              placeholder="Buscar eventos ou locais..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-3 backdrop-blur-2xl border-2 text-white placeholder:text-gray-400 text-sm h-11 rounded-xl shadow-xl transition-all duration-300 focus:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))',
                borderColor: searchTerm ? `${vibeTheme.glowColor}70` : `${vibeTheme.glowColor}30`,
                boxShadow: searchTerm 
                  ? `0 0 30px ${vibeTheme.glowColor}50, inset 0 0 20px ${vibeTheme.glowColor}15` 
                  : `0 0 15px ${vibeTheme.glowColor}20`
              }}
            />
            {searchTerm && (
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ background: vibeTheme.glowColor }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* ZOOM CONTROLS GLASSMORPHISM */}
      <div className="absolute right-3 sm:right-4 bottom-36 sm:bottom-32 z-30 flex flex-col gap-3">
        {[
          { icon: ZoomIn, action: () => setZoomLevel(prev => Math.min(prev + 1, 18)), disabled: zoomLevel >= 18 },
          { icon: ZoomOut, action: () => setZoomLevel(prev => Math.max(prev - 1, 10)), disabled: zoomLevel <= 10 }
        ].map(({ icon: Icon, action, disabled }, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: disabled ? 1 : 1.12 }}
            whileTap={{ scale: disabled ? 1 : 0.88 }}
            onClick={action}
            disabled={disabled}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl backdrop-blur-2xl border-2 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}25, ${vibeTheme.secondaryGlow}15, rgba(0,0,0,0.7))`,
              borderColor: `${vibeTheme.glowColor}60`,
              boxShadow: `0 0 25px ${vibeTheme.glowColor}50, inset 0 0 15px ${vibeTheme.glowColor}10`
            }}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        ))}
      </div>

      {/* FAB UPLOAD ULTRA NEON */}
      {canCreateReels && (
        <motion.div
          className="absolute bottom-24 sm:bottom-20 right-3 sm:right-4 z-30"
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.9, rotate: 0 }}
        >
          <Button
            onClick={onOpenUpload}
            size="icon"
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-4 relative overflow-hidden shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              borderColor: 'rgba(255, 255, 255, 0.4)',
              boxShadow: `0 0 40px ${vibeTheme.glowColor}, 0 0 80px ${vibeTheme.glowColor}80, 0 0 120px ${vibeTheme.secondaryGlow}60`
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 70%)',
              }}
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Plus className="w-7 h-7 sm:w-8 sm:h-8 relative z-10" strokeWidth={3} />
          </Button>
        </motion.div>
      )}

      {/* BOTTOM BAR GLASSMORPHISM */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 pb-4 px-4"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
        }}
        drag="y"
        dragConstraints={{ top: -120, bottom: 0 }}
        dragElastic={0.3}
        onDragEnd={(e, info) => {
          if (info.offset.y < -60) onSwipeUp();
        }}
      >
        <div className="flex flex-col items-center cursor-pointer" onClick={onSwipeUp}>
          {/* Drag Indicator NEON */}
          <motion.div
            className="w-16 h-2 rounded-full mb-3"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              boxShadow: `0 0 20px ${vibeTheme.glowColor}80, 0 0 40px ${vibeTheme.glowColor}50`
            }}
            animate={{ 
              scaleX: [1, 1.4, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          
          {/* VER REELS BUTTON ULTRA */}
          <motion.button
            className="backdrop-blur-2xl px-8 py-4 rounded-2xl shadow-2xl border-3 flex items-center gap-3 text-base font-black relative overflow-hidden group"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow}, ${vibeTheme.glowColor})`,
              backgroundSize: '200% 200%',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              boxShadow: `0 0 40px ${vibeTheme.glowColor}90, 0 0 80px ${vibeTheme.secondaryGlow}70, inset 0 0 30px rgba(255,255,255,0.3)`
            }}
            whileHover={{ 
              scale: 1.08,
              boxShadow: `0 0 60px ${vibeTheme.glowColor}, 0 0 120px ${vibeTheme.secondaryGlow}90`,
            }}
            whileTap={{ scale: 0.92 }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              backgroundPosition: { duration: 5, repeat: Infinity, ease: "linear" }
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.5) 0%, transparent 60%)`,
              }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0, 0.6, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)',
              }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />

            <Eye className="w-6 h-6 text-white relative z-10" strokeWidth={2.5} />
            <span className="text-white relative z-10 uppercase tracking-wide">Ver Reels</span>
          </motion.button>

          <motion.p 
            className="text-white/60 text-xs mt-2 font-semibold uppercase tracking-widest"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ⬆️ Arraste para cima
          </motion.p>
        </div>
      </motion.div>

      {/* CLUSTER EXPANDIDO MODAL */}
      <AnimatePresence>
        {expandedCluster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(30px)'
            }}
            onClick={() => setExpandedCluster(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              className="rounded-3xl border-3 p-6 max-w-md w-full max-h-[75vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98), rgba(17, 24, 39, 0.98))',
                borderColor: vibeTheme.glowColor,
                boxShadow: `0 0 60px ${vibeTheme.glowColor}70, 0 0 120px ${vibeTheme.glowColor}40, inset 0 0 40px ${vibeTheme.glowColor}10`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-white mb-5 flex items-center gap-3 uppercase tracking-wide">
                <MapPin className="w-6 h-6" style={{ color: vibeTheme.accentColor }} />
                {expandedCluster.events.length} Eventos Próximos
              </h3>
              
              <div className="space-y-3">
                {expandedCluster.events.map(event => {
                  const eventColor = getEventColor(event);
                  
                  return (
                    <motion.div
                      key={event.id}
                      className="p-4 rounded-xl border-2 cursor-pointer transition-all"
                      style={{
                        background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.8))',
                        borderColor: `${eventColor.glow}40`
                      }}
                      whileHover={{ 
                        scale: 1.03,
                        borderColor: eventColor.glow,
                        boxShadow: `0 0 30px ${eventColor.glow}60, inset 0 0 20px ${eventColor.glow}15`
                      }}
                      onClick={() => {
                        onPinDetailsClick(event);
                        setExpandedCluster(null);
                      }}
                    >
                      <h4 className="font-bold text-white text-base mb-2">{event.title}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
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

      {selectedVenue && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
        />
      )}

      {/* CYBER ANIMATIONS CSS */}
      <style jsx>{`
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.18; }
        }
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.15;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
        }
      `}</style>
    </motion.div>
  );
}