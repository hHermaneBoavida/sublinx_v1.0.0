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

  useEffect(() => {
    let isMounted = true;
    
    if (!navigator.geolocation) {
      if (isMounted) {
        setLocationError(true);
        setLocationErrorMessage("Seu navegador não suporta geolocalização. Use um navegador moderno (Chrome, Firefox, Safari).");
        setLoadingLocation(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted) {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setLocationError(false);
          setLocationErrorMessage("");
          setLoadingLocation(false);
        }
      },
      (error) => {
        if (isMounted) {
          let errorMsg = "";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Você negou o acesso à localização. Por favor, permita o acesso nas configurações do navegador.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Localização indisponível. Verifique se o GPS está ativado ou se você está em um local com sinal.";
              break;
            case error.TIMEOUT:
              errorMsg = "Tempo esgotado ao tentar obter sua localização. Tente novamente.";
              break;
            default:
              errorMsg = "Erro desconhecido ao obter localização. Tente novamente.";
          }
          
          setLocationError(true);
          setLocationErrorMessage(errorMsg);
          setLoadingLocation(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const requestLocationAgain = () => {
    setLoadingLocation(true);
    setLocationError(false);
    setLocationErrorMessage("");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setLocationError(false);
        setLocationErrorMessage("");
        setLoadingLocation(false);
      },
      (error) => {
        let errorMsg = "";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Você negou o acesso à localização. Por favor, permita o acesso nas configurações do navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Localização indisponível. Verifique se o GPS está ativado ou se você está em um local com sinal.";
            break;
          case error.TIMEOUT:
            errorMsg = "Tempo esgotado ao tentar obter sua localização. Tente novamente.";
            break;
          default:
            errorMsg = "Erro desconhecido ao obter localização. Tente novamente.";
        }
        
        setLocationError(true);
        setLocationErrorMessage(errorMsg);
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Carregar TODOS os eventos (sem limite de distância)
  const { data: events = [], isLoading: isLoadingEvents, error: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['mapEvents'],
    queryFn: async () => {
      if (!userLocation) {
        return [];
      }

      try {
        const now = new Date();
        const internalEvents = await base44.entities.Event.list('-date', 100);
        
        // Apenas validar campos e data futura
        const validEvents = (internalEvents || [])
          .filter(e => {
            if (!e?.id || !e?.title || !e?.location?.lat || !e?.location?.lng) {
              return false;
            }
            
            const eventDate = new Date(e.date);
            return eventDate >= now;
          });
        
        return validEvents;
      } catch (error) {
        console.error("❌ Erro ao carregar eventos:", error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    initialData: [],
    enabled: !!userLocation,
  });

  const { data: reels = [], isLoading: isLoadingReels } = useQuery({
    queryKey: ['mapReels'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Reel.list("-created_date", 30);
        return data || [];
      } catch (error) {
        console.error("❌ Erro ao carregar reels:", error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    initialData: [],
  });

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    const filtered = events.filter(event => {
      if (!event || !event.location) return false;
      
      const genreMatch = filters.genre === 'all' || event.genre === filters.genre;
      const typeMatch = filters.type === 'all' || event.type === filters.type;
      const searchMatch = searchTerm === '' || 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.genre?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let vibeMatch = true;
      if (activeVibe !== 'all') {
        const vibeGenres = {
          'dançar': ['techno', 'house', 'trance', 'drum_bass', 'dubstep', 'funk', 'trap', 'eletrônico'],
          'relaxar': ['ambient', 'experimental', 'minimal', 'jazz', 'blues', 'chill'],
          'socializar': ['samba', 'pagode', 'kizomba', 'kuduro', 'reggae', 'pop', 'rock', 'hiphop', 'sertanejo', 'forró'],
          'adrenalina': ['hardcore', 'acid', 'experimental', 'metal', 'punk']
        };
        
        const eventGenre = event.genre?.toLowerCase();
        const eventVibeTags = event.vibe_tags?.map(tag => tag.toLowerCase()) || [];

        const genreMatchVibe = vibeGenres[activeVibe]?.includes(eventGenre);
        const vibeTagMatch = eventVibeTags.includes(activeVibe.toLowerCase());
        
        vibeMatch = genreMatchVibe || vibeTagMatch;
      }
      
      return genreMatch && typeMatch && searchMatch && vibeMatch;
    });
    
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
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-cyan-400 mb-4" />
        <p className="text-gray-300 text-sm sm:text-base mb-2 text-center">Obtendo sua localização...</p>
        <p className="text-gray-500 text-xs sm:text-sm text-center max-w-md">
          📍 Por favor, permita o acesso à localização quando solicitado pelo navegador
        </p>
      </div>
    );
  }

  if (locationError || !userLocation) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black px-4">
        <div className="max-w-md w-full bg-gray-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 sm:p-8">
          <div className="text-center">
            <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Localização Necessária
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mb-4">
              {locationErrorMessage || "Não foi possível obter sua localização."}
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs sm:text-sm font-semibold text-blue-300 mb-2">
                💡 Como habilitar a localização:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold flex-shrink-0">1.</span>
                  <span>Clique no ícone 🔒 ou ⓘ ao lado da URL no navegador</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold flex-shrink-0">2.</span>
                  <span>Encontre "Permissões" ou "Configurações do site"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold flex-shrink-0">3.</span>
                  <span>Altere "Localização" para "Permitir"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold flex-shrink-0">4.</span>
                  <span>Clique em "Tentar Novamente" abaixo</span>
                </li>
              </ul>
            </div>

            <Button 
              onClick={requestLocationAgain}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-semibold text-sm sm:text-base mb-3"
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Tentar Novamente
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              🔒 Sua localização é usada apenas para mostrar eventos próximos e nunca é compartilhada
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingEvents || isLoadingReels) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-cyan-400 mb-4" />
        <p className="text-gray-300 text-sm sm:text-base">Carregando eventos...</p>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black px-4">
        <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mb-4" />
        <p className="text-red-400 mb-4 text-sm sm:text-base text-center">Erro ao carregar eventos</p>
        <button 
          onClick={() => refetchEvents()}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm sm:text-base"
        >
          Tentar Novamente
        </button>
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
            transition={{ 
              duration: 0.4,
              ease: [0.43, 0.13, 0.23, 0.96]
            }}
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
            transition={{ 
              duration: 0.5, 
              ease: [0.32, 0.72, 0, 1]
            }}
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