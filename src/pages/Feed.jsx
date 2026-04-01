import React, { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import LoadingSkeleton from "../components/feed/LoadingSkeleton";
import InfiniteScrollTrigger from "../components/feed/InfiniteScrollTrigger";
import SortControls, { SORT_OPTIONS } from "../components/feed/SortControls";
import { Search, Heart, RefreshCw, SlidersHorizontal, Sparkles, TrendingUp, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { filterFutureEvents, sortEventsByDistance } from "../components/shared/helpers";
import { CACHE_CONFIG, queryKeys } from "../components/shared/optimizations";
import { motion, AnimatePresence } from "framer-motion";
import SocialRecommendations from "../components/recommendations/SocialRecommendations";
import FeedAIRecommendations from "../components/recommendations/FeedAIRecommendations";
import { useCurrentUser } from "../components/providers/UserProvider";
import { useBatchOrganizers } from "../components/shared/useBatchOrganizers";
import { useSignalCapture } from "../components/resonance/SignalCapture";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const EventFeedCard = lazy(() => import("../components/feed/EventFeedCard"));
const ShareVibeModal = lazy(() => import("../components/feed/ShareVibeModal"));
const MusicPreferencesModal = lazy(() => import("../components/feed/MusicPreferencesModal"));

const EVENTS_PER_PAGE = 15;
const MAX_EVENTS_FOR_INTERACTIONS = 20; // OTIMIZAÇÃO: Limitar queries

export default function Feed() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showShareVibe, setShowShareVibe] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [discoverTab, setDiscoverTab] = useState('personalized');
  const [manualDiscoveryMode, setManualDiscoveryMode] = useState(false);
  const [showUnlockedGlow, setShowUnlockedGlow] = useState(new Set());
  const navigate = useNavigate();

  const userContext = useCurrentUser();
  const user = userContext?.user || null;
  const isGuest = !user;

  // Sistema de Ressonância - Captura passiva de sinais
  const { captureSilentConsumption, captureInteractionDepth } = useSignalCapture(user, {});

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data: eventsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingEvents,
    refetch
  } = useInfiniteQuery({
    queryKey: queryKeys.events(),
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * EVENTS_PER_PAGE;
      const limit = EVENTS_PER_PAGE;
      const data = await base44.entities.Event.list("-date", limit + offset);
      
      const futureEvents = filterFutureEvents(data);
      const pageEvents = futureEvents.slice(offset, offset + EVENTS_PER_PAGE);
      
      return {
        events: pageEvents,
        nextPage: futureEvents.length > offset + EVENTS_PER_PAGE ? pageParam + 1 : undefined,
        totalCount: futureEvents.length
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    ...CACHE_CONFIG.SHORT,
  });

  const events = useMemo(() => {
    if (!eventsData?.pages) return [];
    const allEvents = eventsData.pages.flatMap(page => page.events);
    // Deduplicate by ID to prevent duplicates during infinite scroll
    const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values());
    return uniqueEvents;
  }, [eventsData]);

  // Batch fetch organizers to avoid N+1 queries
  const { organizersMap } = useBatchOrganizers(events);

  const { data: advertisements = [] } = useQuery({
    queryKey: ['feedAds'],
    queryFn: async () => {
      try {
        const now = new Date();
        const ads = await base44.entities.Advertisement.filter({
          is_active: true,
          placement: { $in: ['feed_top', 'feed_middle'] }
        }, "", 5);
        
        return (ads || []).filter(ad => {
          if (!ad?.id) return false;
          if (ad.start_date && now < new Date(ad.start_date)) return false;
          if (ad.end_date && now > new Date(ad.end_date)) return false;
          return true;
        });
      } catch {
        return [];
      }
    },
    staleTime: 600000,
    gcTime: 1200000,
    initialData: [],
  });

  // Recomendações IA personalizadas
  const { data: recommendations, isLoading: isLoadingRecs, refetch: refetchRecs } = useQuery({
    queryKey: ['personalizedRecommendations', user?.id],
    queryFn: async () => {
      if (!user) return { personalized: [], popular: [], trending: [] };
      const response = await base44.functions.invoke('getPersonalizedRecommendations');
      return response.data;
    },
    enabled: !!user,
    staleTime: 300000, // 5min
    initialData: { personalized: [], popular: [], trending: [] },
  });

  // OTIMIZAÇÃO CRÍTICA: Limitar eventos para query de interações
  const visibleEventIds = useMemo(() => {
    return events.slice(0, MAX_EVENTS_FOR_INTERACTIONS).map(e => e.id);
  }, [events]);

  const { data: interactions = { likes: {}, comments: {}, requests: {} } } = useQuery({
    queryKey: queryKeys.feedInteractions(user?.id, visibleEventIds.length),
    queryFn: async () => {
      if (!user || visibleEventIds.length === 0) return { likes: {}, comments: {}, requests: {} };

      const response = await base44.functions.invoke('getFeedInteractionsOptimized', {
        event_ids: visibleEventIds // Apenas eventos visíveis
      });

      return response.data;
    },
    enabled: !!user && visibleEventIds.length > 0,
    ...CACHE_CONFIG.REALTIME,
    initialData: { likes: {}, comments: {}, requests: {} },
  });

  const sortedEvents = useMemo(() => {
    if (!events?.length) return [];

    let sorted = [...events];

    switch (sortBy) {
      case 'distance':
        sorted = sortEventsByDistance(sorted, user?.location);
        break;
      case 'date_asc':
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'date_desc':
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'popularity':
        sorted.sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0));
        break;
      case 'likes':
        sorted.sort((a, b) => {
          const likesA = interactions.likes[a.id]?.length || 0;
          const likesB = interactions.likes[b.id]?.length || 0;
          return likesB - likesA;
        });
        break;
      case 'price_asc':
        sorted.sort((a, b) => {
          const priceA = a.price || a.ticket_types?.[0]?.price || 0;
          const priceB = b.price || b.ticket_types?.[0]?.price || 0;
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        sorted.sort((a, b) => {
          const priceA = a.price || a.ticket_types?.[0]?.price || 0;
          const priceB = b.price || b.ticket_types?.[0]?.price || 0;
          return priceB - priceA;
        });
        break;
      default:
        sorted = sortEventsByDistance(sorted, user?.location);
    }

    return sorted;
  }, [events, sortBy, user?.location, interactions.likes]);

  const filteredEvents = useMemo(() => {
    let filtered = searchTerm 
      ? sortedEvents.filter(event => {
          const lowerSearch = searchTerm.toLowerCase();
          return event.title?.toLowerCase().includes(lowerSearch) ||
            event.genre?.toLowerCase().includes(lowerSearch) ||
            event.location?.venue_name?.toLowerCase().includes(lowerSearch) ||
            event.location?.city?.toLowerCase().includes(lowerSearch) ||
            event.organizer?.toLowerCase().includes(lowerSearch);
        })
      : sortedEvents;

    return filtered;
  }, [sortedEvents, searchTerm, manualDiscoveryMode]);

  // Captura de sinal de consumo silencioso ao visualizar feed
  React.useEffect(() => {
    if (!user || filteredEvents.length === 0) return;
    
    const timer = setTimeout(() => {
      captureSilentConsumption({
        event_count: filteredEvents.length,
        genre_distribution: filteredEvents.map(e => e.genre)
      });
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [user, filteredEvents.length]);

  // Detectar novos eventos desbloqueados (glow effect)
  React.useEffect(() => {
    if (!user || filteredEvents.length === 0) return;

    const currentEventIds = new Set(filteredEvents.map(e => e.id));
    const previousEventIds = new Set(events.slice(0, 50).map(e => e.id));
    
    const newUnlocked = [...currentEventIds].filter(id => !previousEventIds.has(id));
    
    if (newUnlocked.length > 0 && newUnlocked.length < 5) {
      setShowUnlockedGlow(new Set(newUnlocked));
      setTimeout(() => setShowUnlockedGlow(new Set()), 3000);
    }
  }, [filteredEvents.length, user]);

  const feedWithAds = useMemo(() => {
    if (!advertisements?.length) {
      return filteredEvents.map(event => ({ type: 'event', data: event, key: `event-${event.id}` }));
    }

    const result = [];
    const topAds = advertisements.filter(ad => ad?.placement === 'feed_top');
    const middleAds = advertisements.filter(ad => ad?.placement === 'feed_middle');

    topAds.forEach(ad => {
      if (ad?.id) {
        result.push({ type: 'ad', data: ad, key: `ad-top-${ad.id}`, featured: true });
      }
    });

    filteredEvents.forEach((event, index) => {
      if (event?.id) {
        result.push({ type: 'event', data: event, key: `event-${event.id}` });
      }
      
      if ((index + 1) % 5 === 0 && middleAds.length > 0) {
        const adIndex = Math.floor(index / 5) % middleAds.length;
        const ad = middleAds[adIndex];
        if (ad?.id) {
          result.push({ type: 'ad', data: ad, key: `ad-middle-${ad.id}-${index}`, featured: true });
        }
      }
    });

    return result;
  }, [filteredEvents, advertisements]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="max-w-xl mx-auto px-0 py-0">
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-gray-800/50 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
            Feed
          </h1>
          <div className="flex items-center gap-2">
            {!isGuest && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowPreferences(true)}
                className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-purple-500/20"
                title="Preferências Musicais"
              >
                <Music className="w-4 h-4 text-purple-400" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                refetch();
                if (!isGuest) refetchRecs();
              }}
              className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-cyan-500/20"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </Button>
            {isGuest && (
              <Button 
                onClick={() => navigate(createPageUrl("BemVindo"))}
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-purple-600 text-xs h-8 px-3"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar evento, gênero, local..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-gray-900/80 border-gray-700 pl-9 pr-3 text-white placeholder:text-gray-500 focus:border-cyan-500 text-sm h-9 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSortPanel(!showSortPanel)}
              className="h-8 px-2 text-xs text-cyan-400 hover:bg-cyan-500/10"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
              Ordenar
              {showSortPanel && <span className="ml-1">▼</span>}
            </Button>

            {sortBy !== 'distance' && (
              <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-[9px]">
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              </Badge>
            )}
          </div>

          {/* Modo Descoberta Manual */}
          {!isGuest && (
            <div className="flex items-center gap-2">
              <Switch 
                checked={manualDiscoveryMode}
                onCheckedChange={setManualDiscoveryMode}
                className="data-[state=checked]:bg-orange-500"
              />
              <Label htmlFor="manual-mode" className="text-xs text-gray-400 cursor-pointer">
                Descoberta Manual
              </Label>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showSortPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <SortControls 
                value={sortBy} 
                onChange={(value) => {
                  setSortBy(value);
                  setShowSortPanel(false);
                }} 
                hasLocation={!!user?.location}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Seção Descubra */}
      {!isGuest && (recommendations?.personalized?.length > 0 || recommendations?.popular?.length > 0) && (
        <div className="bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20 border-y border-purple-500/20 py-4 px-3 sm:px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Descubra
            </h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={discoverTab === 'personalized' ? 'default' : 'ghost'}
                onClick={() => setDiscoverTab('personalized')}
                className={`h-7 px-3 text-xs ${
                  discoverTab === 'personalized' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Para Você
              </Button>
              <Button
                size="sm"
                variant={discoverTab === 'trending' ? 'default' : 'ghost'}
                onClick={() => setDiscoverTab('trending')}
                className={`h-7 px-3 text-xs ${
                  discoverTab === 'trending' 
                    ? 'bg-cyan-600 hover:bg-cyan-700' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Em Alta
              </Button>
            </div>
          </div>

          {isLoadingRecs ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {(discoverTab === 'personalized' ? recommendations.personalized : recommendations.trending)
                .slice(0, 6)
                .map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-48"
                  >
                    <Card 
                      className="bg-gray-900/80 border-purple-500/30 hover:border-cyan-500/50 transition-all cursor-pointer group"
                      onClick={() => navigate(createPageUrl("EventoDetalhes") + `?id=${event.id}`)}
                    >
                      {event.image_url && (
                        <div className="relative h-32 overflow-hidden rounded-t-lg">
                          <img 
                            src={event.image_url} 
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-purple-600/90 backdrop-blur-sm text-xs">
                              {discoverTab === 'personalized' ? '✨ Recomendado' : '🔥 Em Alta'}
                            </Badge>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Badge variant="outline" className="text-xs">
                            {event.genre}
                          </Badge>
                          {event.current_attendees > 0 && (
                            <span className="text-cyan-400">
                              {event.current_attendees} 👥
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="px-3 sm:px-4 py-2.5 border-b border-gray-800/30">
        <Button
          className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 h-10 text-sm font-semibold shadow-lg"
          onClick={() => setShowShareVibe(true)}
          disabled={isGuest}
        >
          <Heart className="w-4 h-4 mr-2" />
          {isGuest ? "Entre para Compartilhar" : "Compartilhar Minha Vibe"}
        </Button>
      </div>

      <div className="space-y-0">
        {isLoadingEvents ? (
          <>
            <LoadingSkeleton />
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <LoadingSkeleton />
          </>
        ) : feedWithAds.length > 0 ? (
          <Suspense fallback={<LoadingSkeleton />}>
            {feedWithAds.map((item, index) => {
              if (!item?.data?.id && item.type !== 'ad') return null;

              const hasGlow = showUnlockedGlow.has(item.data?.id);

              return (
                <React.Fragment key={item.key}>
                  {item.type === 'ad' ? (
                    <SponsoredAdCard ad={item.data} featured={item.featured} />
                  ) : (
                    <motion.div
                      initial={hasGlow ? { scale: 0.98 } : false}
                      animate={hasGlow ? { 
                        scale: [0.98, 1.02, 1],
                        boxShadow: [
                          '0 0 0px rgba(6, 182, 212, 0)',
                          '0 0 20px rgba(6, 182, 212, 0.6)',
                          '0 0 0px rgba(6, 182, 212, 0)'
                        ]
                      } : {}}
                      transition={{ duration: 1.5 }}
                      className="rounded-lg"
                    >
                      <EventFeedCard
                        event={item.data}
                        user={user}
                        isGuest={isGuest}
                        organizer={organizersMap.get(item.data.organizer_id)}
                        initialLikes={interactions.likes[item.data.id] || []}
                        initialComments={interactions.comments[item.data.id] || []}
                        initialRequestStatus={interactions.requests[item.data.id] || null}
                        index={index}
                      />
                    </motion.div>
                  )}

                  {index < feedWithAds.length - 1 && (
                    <div className="relative h-[1px] bg-gradient-to-r from-transparent via-gray-800/50 to-transparent" />
                  )}
                </React.Fragment>
              );
            })}

            <InfiniteScrollTrigger
              onIntersect={handleLoadMore}
              isLoading={isFetchingNextPage}
              hasMore={hasNextPage}
            />
          </Suspense>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-gray-900/50 to-purple-900/20 rounded-lg border border-gray-700 mx-4 mt-4">
            {manualDiscoveryMode ? (
              <>
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Nenhum evento encontrado
                </h3>
                <p className="text-gray-500 px-4 mb-4">
                  {searchTerm ? "Tente ajustar sua busca" : "Ainda não há eventos futuros"}
                </p>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
                  Explorando Novos Horizontes
                </h3>
                <p className="text-gray-400 px-6 mb-4 max-w-md mx-auto text-sm">
                  O sistema está aprendendo suas preferências de forma silenciosa. Continue explorando e novos eventos aparecerão naturalmente.
                </p>
                <p className="text-gray-600 text-xs px-6 max-w-sm mx-auto">
                  💡 Dica: Quanto mais você navega sem forçar, mais o SUBLINX entende sua vibe
                </p>
                {!searchTerm && events.length > 0 && (
                  <Button
                    variant="outline"
                    className="mt-4 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => setManualDiscoveryMode(true)}
                  >
                    Ativar Descoberta Manual
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showShareVibe && (
        <Suspense fallback={null}>
          <ShareVibeModal
            onClose={() => setShowShareVibe(false)}
            user={user}
          />
        </Suspense>
      )}

      {showPreferences && user && (
        <Suspense fallback={null}>
          <MusicPreferencesModal
            user={user}
            onClose={() => setShowPreferences(false)}
            onSave={() => {
              refetchRecs();
            }}
          />
        </Suspense>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function SponsoredAdCard({ ad, featured = false }) {
  if (!ad?.id) return null;

  const handleAdClick = async () => {
    try {
      await base44.entities.Advertisement.update(ad.id, {
        clicks: (ad.clicks || 0) + 1,
        impressions: (ad.impressions || 0) + 1
      });
      
      if (ad.link_url) {
        window.open(ad.link_url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
    }
  };

  return (
    <Card 
      className={`border-0 text-white overflow-hidden cursor-pointer transition-all duration-300 ${
        featured 
          ? 'bg-gradient-to-br from-yellow-900/30 via-purple-900/40 to-pink-900/30 hover:from-yellow-900/40 hover:via-purple-900/50 hover:to-pink-900/40 shadow-lg shadow-yellow-500/10' 
          : 'bg-gradient-to-br from-purple-900/20 via-gray-900/80 to-cyan-900/20 hover:bg-purple-900/30'
      }`}
      onClick={handleAdClick}
    >
      {ad.image_url && (
        <div className={`relative w-full overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
          <img
            src={ad.image_url}
            alt={ad.title || 'Anúncio'}
            className={`w-full h-full object-cover ${featured ? 'scale-105' : ''} transition-transform duration-500 hover:scale-110`}
            loading="lazy"
          />
        </div>
      )}

      <CardContent className={`${featured ? 'p-5' : 'p-4'}`}>
        <h3 className={`font-bold mb-2 ${featured ? 'text-xl text-yellow-300' : 'text-lg'}`}>
          {ad.title || 'Anúncio Patrocinado'}
        </h3>
        <p className={`text-gray-300 mb-3 ${featured ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'}`}>
          {ad.description || ''}
        </p>
      </CardContent>
    </Card>
  );
}