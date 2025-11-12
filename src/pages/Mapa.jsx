
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
  const [userLocation, setUserLocation] = useState(null); // CORREÇÃO: null até obter localização real
  const [locationError, setLocationError] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationErrorMessage, setLocationErrorMessage] = useState(""); // NOVO: Mensagem de erro específica
  const [filters, setFilters] = useState({ genre: "all", type: "all" });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeVibe, setActiveVibe] = useState('all');
  const queryClient = useQueryClient();

  // CORREÇÃO: Obter localização REAL do usuário - SEM FALLBACK
  useEffect(() => {
    let isMounted = true;
    
    console.log("📍 [MAPA] Solicitando localização REAL do usuário...");
    
    if (!navigator.geolocation) {
      if (isMounted) {
        console.error("❌ [MAPA] Geolocalização não suportada");
        setLocationError(true);
        setLocationErrorMessage("Seu navegador não suporta geolocalização. Use um navegador moderno (Chrome, Firefox, Safari).");
        setLoadingLocation(false);
      }
      return;
    }

    // Solicitar localização com alta precisão
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted) {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("✅ [MAPA] Localização REAL obtida:", location);
          setUserLocation(location);
          setLocationError(false);
          setLocationErrorMessage("");
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("❌ [MAPA] Erro ao obter localização:", error);
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
        enableHighAccuracy: true, // CORREÇÃO: Usar alta precisão para localização real
        timeout: 10000,
        maximumAge: 0 // CORREÇÃO: Não usar cache, sempre pegar localização fresca
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
        console.log("✅ [MAPA] Localização REAL obtida (retry):", location);
        setUserLocation(location);
        setLocationError(false);
        setLocationErrorMessage("");
        setLoadingLocation(false);
      },
      (error) => {
        console.error("❌ [MAPA] Erro ao obter localização (retry):", error);
        
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

  // CORREÇÃO: Apenas carregar eventos se tiver localização real
  const { data: events = [], isLoading: isLoadingEvents, error: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['mapEvents', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) {
        console.log("⏳ [MAPA] Aguardando localização real do usuário...");
        return [];
      }

      try {
        console.log("🗺️ [MAPA] Carregando eventos próximos a:", userLocation);
        const startTime = performance.now();
        
        const now = new Date();
        const internalEvents = await base44.entities.Event.list('-date', 50);
        
        // Filtrar e validar eventos - raio de 10km da localização REAL
        const validEvents = (internalEvents || [])
          .filter(e => {
            if (!e?.id || !e?.title || !e?.location?.lat || !e?.location?.lng) {
              return false;
            }
            
            const eventDate = new Date(e.date);
            if (eventDate < now) {
              return false;
            }
            
            // Calcular distância da localização REAL do usuário
            const R = 6371;
            const dLat = (e.location.lat - userLocation.lat) * Math.PI / 180;
            const dLng = (e.location.lng - userLocation.lng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(e.location.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            
            return distance <= 10; // 10km de raio da localização real
          })
          .slice(0, 30);

        const endTime = performance.now();
        console.log(`✅ [MAPA] ${validEvents.length} eventos carregados em ${Math.round(endTime - startTime)}ms`);
        
        return validEvents;
      } catch (error) {
        console.error("❌ [MAPA] Erro ao carregar eventos:", error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    initialData: [],
    enabled: !!userLocation, // CORREÇÃO: Só buscar eventos se tiver localização real
  });

  // CORREÇÃO: Cache mais agressivo para reels
  const { data: reels = [], isLoading: isLoadingReels } = useQuery({
    queryKey: ['mapReels'],
    queryFn: async () => {
      try {
        console.log("🎬 [MAPA] Carregando reels...");
        const data = await base44.entities.Reel.list("-created_date", 30); // CORREÇÃO: Reduzido de 50 para 30
        console.log("✅ [MAPA] Reels carregados:", data?.length || 0);
        return data || [];
      } catch (error) {
        console.error("❌ [MAPA] Erro ao carregar reels:", error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000, // CORREÇÃO: 30 minutos
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    initialData: [],
  });

  // CORREÇÃO: Filtro simplificado e consistente
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    console.log("🔍 [MAPA] Filtrando eventos...", { 
      total: events.length, 
      filters, 
      searchTerm,
      activeVibe
    });
    
    const filtered = events.filter(event => {
      if (!event || !event.location) return false;
      
      // Filtros básicos
      const genreMatch = filters.genre === 'all' || event.genre === filters.genre;
      const typeMatch = filters.type === 'all' || event.type === filters.type;
      const searchMatch = searchTerm === '' || 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.genre?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // CORREÇÃO: Apenas um filtro de vibe unificado
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
    
    console.log(`✅ [MAPA] ${filtered.length} eventos após filtro (vibe: ${activeVibe})`);
    return filtered;
  }, [events, filters, searchTerm, activeVibe]);

  const handlePinClick = useCallback((eventId) => {
    console.log("📍 Pin clicado:", eventId);
    setSelectedEventId(eventId);
    setViewMode("reels");
  }, []);

  const handlePinDetailsClick = useCallback((event) => {
    console.log("ℹ️ Detalhes do evento:", event.title);
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
    console.log("🎛️ [MAPA] Aplicando filtros:", newFilters);
    // CORREÇÃO: Não incluir vibe aqui
    setFilters(prev => ({
      genre: newFilters.genre || prev.genre,
      type: newFilters.type || prev.type
    }));
    setShowFilterPanel(false);
  }, []);

  const handleVibeSelect = useCallback((vibe) => {
    console.log("💫 [MAPA] Vibe selecionada:", vibe);
    setActiveVibe(vibe); // CORREÇÃO: Apenas setar activeVibe
    setShowVibeSelector(false);
  }, []);

  const handleUploadComplete = useCallback(() => {
    setShowUploadModal(false);
    queryClient.invalidateQueries(["mapReels"]);
  }, [queryClient]);

  // Loading state
  if (loadingLocation) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black px-4">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-cyan-400 mb-4" />
        <p className="text-gray-300 text-sm sm:text-base mb-2 text-center">Obtendo sua localização real...</p>
        <p className="text-gray-500 text-xs sm:text-sm text-center max-w-md">
          📍 Por favor, permita o acesso à localização quando solicitado pelo navegador
        </p>
      </div>
    );
  }

  // Error state - SEM OPÇÃO DE USAR LOCALIZAÇÃO PADRÃO
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

            {/* Instruções para habilitar localização */}
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

  // Loading events
  if (isLoadingEvents || isLoadingReels) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-cyan-400 mb-4" />
        <p className="text-gray-300 text-sm sm:text-base">Carregando eventos...</p>
      </div>
    );
  }

  // Error state
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
            transition={{ duration: 0.2 }} // CORREÇÃO: Transição mais rápida
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
            transition={{ duration: 0.4, ease: "easeInOut" }} // CORREÇÃO: Transição mais rápida
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
            events={events} // Pass events to VibeSelector
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
