
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import MapView from "../components/reels/MapView";
import ReelsView from "../components/reels/ReelsView";
import FilterPanel from "../components/map/FilterPanel";
import VibeSelector from "../components/map/VibeSelector";
import UploadReelModal from "../components/reels/UploadReelModal";
import EventDetailsModal from "../components/map/EventDetailsModal";
import { Loader2, MapPin, AlertCircle, RefreshCw, Globe } from "lucide-react";
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
  const [filters, setFilters] = useState({ genre: "all", type: "all", verified: "all" }); // NOVO: Filtro de verificação
  const [searchTerm, setSearchTerm] = useState("");
  const [activeVibe, setActiveVibe] = useState('all');
  const [syncingExternal, setSyncingExternal] = useState(false); // NOVO: Estado de sync
  const queryClient = useQueryClient();

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

  // NOVO: Carregar eventos internos + externos simulados
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
        
        // 1. Carregar eventos internos (oficiais)
        const internalEvents = await base44.entities.Event.list('-date', 50);
        
        // 2. NOVO: Adicionar eventos externos simulados (normalmente viriam de syncExternalEvents)
        const externalEventsSimulated = generateNearbyExternalEvents(userLocation, 5);
        
        // 3. Combinar todos os eventos
        const allEvents = [...(internalEvents || []), ...externalEventsSimulated];
        
        // Filtrar e validar eventos - raio de 10km da localização REAL
        const validEvents = allEvents
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
          .slice(0, 40); // Aumentado de 30 para 40

        const endTime = performance.now();
        console.log(`✅ [MAPA] ${validEvents.length} eventos carregados em ${Math.round(endTime - startTime)}ms`);
        console.log(`   📊 Internos: ${internalEvents?.length || 0} | Externos: ${externalEventsSimulated.length}`);
        
        return validEvents;
      } catch (error) {
        console.error("❌ [MAPA] Erro ao carregar eventos:", error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000, // NOVO: Reduzido para 15min para refresh mais frequente
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true, // NOVO: Recarregar ao reconectar
    initialData: [],
    enabled: !!userLocation,
  });

  const { data: reels = [], isLoading: isLoadingReels } = useQuery({
    queryKey: ['mapReels'],
    queryFn: async () => {
      try {
        console.log("🎬 [MAPA] Carregando reels...");
        const data = await base44.entities.Reel.list("-created_date", 30);
        console.log("✅ [MAPA] Reels carregados:", data?.length || 0);
        return data || [];
      } catch (error) {
        console.error("❌ [MAPA] Erro ao carregar reels:", error);
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

  // MELHORADO: Filtro com verificação de evento oficial/externo
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
      
      // NOVO: Filtro de verificação
      const verifiedMatch = filters.verified === 'all' || 
        (filters.verified === 'verified' && event.verified_sublinx) ||
        (filters.verified === 'external' && !event.verified_sublinx && event.external_source);
      
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
      
      return genreMatch && typeMatch && searchMatch && vibeMatch && verifiedMatch;
    });
    
    console.log(`✅ [MAPA] ${filtered.length} eventos após filtro`);
    return filtered;
  }, [events, filters, searchTerm, activeVibe]);

  // NOVO: Estatísticas de eventos
  const eventStats = useMemo(() => {
    return {
      total: events.length,
      verified: events.filter(e => e.verified_sublinx).length,
      external: events.filter(e => !e.verified_sublinx && e.external_source).length,
      filtered: filteredEvents.length
    };
  }, [events, filteredEvents]);

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
    setFilters(prev => ({
      genre: newFilters.genre || prev.genre,
      type: newFilters.type || prev.type,
      verified: newFilters.verified || prev.verified // NOVO
    }));
    setShowFilterPanel(false);
  }, []);

  const handleVibeSelect = useCallback((vibe) => {
    console.log("💫 [MAPA] Vibe selecionada:", vibe);
    setActiveVibe(vibe);
    setShowVibeSelector(false);
  }, []);

  const handleUploadComplete = useCallback(() => {
    setShowUploadModal(false);
    queryClient.invalidateQueries(["mapReels"]);
  }, [queryClient]);

  // NOVO: Forçar refresh dos eventos
  const handleRefreshEvents = useCallback(async () => {
    setSyncingExternal(true);
    await refetchEvents();
    setTimeout(() => setSyncingExternal(false), 1000);
  }, [refetchEvents]);

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
      {/* NOVO: Info Bar com estatísticas */}
      <div className="absolute top-2 left-2 right-2 z-40 pointer-events-none">
        <div className="flex justify-between items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black/70 backdrop-blur-md rounded-lg px-3 py-1.5 border border-cyan-500/30 pointer-events-auto"
          >
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span className="text-white font-semibold">{eventStats.filtered}</span>
              <span className="text-gray-400">eventos</span>
              <div className="w-px h-3 bg-gray-600 mx-1" />
              <span className="text-cyan-400">{eventStats.verified}</span>
              <span className="text-gray-500">oficiais</span>
              <span className="text-purple-400">{eventStats.external}</span>
              <span className="text-gray-500">externos</span>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefreshEvents}
            disabled={syncingExternal}
            className="bg-black/70 backdrop-blur-md rounded-lg p-2 border border-gray-700/50 pointer-events-auto hover:border-cyan-500/50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${syncingExternal ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
            transition={{ duration: 0.4, ease: "easeInOut" }}
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
            currentFilters={filters}
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

