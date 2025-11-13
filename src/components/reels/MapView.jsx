import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Menu, Search, MapPin, Navigation, Music2 } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SearchResults from "../map/SearchResults";
import { intelligentSearch } from "@/functions/intelligentSearch";
import useCurrentUser from "../shared/useCurrentUser";
import { EVENT_TYPE_COLORS } from "../shared/constants";
import { clusterEvents, getClusterVisualSize, getClusterColor } from "../shared/services/clusteringAlgorithm";

const EventPin = memo(({ cluster, position, onClick, theme }) => {
  const { events, isCluster: isClusterGroup, density = 1 } = cluster;
  const mainEvent = events[0];
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
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
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
            <div className="font-bold mb-1 flex items-center gap-1" style={{ color: eventColor }}>
              ⚡ {events.length} eventos
              {sizes.isHotspot && <span className="text-[9px] bg-white/20 px-1 rounded">🔥 HOT</span>}
            </div>
            <div className="text-[9px] text-gray-400">
              {cluster.dominantGenre} • {cluster.dominantType}
            </div>
            <div className="text-[9px] text-cyan-400 mt-1">
              Clique para expandir
            </div>
          </>
        ) : (
          <>
            <div className="font-bold mb-1" style={{ color: eventColor }}>
              {mainEvent.title}
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <MapPin className="w-3 h-3 text-purple-400" />
              <span className="truncate max-w-[120px]">{mainEvent.location.venue_name}</span>
            </div>
          </>
        )}
      </motion.div>

      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: sizes.glow,
          height: sizes.glow,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${eventColor}${Math.floor(glowIntensity * 50)} 0%, ${eventColor}${Math.floor(glowIntensity * 30)} 40%, transparent 70%)`,
          filter: 'blur(12px)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4 * glowIntensity, 0.8 * glowIntensity, 0.4 * glowIntensity]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: sizes.secondGlow,
          height: sizes.secondGlow,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle at center, ${eventColor}${Math.floor(glowIntensity * 40)} 0%, transparent 60%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.6, 1],
          opacity: [0.2 * glowIntensity, 0.5 * glowIntensity, 0.2 * glowIntensity]
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <motion.div
        className="relative"
        animate={{
          boxShadow: [
            `0 0 20px ${eventColor}, 0 0 40px ${eventColor}70`,
            `0 0 ${sizes.isHotspot ? '45px' : '35px'} ${eventColor}, 0 0 ${sizes.isHotspot ? '70px' : '60px'} ${eventColor}90`,
            `0 0 20px ${eventColor}, 0 0 40px ${eventColor}70`
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: `drop-shadow(0 0 ${isClusterGroup ? (sizes.isHotspot ? '20px' : '15px') : '10px'} ${eventColor})` }}
      >
        <div
          className={`${sizes.pin} rounded-full border-3 border-white/90 flex items-center justify-center relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${eventColor}, ${eventColor}CC)`,
            boxShadow: `0 0 20px ${eventColor}, inset 0 0 15px rgba(255,255,255,0.3)`
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
            }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {isClusterGroup ? (
            <div className="text-center z-10">
              <div className={`text-white font-bold ${sizes.fontSize}`}>
                {events.length}
              </div>
              {sizes.isHotspot && (
                <div className="text-[8px] text-yellow-300 font-bold leading-none">🔥</div>
              )}
            </div>
          ) : (
            <motion.div
              className="w-4 h-4 rounded-full bg-white z-10"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        <motion.div
          className="absolute inset-0 rounded-full border-2 pointer-events-none"
          style={{
            borderColor: eventColor,
            width: sizes.isHotspot ? '90px' : '70px',
            height: sizes.isHotspot ? '90px' : '70px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0, 0.6],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.cluster.events.length === next.cluster.events.length &&
    prev.position.x === next.position.x &&
    prev.position.y === next.position.y &&
    prev.cluster.density === next.cluster.density
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
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: user } = useCurrentUser();
  const canCreateReels = user && (user.is_pro_member || user.is_organizer);

  const screenDensity = useMemo(() => window.devicePixelRatio || 1, []);

  const vibeTheme = useMemo(() => {
    const themes = {
      'all': { glowColor: 'rgba(6, 182, 212, 0.9)', secondaryGlow: 'rgba(139, 92, 246, 0.7)', accentColor: '#06B6D4' },
      'dançar': { glowColor: 'rgba(236, 72, 153, 0.9)', secondaryGlow: 'rgba(168, 85, 247, 0.7)', accentColor: '#EC4899' },
      'relaxar': { glowColor: 'rgba(59, 130, 246, 0.9)', secondaryGlow: 'rgba(99, 102, 241, 0.7)', accentColor: '#3B82F6' },
      'socializar': { glowColor: 'rgba(168, 85, 247, 0.9)', secondaryGlow: 'rgba(236, 72, 153, 0.7)', accentColor: '#A855F7' },
      'adrenalina': { glowColor: 'rgba(249, 115, 22, 0.9)', secondaryGlow: 'rgba(239, 68, 68, 0.7)', accentColor: '#F97316' }
    };
    return themes[activeVibe] || themes['all'];
  }, [activeVibe]);

  const validEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    return events.filter(e => e?.id && e?.title && e?.location?.lat && e?.location?.lng);
  }, [events]);

  const eventClusters = useMemo(() => {
    return clusterEvents(validEvents, zoomLevel, screenDensity);
  }, [validEvents, zoomLevel, screenDensity]);

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

  const userPosition = useMemo(() => coordToPosition(userLocation.lat, userLocation.lng), [userLocation, coordToPosition]);

  const handleClusterClick = useCallback((cluster) => {
    if (cluster.isCluster) {
      setExpandedCluster(cluster);
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
    setSearchResults(null);

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

  const handleSearchKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleIntelligentSearch();
    }
  }, [handleIntelligentSearch]);

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
      </div>

      {/* Mapa OpenStreetMap */}
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

      <div className="absolute inset-0 pointer-events-none z-10">
        <motion.div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
          style={{ left: `${userPosition.x}%`, top: `${userPosition.y}%` }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.6 }}
        >
          <div className="relative flex items-center justify-center">
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
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              className="relative z-50"
              style={{
                filter: `drop-shadow(0 0 18px ${vibeTheme.glowColor}) drop-shadow(0 0 35px ${vibeTheme.glowColor}90)`,
              }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="w-6 h-6 rounded-full relative overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
                  border: `2.5px solid rgba(255, 255, 255, 1)`,
                  boxShadow: `0 0 20px ${vibeTheme.glowColor}, inset 0 0 18px rgba(255, 255, 255, 0.5)`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Navigation className="w-3 h-3 text-white" strokeWidth={3.5} />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

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

        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: vibeTheme.accentColor }} />
            <Input
              placeholder="Buscar eventos, artistas, locais..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-9 pr-3 py-2 backdrop-blur-xl border-2 text-white placeholder:text-gray-500 text-sm h-9 rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                borderColor: `${vibeTheme.glowColor}30`,
                boxShadow: `0 0 15px ${vibeTheme.glowColor}20`
              }}
            />
          </div>
          <Button
            onClick={handleIntelligentSearch}
            disabled={isSearching || !searchTerm || searchTerm.trim().length === 0}
            className="h-9 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            {isSearching ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

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
              boxShadow: `0 0 30px ${vibeTheme.glowColor}`
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
            <Plus className="w-6 h-6 relative z-10" />
          </Button>
        </motion.div>
      )}

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
            className="w-12 h-1.5 rounded-full mb-2"
            style={{
              background: `linear-gradient(to right, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              boxShadow: `0 0 15px ${vibeTheme.glowColor}`
            }}
            animate={{ scaleX: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <motion.button
            className="backdrop-blur-xl px-6 py-3 rounded-full shadow-xl border-2 flex items-center gap-2 text-sm font-semibold relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${vibeTheme.glowColor}, ${vibeTheme.secondaryGlow})`,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              boxShadow: `0 0 30px ${vibeTheme.glowColor}80`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
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

      <style jsx>{`
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.22; }
        }
      `}</style>
    </motion.div>
  );
}