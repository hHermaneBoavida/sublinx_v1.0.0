import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import MapView from "../components/map/MapView";
import ReelsView from "../components/reels/ReelsView";
import FilterPanel from "../components/map/FilterPanel";
import VibeSelector from "../components/map/VibeSelector";
import UploadReelModal from "../components/reels/UploadReelModal";
import EventDetailsModal from "../components/map/EventDetailsModal";
import AdvancedFilters from "../components/map/AdvancedFilters";
import { Loader2, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { matchesVibe } from "../components/shared/helpers";

export default function Mapa() {
  const [viewMode, setViewMode] = useState("map");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showVibeSelector, setShowVibeSelector] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeVibe, setActiveVibe] = useState('all');
  const [filters, setFilters] = useState({ 
    genre: "all", 
    type: "all",
    dateRange: "all",
    maxDistance: 50,
    minPopularity: 0,
    sortBy: "distance"
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;
    
    if (!navigator.geolocation) {
      if (isMounted) {
        setLocationError(true);
        setLoadingLocation(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted) {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(false);
          setLoadingLocation(false);
        }
      },
      (error) => {
        if (isMounted) {
          setLocationError(true);
          setLoadingLocation(false);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000
      }
    );

    return () => { isMounted = false; };
  }, []);

  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['nearbyEvents', userLocation?.lat, userLocation?.lng, filters.maxDistance],
    queryFn: async () => {
      const response = await base44.functions.invoke('searchEventsByRadius', {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius_km: filters.maxDistance,
        limit: 100
      });
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!userLocation,
    retry: 2
  });

  const events = eventsData?.events || [];

  const { data: reels = [], isLoading: isLoadingReels } = useQuery({
    queryKey: ['mapReels'],
    queryFn: async () => {
      const data = await base44.entities.Reel.list("-created_date", 20);
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
    cacheTime: 45 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: [],
  });

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    let filtered = events.filter(event => {
      if (!event?.location) return false;
      
      // Filtros básicos
      const genreMatch = filters.genre === 'all' || event.genre === filters.genre;
      const typeMatch = filters.type === 'all' || event.type === filters.type;
      const vibeMatch = matchesVibe(event, activeVibe);
      
      // Filtro de data
      let dateMatch = true;
      if (filters.dateRange !== 'all') {
        const eventDate = new Date(event.date);
        const now = new Date();
        
        if (filters.dateRange === 'today') {
          dateMatch = eventDate.toDateString() === now.toDateString();
        } else if (filters.dateRange === 'week') {
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          dateMatch = eventDate >= now && eventDate <= weekFromNow;
        } else if (filters.dateRange === 'month') {
          const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          dateMatch = eventDate >= now && eventDate <= monthFromNow;
        } else if (filters.dateRange === 'weekend') {
          const day = eventDate.getDay();
          dateMatch = day === 0 || day === 5 || day === 6;
        }
      }
      
      // Filtro de popularidade
      const popularity = event.current_attendees || 0;
      const popularityMatch = popularity >= filters.minPopularity;
      
      // Busca por texto
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const searchMatch = 
          event.title?.toLowerCase().includes(lower) ||
          event.location?.venue_name?.toLowerCase().includes(lower) ||
          event.genre?.toLowerCase().includes(lower);
        
        return genreMatch && typeMatch && searchMatch && vibeMatch && dateMatch && popularityMatch;
      }
      
      return genreMatch && typeMatch && vibeMatch && dateMatch && popularityMatch;
    });

    // Ordenação
    if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (filters.sortBy === 'popularity') {
      filtered.sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0));
    } else if (filters.sortBy === 'price') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    return filtered;
  }, [events, filters, searchTerm, activeVibe]);

  const handlePinClick = useCallback((eventId) => {
    setSelectedEventId(eventId);
    setViewMode("reels");
  }, []);

  const handlePinDetailsClick = useCallback((event) => {
    setSelectedEventForDetails(event);
    setShowEventDetails(true);
  }, []);

  const handleCloseReels = useCallback(() => {
    setViewMode("map");
    setSelectedEventId(null);
  }, []);

  const handleOpenReels = useCallback(() => {
    setViewMode("reels");
  }, []);
  
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleVibeSelect = useCallback((vibe) => {
    setActiveVibe(vibe);
    setShowVibeSelector(false);
  }, []);

  const handleUploadComplete = useCallback(() => {
    setShowUploadModal(false);
    queryClient.invalidateQueries(["mapReels"]);
  }, [queryClient]);

  if (loadingLocation) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black px-4">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mb-4" />
        <p className="text-gray-300 mb-2">Obtendo localização...</p>
        <p className="text-gray-500 text-sm text-center">
          📍 Permita acesso à localização
        </p>
      </div>
    );
  }

  if (locationError || !userLocation) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md bg-gray-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
          <MapPin className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Localização Necessária
          </h2>
          <p className="text-gray-300 mb-6">
            Permita acesso à localização para ver eventos próximos
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingEvents || isLoadingReels) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mb-4" />
        <p className="text-gray-300">Carregando eventos...</p>
      </div>
    );
  }

  const activeFiltersCount = [
    filters.genre !== 'all',
    filters.type !== 'all',
    filters.dateRange !== 'all',
    filters.maxDistance !== 50,
    filters.minPopularity > 0,
    activeVibe !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* Active Filters Badge */}
      {activeFiltersCount > 0 && (
        <div className="absolute top-20 left-4 z-[999] flex gap-2">
          <Badge className="bg-purple-600/90 backdrop-blur-xl flex items-center gap-2">
            <SlidersHorizontal className="w-3 h-3" />
            {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilters({
                genre: "all",
                type: "all",
                dateRange: "all",
                maxDistance: 50,
                minPopularity: 0,
                sortBy: "distance"
              });
              setActiveVibe('all');
            }}
            className="h-6 px-2 text-xs text-red-400 hover:bg-red-500/10"
          >
            Limpar
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10"
          >
            <MapView 
              events={filteredEvents} 
              userLocation={userLocation}
              onPinClick={handlePinClick} 
              onPinDetailsClick={handlePinDetailsClick}
              onSwipeUp={handleOpenReels}
              onOpenFilters={() => setShowFilterPanel(true)}
              onOpenAdvancedFilters={() => setShowAdvancedFilters(true)}
              onOpenVibe={() => setShowVibeSelector(true)}
              onOpenUpload={() => setShowUploadModal(true)}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activeVibe={activeVibe}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {viewMode === "reels" && (
          <motion.div
            key="reels"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 z-20"
          >
            <ReelsView
              reels={reels}
              events={events}
              initialEventId={selectedEventId}
              onClose={handleCloseReels}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFilterPanel && (
          <FilterPanel 
            onClose={() => setShowFilterPanel(false)}
            onApplyFilters={handleApplyFilters}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdvancedFilters && (
          <AdvancedFilters
            filters={filters}
            onChange={handleApplyFilters}
            onClose={() => setShowAdvancedFilters(false)}
            eventsCount={filteredEvents.length}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVibeSelector && (
          <VibeSelector
            onClose={() => setShowVibeSelector(false)}
            onVibeSelect={handleVibeSelect}
            events={events}
          />
        )}
      </AnimatePresence>

      {showUploadModal && (
        <UploadReelModal
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
          events={events}
          userLocation={userLocation}
        />
      )}

      {showEventDetails && selectedEventForDetails && (
        <EventDetailsModal
          event={selectedEventForDetails}
          onClose={() => {
            setShowEventDetails(false);
            setSelectedEventForDetails(null);
          }}
        />
      )}
    </div>
  );
}