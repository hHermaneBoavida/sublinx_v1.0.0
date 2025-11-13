import React, { useState, useMemo, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Menu, Search, MapPin, Navigation, Music2, Loader2 } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SearchResults from "../map/SearchResults";
import { intelligentSearch } from "@/functions/intelligentSearch";
import useCurrentUser from "../shared/useCurrentUser";
import { clusterEvents, getClusterVisualSize, getClusterColor } from "../shared/services/clusteringAlgorithm";

// OTIMIZAÇÃO: Memoizar pin para evitar re-renders
const EventPin = memo(({ cluster, position, onClick, theme }) => {
  const { events, isCluster: isClusterGroup, density = 1 } = cluster;
  const eventColor = getClusterColor(cluster);
  const sizes = getClusterVisualSize(cluster);
  const glowIntensity = Math.min(0.9, 0.3 + (density / 15));

  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto z-10"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      whileHover={{ scale: 1.15, zIndex: 20 }}
      onClick={() => onClick(cluster)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      {/* Tooltip simplificado */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute bottom-full mb-2 px-3 py-2 bg-black/95 backdrop-blur-xl rounded-xl text-white text-xs whitespace-nowrap border-2 shadow-2xl pointer-events-none z-50"
        style={{
          borderColor: eventColor,
          boxShadow: `0 0 20px ${eventColor}`
        }}
      >
        {isClusterGroup ? (
          <div className="font-bold" style={{ color: eventColor }}>
            ⚡ {events.length} eventos
          </div>
        ) : (
          <div className="font-bold" style={{ color: eventColor }}>
            {events[0].title}
          </div>
        )}
      </motion.div>

      {/* Glow simplificado */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: sizes.glow,
          height: sizes.glow,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${eventColor}40 0%, transparent 70%)`,
          filter: 'blur(12px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      {/* Pin */}
      <div
        className={`${sizes.pin} rounded-full border-3 border-white/90 flex items-center justify-center relative overflow-hidden`}
        style={{
          background: `linear-gradient(135deg, ${eventColor}, ${eventColor}CC)`,
          boxShadow: `0 0 15px ${eventColor}`
        }}
      >
        {isClusterGroup ? (
          <div className="text-white font-bold text-xs z-10">
            {events.length}
          </div>
        ) : (
          <div className="w-3 h-3 rounded-full bg-white z-10" />
        )}
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.cluster.events.length === next.cluster.events.length &&
    prev.position.x === next.position.x &&
    prev.position.y === next.position.y
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
  const [zoomLevel] = useState(15); // OTIMIZAÇÃO: Remover setZoomLevel se não usado
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: user } = useCurrentUser();
  const canCreateReels = user && (user.is_pro_member || user.is_organizer);

  // OTIMIZAÇÃO: Theme simplificado
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

  // OTIMIZAÇÃO: Validar eventos uma vez
  const validEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    return events.filter(e => e?.id && e?.title && e?.location?.lat && e?.location?.lng);
  }, [events]);

  // OTIMIZAÇÃO: Clustering otimizado
  const eventClusters = useMemo(() => {
    return clusterEvents(validEvents, zoomLevel, 1);
  }, [validEvents, zoomLevel]);

  // OTIMIZAÇÃO: Bounds calculados uma vez
  const mapBounds = useMemo(() => {
    const latRange = 0.5 / Math.pow(2, zoomLevel - 10);
    const lngRange = 0.5 / Math.pow(2, zoomLevel - 10);

    return {
      minLat: userLocation.lat - latRange,
      maxLat: userLocation.lat + latRange,
      minLng: userLocation.lng - lngRange,
      maxLng: userLocation.lng + lngRange
    };
  }, [userLocation.lat, userLocation.lng, zoomLevel]);

  const bbox = useMemo(() => {
    return `${mapBounds.minLng},${mapBounds.minLat},${mapBounds.maxLng},${mapBounds.maxLat}`;
  }, [mapBounds.minLng, mapBounds.minLat, mapBounds.maxLng, mapBounds.maxLat]);

  const coordToPosition = useCallback((lat, lng) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    return { x, y };
  }, [mapBounds]);

  const userPosition = useMemo(() => 
    coordToPosition(userLocation.lat, userLocation.lng), 
    [userLocation.lat, userLocation.lng, coordToPosition]
  );

  const handleClusterClick = useCallback((cluster) => {
    if (cluster.isCluster) {
      // Expandir cluster (simplificado)
      onPinDetailsClick(cluster.events[0]);
    } else {
      onPinDetailsClick(cluster.events[0]);
    }
  }, [onPinDetailsClick]);

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
        userLocation: userLocation
      });

      setSearchResults(data);
    } catch (error) {
      console.error('❌ Erro na busca:', error);
      setSearchResults({
        query: searchTerm,
        detected_type: 'error',
        results: [],
        suggestions: ['Erro ao buscar. Tente novamente.']
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, userLocation]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Background simplificado */}
      <div className="absolute inset-0 z-0 bg-black" />

      {/* Mapa OpenStreetMap */}
      <div className="absolute inset-0 z-1">
        <iframe
          key={`map-${bbox}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&zoom=${zoomLevel}`}
          className="absolute inset-0"
          style={{
            filter: 'grayscale(80%) invert(96%) brightness(0.85) contrast(1.3)',
            opacity: 0.9,
            pointerEvents: 'none'
          }}
          loading="lazy"
        />
      </div>

      {/* Eventos overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* User marker */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40"
          style={{ left: `${userPosition.x}%`, top: `${userPosition.y}%` }}
        >
          <div
            className="w-6 h-6 rounded-full relative"
            style={{
              background: `radial-gradient(circle, ${vibeTheme.color}, ${vibeTheme.color}CC)`,
              border: `2px solid white`,
              boxShadow: `0 0 15px ${vibeTheme.color}`
            }}
          >
            <Navigation className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Event pins */}
        <AnimatePresence>
          {eventClusters.map((cluster, index) => {
            const position = coordToPosition(cluster.center.lat, cluster.center.lng);
            return (
              <EventPin
                key={`cluster-${index}-${cluster.events[0].id}`}
                cluster={cluster}
                position={position}
                onClick={handleClusterClick}
                theme={vibeTheme}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Button
            onClick={onOpenVibe}
            size="sm"
            className="px-3 py-2 h-9 bg-gray-900/80 backdrop-blur-xl border border-cyan-500/30 text-white"
          >
            <Music2 className="w-4 h-4 mr-1.5" />
            Vibes
          </Button>

          <Link to={createPageUrl("Feed")} className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-black/50 backdrop-blur-xl border border-gray-700 text-white"
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
              className="pl-10 pr-3 h-10 bg-black/60 backdrop-blur-xl border border-cyan-500/30 text-white placeholder:text-gray-500 text-sm rounded-lg"
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
        <div className="absolute bottom-20 right-3 z-30">
          <Button
            onClick={onOpenUpload}
            size="icon"
            className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Swipe up area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-3 px-4">
        <div className="flex flex-col items-center cursor-pointer" onClick={onSwipeUp}>
          <div 
            className="w-12 h-1.5 rounded-full mb-2 bg-gradient-to-r from-cyan-400 to-purple-400"
          />
          <Button
            className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 shadow-xl"
          >
            <Eye className="w-5 h-5 mr-2" />
            Ver Reels
          </Button>
        </div>
      </div>

      {/* Search Results Modal */}
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
              }
            }}
            isLoading={isSearching}
            userLocation={userLocation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}