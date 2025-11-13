import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Menu, Search, Navigation, Music2, Loader2 } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SearchResults from "../map/SearchResults";
import ClusterExpansion from "../map/ClusterExpansion";
import { intelligentSearch } from "@/functions/intelligentSearch";
import useCurrentUser from "../shared/useCurrentUser";
import { clusterEvents, getClusterVisualSize, getClusterColor } from "../shared/services/clusteringAlgorithm";

const EventPin = memo(({ cluster, position, onClick, theme, isPulsing }) => {
  const { events, isCluster: isClusterGroup, density = 1 } = cluster;
  const eventColor = getClusterColor(cluster);
  const sizes = getClusterVisualSize(cluster);

  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto"
      style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: isClusterGroup ? 15 : 12 }}
      whileHover={{ scale: 1.2, zIndex: 25 }}
      whileTap={{ scale: 0.9 }}
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
        className="absolute bottom-full mb-2 px-3 py-2 bg-black/95 backdrop-blur-xl rounded-xl text-white text-xs whitespace-nowrap border-2 shadow-2xl pointer-events-none z-50"
        style={{
          borderColor: eventColor,
          boxShadow: `0 0 20px ${eventColor}`
        }}
      >
        <div className="font-bold" style={{ color: eventColor }}>
          {isClusterGroup ? `⚡ ${events.length} eventos` : events[0].title}
        </div>
        {!isClusterGroup && (
          <div className="text-[10px] text-gray-400 mt-1">
            {events[0].location?.venue_name}
          </div>
        )}
      </motion.div>

      {/* Glow pulsante */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: sizes.glow,
          height: sizes.glow,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${eventColor}50 0%, transparent 70%)`,
          filter: 'blur(15px)',
        }}
        animate={{
          scale: isPulsing ? [1, 1.4, 1] : 1,
          opacity: isPulsing ? [0.5, 0.8, 0.5] : 0.6
        }}
        transition={{ 
          duration: 2, 
          repeat: isPulsing ? Infinity : 0,
          ease: "easeInOut" 
        }}
      />

      {/* Pin principal */}
      <motion.div
        className={`${sizes.pin} rounded-full border-2 border-white flex items-center justify-center relative overflow-hidden`}
        style={{
          background: `linear-gradient(135deg, ${eventColor}, ${eventColor}DD)`,
          boxShadow: `0 0 20px ${eventColor}, inset 0 2px 8px rgba(255,255,255,0.3)`
        }}
        animate={isPulsing ? {
          boxShadow: [
            `0 0 15px ${eventColor}`,
            `0 0 30px ${eventColor}, 0 0 45px ${eventColor}90`,
            `0 0 15px ${eventColor}`
          ]
        } : {}}
        transition={{ duration: 2, repeat: isPulsing ? Infinity : 0 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 70%)',
          }}
        />

        {isClusterGroup ? (
          <div className="text-white font-bold z-10" style={{ fontSize: sizes.fontSize }}>
            {events.length}
          </div>
        ) : (
          <motion.div
            className="w-3 h-3 rounded-full bg-white z-10"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Ring pulsante para clusters */}
      {isClusterGroup && (
        <motion.div
          className="absolute rounded-full border-2 pointer-events-none"
          style={{
            borderColor: eventColor,
            width: '60px',
            height: '60px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 0, 0.7]
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.cluster.events.length === next.cluster.events.length &&
    prev.position.x === next.position.x &&
    prev.position.y === next.position.y &&
    prev.isPulsing === next.isPulsing
  );
});

EventPin.displayName = 'EventPin';

export default function MapView({
  events,
  userLocation,
  onPinClick,
  onPinDetailsClick,
  onSwipeUp,
  onOpenVibe,
  onOpenUpload,
  searchTerm,
  onSearchChange,
  activeVibe = 'all'
}) {
  const [zoomLevel, setZoomLevel] = useState(15);
  const [mapCenter, setMapCenter] = useState(userLocation);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedCluster, setExpandedCluster] = useState(null);
  const [pulsingPins, setPulsingPins] = useState(new Set());

  const { data: user } = useCurrentUser();
  const canCreateReels = user && (user.is_pro_member || user.is_organizer);

  const vibeTheme = useMemo(() => {
    const themes = {
      'all': { color: '#06B6D4' },
      'dançar': { color: '#EC4899' },
      'relaxar': { color: '#3B82F6' },
      'socializar': { color: '#A855F7' },
      'adrenalina': { color: '#F97316' }
    };
    return themes[activeVibe] || themes['all'];
  }, [activeVibe]);

  const validEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    return events.filter(e => e?.id && e?.title && e?.location?.lat && e?.location?.lng);
  }, [events]);

  const eventClusters = useMemo(() => {
    return clusterEvents(validEvents, zoomLevel, 1);
  }, [validEvents, zoomLevel]);

  const mapBounds = useMemo(() => {
    const latRange = 0.5 / Math.pow(2, zoomLevel - 10);
    const lngRange = 0.5 / Math.pow(2, zoomLevel - 10);

    return {
      minLat: mapCenter.lat - latRange,
      maxLat: mapCenter.lat + latRange,
      minLng: mapCenter.lng - lngRange,
      maxLng: mapCenter.lng + lngRange
    };
  }, [mapCenter, zoomLevel]);

  const bbox = useMemo(() => {
    return `${mapBounds.minLng},${mapBounds.minLat},${mapBounds.maxLng},${mapBounds.maxLat}`;
  }, [mapBounds]);

  const coordToPosition = useCallback((lat, lng) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    return { x, y };
  }, [mapBounds]);

  const userPosition = useMemo(() => 
    coordToPosition(userLocation.lat, userLocation.lng), 
    [userLocation, coordToPosition]
  );

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(18, prev + 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(10, prev - 1));
  }, []);

  const handleClusterClick = useCallback((cluster) => {
    if (cluster.isCluster && cluster.events.length > 1) {
      setExpandedCluster(cluster);
      
      // Zoom para o cluster
      setMapCenter({ lat: cluster.center.lat, lng: cluster.center.lng });
      if (zoomLevel < 16) {
        setZoomLevel(16);
      }
    } else {
      onPinDetailsClick(cluster.events[0]);
    }
  }, [zoomLevel, onPinDetailsClick]);

  const handleIntelligentSearch = useCallback(async () => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const { data } = await intelligentSearch({
        query: searchTerm,
        userLocation: mapCenter
      });

      setSearchResults(data);
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults({
        query: searchTerm,
        detected_type: 'error',
        results: [],
        suggestions: ['Erro ao buscar. Tente novamente.']
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, mapCenter]);

  // Pan com teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const panAmount = 0.01;
      
      switch(e.key) {
        case 'ArrowUp':
          setMapCenter(prev => ({ ...prev, lat: prev.lat + panAmount }));
          e.preventDefault();
          break;
        case 'ArrowDown':
          setMapCenter(prev => ({ ...prev, lat: prev.lat - panAmount }));
          e.preventDefault();
          break;
        case 'ArrowLeft':
          setMapCenter(prev => ({ ...prev, lng: prev.lng - panAmount }));
          e.preventDefault();
          break;
        case 'ArrowRight':
          setMapCenter(prev => ({ ...prev, lng: prev.lng + panAmount }));
          e.preventDefault();
          break;
        case '+':
        case '=':
          handleZoomIn();
          e.preventDefault();
          break;
        case '-':
        case '_':
          handleZoomOut();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

      {/* Mapa OpenStreetMap */}
      <div className="absolute inset-0 z-1">
        <iframe
          key={`map-${bbox}-${zoomLevel}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&zoom=${zoomLevel}`}
          className="absolute inset-0"
          style={{
            filter: 'grayscale(90%) invert(95%) brightness(0.8) contrast(1.4)',
            opacity: 0.9,
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease'
          }}
          loading="lazy"
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 z-2 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${vibeTheme.color} 0.5px, transparent 0.5px),
            linear-gradient(to bottom, ${vibeTheme.color} 0.5px, transparent 0.5px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Events overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* User marker com pulse */}
        <motion.div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
          style={{ left: `${userPosition.x}%`, top: `${userPosition.y}%` }}
          animate={{
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: '60px',
              height: '60px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${vibeTheme.color}30 0%, transparent 70%)`,
              filter: 'blur(12px)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.9, 0.5]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Marker */}
          <div
            className="w-7 h-7 rounded-full relative"
            style={{
              background: `radial-gradient(circle, ${vibeTheme.color}, ${vibeTheme.color}DD)`,
              border: `3px solid white`,
              boxShadow: `0 0 20px ${vibeTheme.color}, 0 4px 10px rgba(0,0,0,0.5)`
            }}
          >
            <Navigation 
              className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
              strokeWidth={3}
            />
          </div>

          {/* Pulse ring */}
          <motion.div
            className="absolute rounded-full border-2"
            style={{
              borderColor: vibeTheme.color,
              width: '50px',
              height: '50px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.8, 0, 0.8]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* Event pins */}
        <AnimatePresence>
          {eventClusters.map((cluster, index) => {
            const position = coordToPosition(cluster.center.lat, cluster.center.lng);
            const isPulsing = pulsingPins.has(index);
            
            return (
              <EventPin
                key={`cluster-${index}-${cluster.events[0]?.id || index}`}
                cluster={cluster}
                position={position}
                onClick={handleClusterClick}
                theme={vibeTheme}
                isPulsing={isPulsing}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            onClick={onOpenVibe}
            size="sm"
            className="px-3 h-9 bg-black/70 backdrop-blur-xl border border-cyan-500/40 text-white hover:bg-cyan-600/20"
          >
            <Music2 className="w-4 h-4 mr-1.5" />
            Vibes
          </Button>

          <Link to={createPageUrl("Feed")} className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-black/70 backdrop-blur-xl border border-gray-700 text-white"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 z-10" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleIntelligentSearch()}
              className="pl-10 h-10 bg-black/70 backdrop-blur-xl border border-cyan-500/40 text-white placeholder:text-gray-500 text-sm rounded-lg"
            />
          </div>
          <Button
            onClick={handleIntelligentSearch}
            disabled={isSearching || !searchTerm}
            className="h-10 px-4 bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* FAB Upload */}
      {canCreateReels && (
        <motion.div
          className="absolute bottom-20 right-3 z-30"
          whileHover={{ scale: 1.15, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <Button
            onClick={onOpenUpload}
            size="icon"
            className="w-14 h-14 rounded-full border-3 border-white/30 relative overflow-hidden shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.color}, ${vibeTheme.color}DD)`,
              boxShadow: `0 0 30px ${vibeTheme.color}`
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 70%)',
              }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Plus className="w-6 h-6 relative z-10 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Swipe up area */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 pb-3 px-4"
        drag="y"
        dragConstraints={{ top: -80, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.y < -50) onSwipeUp();
        }}
      >
        <div className="flex flex-col items-center cursor-pointer" onClick={onSwipeUp}>
          <motion.div
            className="w-12 h-1.5 rounded-full mb-2"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.color}, ${vibeTheme.color}DD)`,
              boxShadow: `0 0 15px ${vibeTheme.color}`
            }}
            animate={{ 
              scaleX: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="px-6 py-3 rounded-full relative overflow-hidden shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${vibeTheme.color}, ${vibeTheme.color}DD)`,
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: `0 0 30px ${vibeTheme.color}`
              }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 70%)',
                }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Eye className="w-5 h-5 mr-2 relative z-10 text-white" />
              <span className="text-white relative z-10 font-semibold">Ver Reels</span>
            </Button>
          </motion.div>

          <motion.p
            className="text-white/40 text-xs mt-2"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Arraste para cima
          </motion.p>
        </div>
      </motion.div>

      {/* Search Results */}
      <AnimatePresence>
        {showSearchResults && (
          <SearchResults
            searchData={searchResults}
            onClose={() => {
              setShowSearchResults(false);
              setSearchResults(null);
            }}
            onEventClick={(result) => {
              const event = events.find(e => e.id === result.id);
              if (event) {
                onPinDetailsClick(event);
                setShowSearchResults(false);
                
                // Centralizar no evento
                setMapCenter({ lat: event.location.lat, lng: event.location.lng });
                setZoomLevel(17);
              }
            }}
            isLoading={isSearching}
            userLocation={mapCenter}
          />
        )}
      </AnimatePresence>

      {/* Cluster Expansion */}
      <AnimatePresence>
        {expandedCluster && (
          <ClusterExpansion
            cluster={expandedCluster}
            onClose={() => setExpandedCluster(null)}
            onEventClick={(event) => {
              onPinDetailsClick(event);
              setExpandedCluster(null);
            }}
            userLocation={userLocation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}