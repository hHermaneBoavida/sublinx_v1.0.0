import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import LoadingSkeleton from "../components/feed/LoadingSkeleton";
import InfiniteScrollTrigger from "../components/feed/InfiniteScrollTrigger";

import { Search, Heart, Sparkles, TrendingUp, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { filterFutureEvents, sortEventsByDistance } from "../components/shared/helpers";
import { filterPublicEvents } from "../components/shared/eventValidation";
import { CACHE_CONFIG, queryKeys } from "../components/shared/optimizations";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "../components/providers/UserProvider";
import { useBatchOrganizers } from "../components/shared/useBatchOrganizers";
import { useSignalCapture } from "../components/resonance/SignalCapture";
import { useSearch } from "../components/search/SearchContext";


const EventFeedCard = lazy(() => import("../components/feed/EventFeedCard"));
const ShareVibeModal = lazy(() => import("../components/feed/ShareVibeModal"));

const EVENTS_PER_PAGE = 15;
const MAX_EVENTS_FOR_INTERACTIONS = 20; // OTIMIZAÇÃO: Limitar queries

export default function Feed() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [showShareVibe, setShowShareVibe] = useState(false);
  const [discoverTab, setDiscoverTab] = useState('personalized');
  const [showUnlockedGlow, setShowUnlockedGlow] = useState(new Set());
  const navigate = useNavigate();

  const userContext = useCurrentUser();
  const user = userContext?.user || null;
  const isLoadingUser = userContext?.isLoading ?? true;
  const isGuest = !isLoadingUser && !user;

  // Sistema de Ressonância - Captura passiva de sinais
  const { captureSilentConsumption, captureInteractionDepth } = useSignalCapture(user, {});

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
      
      const futureEvents = filterPublicEvents(filterFutureEvents(data));
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

  // Recomendações IA personalizadas (backend functions indisponíveis no plano atual)
  const { data: recommendations, isLoading: isLoadingRecs, refetch: refetchRecs } = useQuery({
    queryKey: ['personalizedRecommendations', user?.id],
    queryFn: async () => ({ personalized: [], popular: [], trending: [] }),
    enabled: false,
    staleTime: Infinity,
    initialData: { personalized: [], popular: [], trending: [] },
  });

  // OTIMIZAÇÃO CRÍTICA: Limitar eventos para query de interações
  const visibleEventIds = useMemo(() => {
    return events.slice(0, MAX_EVENTS_FOR_INTERACTIONS).map(e => e.id);
  }, [events]);

  const { data: interactions = { likes: {}, comments: {}, requests: {} } } = useQuery({
    queryKey: queryKeys.feedInteractions(user?.id, visibleEventIds.length),
    queryFn: async () => ({ likes: {}, comments: {}, requests: {} }),
    enabled: false,
    initialData: { likes: {}, comments: {}, requests: {} },
  });

  const sortedEvents = useMemo(() => {
    if (!events?.length) return [];
    return sortEventsByDistance([...events], user?.location);
  }, [events, user?.location]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery?.trim()) return sortedEvents;
    const lowerSearch = searchQuery.toLowerCase();
    return sortedEvents.filter(event =>
      event.title?.toLowerCase().includes(lowerSearch) ||
      event.genre?.toLowerCase().includes(lowerSearch) ||
      event.location?.venue_name?.toLowerCase().includes(lowerSearch) ||
      event.location?.city?.toLowerCase().includes(lowerSearch) ||
      event.organizer?.toLowerCase().includes(lowerSearch)
    );
  }, [sortedEvents, searchQuery]);

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
        {isGuest ? (
          <Button
            className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 h-10 text-sm font-semibold shadow-lg"
            onClick={() => navigate(createPageUrl("BemVindo"))}
          >
            <Heart className="w-4 h-4 mr-2" />
            Entrar para começar
          </Button>
        ) : (!user?.is_pro_member && !user?.is_organizer) ? (
          <Button
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 h-10 text-sm font-semibold shadow-lg"
            onClick={() => navigate(createPageUrl("Planos"))}
          >
            <Crown className="w-4 h-4 mr-2" />
            Assine para publicar eventos
          </Button>
        ) : (
          <Button
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 h-10 text-sm font-semibold shadow-lg"
            onClick={() => navigate(createPageUrl("CriarEvento"))}
          >
            <Heart className="w-4 h-4 mr-2" />
            Publicar Evento
          </Button>
        )}
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
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-gray-500 px-4 mb-4">
              {searchQuery ? "Tente ajustar sua busca" : "Ainda não há eventos futuros"}
            </p>
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