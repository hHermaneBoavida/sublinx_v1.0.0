import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import MapView from "../components/map/MapView";
import ReelsView from "../components/reels/ReelsView";
import VibeSelector from "../components/map/VibeSelector";
import UploadReelModal from "../components/reels/UploadReelModal";
import EventDetailsModal from "../components/map/EventDetailsModal";
import { Loader2, MapPin, Sparkles, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { matchesVibe } from "../components/shared/helpers";
import { isWithinInterval, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import ErrorBoundary from "../components/shared/ErrorBoundary";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function Mapa() {
  const [viewMode, setViewMode] = useState("map");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [showVibeSelector, setShowVibeSelector] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeVibe, setActiveVibe] = useState('all');
  const [filters, setFilters] = useState({
    genre: 'all',
    type: 'all',
    dateRange: 'all',
    maxDistance: 50,
    minAttendees: 0,
    sortBy: 'distance'
  });
  const queryClient = useQueryClient();
  const mapCleanupRef = useRef(null);

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

    return () => { 
      isMounted = false;
      if (mapCleanupRef.current) {
        mapCleanupRef.current();
      }
    };
  }, []);

  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['nearbyEvents', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      try {
        const allEvents = await base44.entities.Event.list("-date", 100);
        
        const futureEvents = allEvents.filter(e => {
          if (!e?.date) return false;
          const eventDate = new Date(e.date);
          return eventDate > new Date();
        });

        return { events: futureEvents };
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        return { events: [] };
      }
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!userLocation,
    retry: 2,
    initialData: { events: [] }
  });

  const events = eventsData?.events || [];

  const { data: reels = [], isLoading: isLoadingReels } = useQuery({
    queryKey: ['mapReels'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Reel.list("-created_date", 20);
        return data || [];
      } catch (error) {
        console.error("Erro ao carregar reels:", error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000,
    initialData: [],
  });

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    let filtered = events.filter(event => {
      if (!event?.location) return false;
      
      const genreMatch = filters.genre === 'all' || event.genre === filters.genre;
      const typeMatch = filters.type === 'all' || event.type === filters.type;
      const vibeMatch = matchesVibe(event, activeVibe);

      let distanceMatch = true;
      if (userLocation) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          event.location.lat,
          event.location.lng
        );
        distanceMatch = distance <= filters.maxDistance;
      }

      const attendeesMatch = (event.current_attendees || 0) >= filters.minAttendees;

      let dateMatch = true;
      if (filters.dateRange !== 'all') {
        const eventDate = new Date(event.date);
        const today = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            dateMatch = eventDate.toDateString() === today.toDateString();
            break;
          case 'tomorrow':
            const tomorrow = addDays(today, 1);
            dateMatch = eventDate.toDateString() === tomorrow.toDateString();
            break;
          case 'week':
            dateMatch = isWithinInterval(eventDate, {
              start: startOfWeek(today),
              end: endOfWeek(today)
            });
            break;
          case 'month':
            dateMatch = isWithinInterval(eventDate, {
              start: startOfMonth(today),
              end: endOfMonth(today)
            });
            break;
        }
      }

      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const searchMatch = 
          event.title?.toLowerCase().includes(lower) ||
          event.location?.venue_name?.toLowerCase().includes(lower) ||
          event.genre?.toLowerCase().includes(lower);
        
        return genreMatch && typeMatch && searchMatch && vibeMatch && distanceMatch && attendeesMatch && dateMatch;
      }
      
      return genreMatch && typeMatch && vibeMatch && distanceMatch && attendeesMatch && dateMatch;
    });

    if (filters.sortBy === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
        return distA - distB;
      });
    } else if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (filters.sortBy === 'popularity') {
      filtered.sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0));
    }

    return filtered;
  }, [events, filters, searchTerm, activeVibe, userLocation]);

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
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900/20">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-16 h-16 text-cyan-400 mb-4" />
        </motion.div>
        <p className="text-gray-300 mb-2 text-lg">Procurando a cena perto de você...</p>
        <p className="text-gray-500 text-sm">📍 Ativando localização</p>
      </div>
    );
  }

  if (locationError || !userLocation) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900/20 px-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-gray-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center"
        >
          <MapPin className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Localização Necessária
          </h2>
          <p className="text-gray-300 mb-6">
            Permita acesso à localização para descobrir eventos próximos
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 h-12 text-lg rounded-lg text-white font-semibold"
          >
            <MapPin className="w-5 h-5 mr-2 inline" />
            Tentar Novamente
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoadingEvents || isLoadingReels) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900/20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-16 h-16 text-cyan-400 mb-4" />
        </motion.div>
        <p className="text-gray-300 text-lg">Carregando eventos...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-screen bg-black overflow-hidden relative">
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
                onOpenFilters={() => {}}
                onOpenVibe={() => setShowVibeSelector(true)}
                onOpenUpload={() => setShowUploadModal(true)}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                activeVibe={activeVibe}
                suggestedEvents={[]}
                onMapReady={(cleanupFn) => {
                  mapCleanupRef.current = cleanupFn;
                }}
              />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[999]"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenReels}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full blur-xl opacity-60 group-hover:opacity-80" />
                  
                  <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full px-5 py-2.5 flex items-center gap-2 shadow-xl border border-white/30">
                    <Play className="w-4 h-4 text-white fill-white" />
                    <span className="text-white font-semibold text-sm">Ver Reels</span>
                  </div>
                </motion.button>
              </motion.div>
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
    </ErrorBoundary>
  );
}