import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import MapView from "../components/map/MapView";
import ReelsView from "../components/reels/ReelsView";
import VibeSelector from "../components/map/VibeSelector";
import UploadReelModal from "../components/reels/UploadReelModal";
import EventDetailsModal from "../components/map/EventDetailsModal";
import VenueDetailsModal from "../components/map/VenueDetailsModal";
import { Loader2, MapPin, Sparkles, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { matchesVibe, calculateDistance, isValidCoord } from "../components/shared/helpers";
import { filterPublicEvents } from "../components/shared/eventValidation";

import { isWithinInterval, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import ErrorBoundary from "../components/shared/ErrorBoundary";
import GlobalSearch from "../components/search/GlobalSearch";
import { useSearch } from "../components/search/SearchContext";

export default function Mapa() {
  const [viewMode, setViewMode] = useState("map");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVibeSelector, setShowVibeSelector] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const { searchQuery: searchTerm, setSearchQuery: setSearchTerm } = useSearch();
  const [activeVibe, setActiveVibe] = useState('all');
  const [filters, setFilters] = useState({
    genre: 'all', type: 'all', dateRange: 'all',
    maxDistance: 50, minAttendees: 0, sortBy: 'distance'
  });
  const queryClient = useQueryClient();
  const mapCleanupRef = useRef(null);

  // Localização do usuário — sem bloquear o carregamento
  useEffect(() => {
    let isMounted = true;
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setLoadingLocation(false);
    }, 5000); // máx 5s de espera

    if (!navigator.geolocation) {
      clearTimeout(fallbackTimer);
      if (isMounted) setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(fallbackTimer);
        if (isMounted) {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLoadingLocation(false);
        }
      },
      () => {
        clearTimeout(fallbackTimer);
        if (isMounted) setLoadingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 5 * 60 * 1000 }
    );

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      if (mapCleanupRef.current) mapCleanupRef.current();
    };
  }, []);

  // Real-time events
  const [eventsRealtime, setEventsRealtime] = useState(null);
  const eventsDataRef = useRef(null);

  const { data: eventsData, isLoading: isLoadingEvents, error: eventsError } = useQuery({
    queryKey: ['mapEvents'],
    queryFn: async () => {
      let allEvents = [];
      try {
        allEvents = await base44.entities.Event.list("-date", 150);
      } catch (err) {
        allEvents = [];
      }
      if (!Array.isArray(allEvents)) allEvents = [];
      // Sem fallback fictício — se API retornar vazio, exibe estado vazio
      // Mostrar: em andamento agora + até 7 dias futuros + com atividade recente (até 48h passados)
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const valid = filterPublicEvents(allEvents.filter(e => {
        if (!e?.date) return false;
        try {
          const d = new Date(e.date);
          return !isNaN(d.getTime()) && d > cutoff;
        } catch { return false; }
      }));
      return { events: valid };
    },
    staleTime: 3 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  // Sincroniza eventsData → eventsRealtime (uma vez) e mantém ref atualizada
  useEffect(() => {
    if (eventsData?.events) {
      eventsDataRef.current = eventsData.events;
      setEventsRealtime(prev => prev === null ? eventsData.events : prev);
    }
  }, [eventsData]);

  // Abrir detalhes do evento via URL param (?event=ID)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    if (!eventId) return;
    const findAndOpen = async () => {
      try {
        const events = eventsData?.events || [];
        const found = events.find(e => e.id === eventId);
        if (found) {
          setSelectedEventForDetails(found);
          setShowEventDetails(true);
        } else {
          const all = await base44.entities.Event.filter({ id: eventId });
          if (all?.[0]) {
            setSelectedEventForDetails(all[0]);
            setShowEventDetails(true);
          }
        }
      } catch (e) {
        console.log('Erro ao abrir evento via URL:', e);
      }
    };
    findAndOpen();
    window.history.replaceState({}, '', window.location.pathname);
  }, [eventsData]);

  // Subscrição realtime de eventos
  useEffect(() => {
    const unsub = base44.entities.Event.subscribe((evt) => {
      setEventsRealtime(prev => {
        const current = prev ?? eventsDataRef.current ?? [];
        if (evt.type === 'create') {
          // Reaplicar política de publicação — eventos não publicáveis não entram no mapa
          if (!filterPublicEvents([evt.data]).length) return current;
          return [evt.data, ...current];
        }
        if (evt.type === 'update') {
          // Se o evento atualizado não for mais publicável, removê-lo do mapa
          if (!filterPublicEvents([evt.data]).length) {
            return current.filter(e => e.id !== evt.id);
          }
          return current.map(e => e.id === evt.id ? evt.data : e);
        }
        if (evt.type === 'delete') return current.filter(e => e.id !== evt.id);
        return current;
      });
    });
    return unsub;
  }, []);

  // Buscar venues — erros propagam para isError (NÃO mascarar como [])
  const {
    data: venuesData = [],
    isError: isVenuesError,
    error: venuesErrorObj,
    refetch: refetchVenues,
  } = useQuery({
    queryKey: ['mapVenues'],
    queryFn: async () => {
      const data = await base44.entities.Venue.list("", 500);
      if (!Array.isArray(data)) {
        const err = new Error('invalid_response');
        err.raw = data;
        throw err;
      }
      // Resposta parcial: descarta somente registros com coordenadas inválidas
      return data.filter(v => isValidCoord(v?.location?.lat, v?.location?.lng));
    },
    staleTime: 10 * 60 * 1000,
  });

  // Abrir detalhes do venue via URL param (?venue=ID)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const venueId = urlParams.get('venue');
    if (!venueId) return;
    const findAndOpenVenue = async () => {
      try {
        const found = (venuesData || []).find(v => v.id === venueId);
        if (found) {
          setSelectedVenue(found);
          setShowVenueDetails(true);
        } else {
          const all = await base44.entities.Venue.filter({ id: venueId });
          if (all?.[0]) {
            setSelectedVenue(all[0]);
            setShowVenueDetails(true);
          }
        }
      } catch (e) {
        console.log('Erro ao abrir venue via URL:', e);
      }
    };
    findAndOpenVenue();
    window.history.replaceState({}, '', window.location.pathname);
  }, [venuesData]);

  // Real-time reels
  const [reelsRealtime, setReelsRealtime] = useState([]);
  const { data: reelsFetched = [] } = useQuery({
    queryKey: ['mapReels'],
    queryFn: async () => {
      try {
        const allReels = (await base44.entities.Reel.list("-created_date", 200)) || [];
        const now = new Date();
        return allReels.filter(r => !r.expires_at || new Date(r.expires_at) > now);
      } catch { return []; }
    },
    staleTime: 2 * 60 * 1000,
    initialData: [],
  });

  // Sincroniza reels do fetch apenas uma vez (evita re-renders desnecessários)
  const reelsInitialized = useRef(false);
  useEffect(() => {
    if (!reelsInitialized.current && reelsFetched.length > 0) {
      reelsInitialized.current = true;
      setReelsRealtime(reelsFetched);
    }
  }, [reelsFetched]);

  useEffect(() => {
    const unsub = base44.entities.Reel.subscribe((evt) => {
      if (evt.type === 'create') setReelsRealtime(prev => [evt.data, ...prev]);
      else if (evt.type === 'update') setReelsRealtime(prev => prev.map(r => r.id === evt.id ? evt.data : r));
      else if (evt.type === 'delete') setReelsRealtime(prev => prev.filter(r => r.id !== evt.id));
    });
    return unsub;
  }, []);

  // eventsRealtime é null até os dados do fetch chegarem (evita mostrar vazio durante loading)
  const rawEvents = eventsRealtime ?? eventsData?.events ?? [];

  // Fallback de localização: usar coordenada do venue vinculado se evento não tiver lat/lng
  const events = useMemo(() => {
    return rawEvents.map(event => {
      if (event.location?.lat && event.location?.lng) return event;
      // Tentar achar venue pelo nome
      const venueName = (event.location?.venue_name || '').toLowerCase().trim();
      if (venueName) {
        const matchedVenue = venuesData.find(v => (v.name || '').toLowerCase().trim() === venueName);
        if (isValidCoord(matchedVenue?.location?.lat, matchedVenue?.location?.lng)) {
          return {
            ...event,
            location: {
              ...event.location,
              lat: matchedVenue.location.lat,
              lng: matchedVenue.location.lng,
            }
          };
        }
      }
      return event;
    }).filter(e => isValidCoord(e.location?.lat, e.location?.lng));
  }, [rawEvents, venuesData]);

  const effectiveLocation = userLocation || { lat: -23.5505, lng: -46.6333 };

  const filteredEvents = useMemo(() => {
    const effectiveMaxDistance = userLocation ? filters.maxDistance : 99999;
    if (!events || events.length === 0) return [];

    const applyFilters = (distanceFilter) => events.filter(event => {
      if (!event?.location) return false;
      const genreMatch = filters.genre === 'all' || event.genre === filters.genre;
      const typeMatch = filters.type === 'all' || event.type === filters.type;
      const vibeMatch = matchesVibe(event, activeVibe);

      let distanceMatch = true;
      if (distanceFilter && isValidCoord(event.location?.lat, event.location?.lng)) {
        const distance = calculateDistance(
          effectiveLocation.lat, effectiveLocation.lng,
          event.location.lat, event.location.lng
        );
        distanceMatch = distance <= effectiveMaxDistance;
      }

      const attendeesMatch = (event.current_attendees || 0) >= filters.minAttendees;

      let dateMatch = true;
      if (filters.dateRange !== 'all') {
        const eventDate = new Date(event.date);
        const today = new Date();
        switch (filters.dateRange) {
          case 'today': dateMatch = eventDate.toDateString() === today.toDateString(); break;
          case 'tomorrow':
            const tomorrow = addDays(today, 1);
            dateMatch = eventDate.toDateString() === tomorrow.toDateString();
            break;
          case 'week': dateMatch = isWithinInterval(eventDate, { start: startOfWeek(today), end: endOfWeek(today) }); break;
          case 'month': dateMatch = isWithinInterval(eventDate, { start: startOfMonth(today), end: endOfMonth(today) }); break;
        }
      }

      return genreMatch && typeMatch && vibeMatch && distanceMatch && attendeesMatch && dateMatch;
    });

    // Filtro de distância "soft": se zerar resultados, relembra sem filtro de distância
    let filtered = applyFilters(true);
    if (filtered.length === 0) {
      filtered = applyFilters(false);
    }

    if (filters.sortBy === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
        return distA - distB;
      });
    } else if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return filtered;
  }, [events, filters, activeVibe, userLocation, effectiveLocation]);

  const handlePinClick = useCallback((eventId) => {
    setSelectedEventId(eventId);
    setViewMode("reels");
  }, []);

  const handlePinDetailsClick = useCallback((event) => {
    setSelectedEventForDetails(event);
    setShowEventDetails(true);
  }, []);

  const handleVenueClick = useCallback((venue) => {
    setSelectedVenue(venue);
    setShowVenueDetails(true);
  }, []);

  const handleCloseReels = useCallback(() => {
    setViewMode("map");
    setSelectedEventId(null);
  }, []);

  const handleOpenReels = useCallback(() => setViewMode("reels"), []);
  const handleVibeSelect = useCallback((vibe) => { setActiveVibe(vibe); setShowVibeSelector(false); }, []);
  const handleUploadComplete = useCallback(() => {
    setShowUploadModal(false);
    queryClient.invalidateQueries(["mapReels"]);
  }, [queryClient]);

  if (loadingLocation) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900/20">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <Sparkles className="w-16 h-16 text-cyan-400 mb-4" />
        </motion.div>
        <p className="text-gray-300 mb-2 text-lg">Procurando a cena perto de você...</p>
        <p className="text-gray-500 text-sm">📍 Ativando localização</p>
      </div>
    );
  }

  if (isVenuesError) {
    const isInvalid = venuesErrorObj?.message === 'invalid_response';
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900/20 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-gray-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center"
        >
          <MapPin className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Erro ao Carregar</h2>
          <p className="text-gray-300 mb-6">
            {isInvalid
              ? 'Não foi possível interpretar os dados dos estabelecimentos.'
              : 'Não foi possível carregar os estabelecimentos. Verifique sua conexão.'}
          </p>
          <button onClick={() => refetchVenues()} className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 h-12 text-lg rounded-lg text-white font-semibold">
            Tentar Novamente
          </button>
        </motion.div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900/20 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-gray-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center"
        >
          <MapPin className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Erro ao Carregar</h2>
          <p className="text-gray-300 mb-6">Não foi possível carregar os eventos. Verifique sua conexão.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 h-12 text-lg rounded-lg text-white font-semibold">
            Tentar Novamente
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoadingEvents) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900/20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
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
                venues={venuesData}
                userLocation={effectiveLocation}
                onPinClick={handlePinClick}
                onPinDetailsClick={handlePinDetailsClick}
                onVenueClick={handleVenueClick}
                onOpenFilters={() => {}}
                onOpenVibe={() => setShowVibeSelector(true)}
                onOpenUpload={() => setShowUploadModal(true)}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                activeVibe={activeVibe}
                filters={filters}
                onFiltersChange={setFilters}
                suggestedEvents={[]}
                onMapReady={(cleanupFn) => { mapCleanupRef.current = cleanupFn; }}
                searchSlot={
                  <GlobalSearch
                    bare
                    onSelectEvent={handlePinDetailsClick}
                    onSelectVenue={handleVenueClick}
                  />
                }
              />

              {/* Botão Ver Reels */}
              <div className="fixed bottom-24 sm:bottom-28 left-0 right-0 z-[999] pointer-events-none flex justify-center">
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: 20 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
                  className="pointer-events-auto"
                >
                  <motion.button
                    whileHover={{ scale: 1.08, y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleOpenReels}
                    className="relative group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full blur-2xl"
                      animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full px-6 py-3 flex items-center gap-2.5 shadow-2xl border-2 border-white/40 overflow-hidden"
                      style={{ boxShadow: '0 10px 40px rgba(236, 72, 153, 0.6), inset 0 1px 0 rgba(255,255,255,0.4)' }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
                      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                        <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
                      </motion.div>
                      <span className="text-white font-bold text-base drop-shadow-lg">Ver Reels</span>
                    </motion.div>
                  </motion.button>
                </motion.div>
              </div>
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
              <ReelsView reels={reelsRealtime} events={events} initialEventId={selectedEventId} onClose={handleCloseReels} onSelectEvent={handlePinDetailsClick} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showVibeSelector && (
            <VibeSelector onClose={() => setShowVibeSelector(false)} onVibeSelect={handleVibeSelect} events={events} />
          )}
        </AnimatePresence>

        {showUploadModal && (
          <UploadReelModal onClose={() => setShowUploadModal(false)} onUploadComplete={handleUploadComplete} events={events} userLocation={userLocation} />
        )}

        {showEventDetails && selectedEventForDetails && (
          <EventDetailsModal
            event={selectedEventForDetails}
            onClose={() => { setShowEventDetails(false); setSelectedEventForDetails(null); }}
          />
        )}

        {showVenueDetails && selectedVenue && (
          <VenueDetailsModal
            venue={selectedVenue}
            onClose={() => { setShowVenueDetails(false); setSelectedVenue(null); }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}