// NOVO: Função para gerar eventos externos simulados próximos ao usuário
function generateNearbyExternalEvents(userLocation, count = 5) {
  const externalEvents = [];
  const genres = ['techno', 'house', 'trance', 'drum_bass', 'dubstep', 'ambient', 'funk'];
  const types = ['club', 'warehouse', 'rooftop', 'underground'];
  const sources = ['eventbrite', 'jambase', 'allevents'];
  
  for (let i = 0; i < count; i++) {
    // Gerar coordenadas próximas (dentro de 10km)
    const offsetLat = (Math.random() - 0.5) * 0.09; // ~10km
    const offsetLng = (Math.random() - 0.5) * 0.09;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);
    
    externalEvents.push({
      id: `external_${sources[i % sources.length]}_${Date.now()}_${i}`,
      title: `${['Underground', 'Secret', 'Hidden', 'Warehouse', 'Rooftop'][Math.floor(Math.random() * 5)]} ${genres[i % genres.length].toUpperCase()} Night`,
      description: `Evento ${sources[i % sources.length]} - Música eletrônica de qualidade`,
      genre: genres[i % genres.length],
      type: types[i % types.length],
      location: {
        lat: userLocation.lat + offsetLat,
        lng: userLocation.lng + offsetLng,
        address: `Rua Descoberta ${i + 1}, Bairro Underground`,
        venue_name: `${['Club', 'Warehouse', 'Loft', 'Bar'][i % 4]} ${i + 1}`,
        is_secret: false
      },
      date: futureDate.toISOString(),
      duration_hours: 6,
      price: Math.floor(Math.random() * 50) + 20,
      is_secret: false,
      organizer: `${sources[i % sources.length].toUpperCase()} Eventos`,
      organizer_id: `external_${sources[i % sources.length]}`,
      max_capacity: 200,
      current_attendees: Math.floor(Math.random() * 150),
      image_url: `https://picsum.photos/800/400?random=${Date.now()}_${i}`,
      vibe_tags: ['external', 'music', 'party'],
      requires_approval: false,
      minimum_level: 1,
      external_source: sources[i % sources.length],
      external_id: `ext_${Date.now()}_${i}`,
      verified_sublinx: false, // IMPORTANTE: Não verificado
      sync_date: new Date().toISOString()
    });
  }
  
  return externalEvents;
}
