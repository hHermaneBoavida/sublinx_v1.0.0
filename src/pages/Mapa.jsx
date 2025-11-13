import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import MapView from "../components/reels/MapView";
import ReelsView from "../components/reels/ReelsView";
import FilterPanel from "../components/map/FilterPanel";
import VibeSelector from "../components/map/VibeSelector";
import UploadReelModal from "../components/reels/UploadReelModal";
import EventDetailsModal from "../components/map/EventDetailsModal";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { filterFutureEvents, matchesVibe } from "../components/shared/helpers";

export default function Mapa() {
  const [viewMode, setViewMode] = useState("map");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showVibeSelector, setShowVibeSelector] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationErrorMessage, setLocationErrorMessage] = useState("");
  const [filters, setFilters] = useState({ genre: "all", type: "all" });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeVibe, setActiveVibe] = useState('all');
  const queryClient = useQueryClient();

  // CLEANUP: Limpar cache antigo ao montar
  useEffect(() => {
    try {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24h
      
      // Limpar analytics antigos
      const analytics = JSON.parse(localStorage.getItem('sublinx_search_analytics') || '{}');
      const cleaned = {};
      Object.entries(analytics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          cleaned[key] = value; // Manter formato antigo
        } else if (value.lastSearched && (now - new Date(value.lastSearched).getTime()) < maxAge) {
          cleaned[key] = value; // Manter se < 24h
        }
      });
      localStorage.setItem('sublinx_search_analytics', JSON.stringify(cleaned));
      
      // Limpar histórico antigo
      const history = JSON.parse(localStorage.getItem('sublinx_search_history') || '[]');
      localStorage.setItem('sublinx_search_history', JSON.stringify(history.slice(0, 20)));
      
      console.log('🧹 Cache limpo na inicialização');
    } catch (e) {
      console.error('Erro ao limpar cache:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    if (!navigator.geolocation) {
      if (isMounted) {
        setLocationError(true);
        setLocationErrorMessage("Seu navegador não suporta geolocalização.");
        setLoadingLocation(false);
      }
      return;
    }

    const handleSuccess = (position) => {
      if (isMounted) {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(false);
        setLoadingLocation(false);
      }
    };

    const handleError = (error) => {
      if (!isMounted) return;
      
      const errorMessages = {
        1: "Você negou acesso à localização. Permita nas configurações do navegador.",
        2: "Localização indisponível. Verifique o GPS.",
        3: "Tempo esgotado. Tente novamente.",
      };
      
      setLocationError(true);
      setLocationErrorMessage(errorMessages[error.code] || "Erro ao obter localização.");
      setLoadingLocation(false);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: false, // OTIMIZAÇÃO: Não precisa de alta precisão
      timeout: 8000,
      maximumAge: 5 * 60 * 1000 // OTIMIZAÇÃO: Cache 5min
    });

    return () => { isMounted = false; };
  }, []);

  const requestLocationAgain = useCallback(() => {
    setLoadingLocation(true);
    setLocationError(false);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationError(false);
        setLoadingLocation(false);
      },
      (error) => {
        setLocationError(true);
        setLocationErrorMessage("Erro ao obter localização.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  // OTIMIZAÇÃO: Query com cache longo e sem refetch agressivo
  const { data: events = [], isLoading: isLoadingEvents, error: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['mapEvents'],
    queryFn: async () => {
      const data = await base44.entities.Event.list('-date', 100);
      return filterFutureEvents(data);
    },
    staleTime: 5 * 60 * 1000, // 5min - OTIMIZADO
    cacheTime: 10 * 60 * 1000, // 10min
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    initialData: [],
    enabled: !!userLocation,
  });

  // OTIMIZAÇÃO: Reels com cache ainda mais longo
  const { data: reels = [], isLoading: isLoadingReels } = useQuery({
    queryKey: ['mapReels'],
    queryFn: async () => {
      const data = await base44.entities.Reel.list("-created_date", 30);
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10min
    cacheTime: 15 * 60 * 1000, // 15min
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    initialData: [],
  });

  // OTIMIZAÇÃO: useMemo com deps mínimas
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    return events.filter(event => {
      if (!event?.location) return false;
      
      const genreMatch = filters.genre === 'all' || event.genre === filters.genre;
      const typeMatch = filters.type === 'all' || event.type === filters.type;
      const vibeMatch = matchesVibe(event, activeVibe);
      
      // OTIMIZAÇÃO: Search apenas se tem termo (evitar toLowerCase desnecessário)
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const searchMatch = 
          event.title?.toLowerCase().includes(lower) ||
          event.location?.venue_name?.toLowerCase().includes(lower) ||
          event.genre?.toLowerCase().includes(lower);
        
        return genreMatch && typeMatch && searchMatch && vibeMatch;
      }
      
      return genreMatch && typeMatch && vibeMatch;
    });
  }, [events, filters.genre, filters.type, searchTerm, activeVibe]);

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
    setFilters(prev => ({
      genre: newFilters.genre || prev.genre,
      type: newFilters.type || prev.type
    }));
    setShowFilterPanel(false);
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
        <p className="text-gray-300 text-base mb-2">Obtendo localização...</p>
        <p className="text-gray-500 text-sm text-center max-w-md">
          📍 Permita acesso à localização
        </p>
      </div>
    );
  }

  if (locationError || !userLocation) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full bg-gray-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Localização Necessária
            </h2>
            <p className="text-base text-gray-300 mb-6">
              {locationErrorMessage || "Não foi possível obter sua localização."}
            </p>

            <Button 
              onClick={requestLocationAgain}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Tentar Novamente
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              🔒 Sua localização nunca é compartilhada
            </p>
          </div>
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

  if (eventsError) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black px-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-red-400 mb-4">Erro ao carregar eventos</p>
        <Button 
          onClick={() => refetchEvents()}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
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
              onSwipeUp={handleOpenReels}
              onOpenFilters={() => setShowFilterPanel(true)}
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