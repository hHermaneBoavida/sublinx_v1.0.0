
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventFeedCard from "../components/feed/EventFeedCard";
import EventCompactCard from "../components/feed/EventCompactCard";
import LoadingSkeleton from "../components/feed/LoadingSkeleton";
import ShareVibeModal from "../components/feed/ShareVibeModal";
import { Search, MapPin, Heart, RefreshCw, ExternalLink, TrendingUp, Sparkles, Crown, Zap, List, Grid as GridIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "../hooks/useDebounce";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { sortEventsByDistance } from "@/utils/geo";
import { logger } from "@/utils/logger";

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Feed() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showShareVibe, setShowShareVibe] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" ou "compact"
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ✅ DEBOUNCE: Esperar 400ms após última digitação
  const debouncedSearch = useDebounce(searchTerm, 400);

  // ✅ INFINITE SCROLL: Carregar 10 eventos por vez
  const { page, hasMore, setHasMore, observerTarget, pageSize } = useInfiniteScroll(10);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  const isGuest = !user;

  // Cache de 10 minutos para eventos FUTUROS apenas
  const { data: events = [], isLoading: isLoadingEvents, refetch } = useQuery({
    queryKey: ['feedEvents'],
    queryFn: async () => {
      const now = new Date();
      const data = await base44.entities.Event.list("-date", 100); // Buscar mais eventos
      
      return (data || []).filter(e => {
        if (!e?.id || !e?.title || !e?.location?.lat || !e?.location?.lng) return false;
        
        const eventDate = new Date(e.date);
        return eventDate >= now;
      });
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    initialData: [],
  });

  const { data: advertisements = [] } = useQuery({
    queryKey: ['feedAds'],
    queryFn: async () => {
      try {
        const now = new Date();
        const ads = await base44.entities.Advertisement.filter({
          is_active: true,
          placement: { $in: ['feed_top', 'feed_middle'] }
        }, "", 10);
        
        return (ads || []).filter(ad => {
          if (!ad || !ad.id) return false;
          
          if (ad.start_date) {
            const startDate = new Date(ad.start_date);
            if (now < startDate) return false;
          }
          
          if (ad.end_date) {
            const endDate = new Date(ad.end_date);
            if (now > endDate) return false;
          }
          
          return true;
        });
      } catch (error) {
        console.error('Erro ao buscar anúncios:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    initialData: [],
  });

  const { data: interactions = { likes: {}, comments: {}, requests: {} } } = useQuery({
    queryKey: ['feedInteractions', user?.id],
    queryFn: async () => {
      if (!user || events.length === 0) return { likes: {}, comments: {}, requests: {} };

      const eventIds = events.map(e => e.id);
      
      const [likesRes, commentsRes, requestsRes] = await Promise.allSettled([
        base44.entities.Like.filter({ event_id: { $in: eventIds } }),
        base44.entities.Comment.filter({ event_id: { $in: eventIds } }),
        base44.entities.EventRequest.filter({ user_id: user.id, event_id: { $in: eventIds } })
      ]);

      const likesData = likesRes.status === 'fulfilled' ? likesRes.value : [];
      const commentsData = commentsRes.status === 'fulfilled' ? commentsRes.value : [];
      const requestsData = requestsRes.status === 'fulfilled' ? requestsRes.value : [];

      return {
        likes: likesData.reduce((acc, like) => {
          if (!acc[like.event_id]) acc[like.event_id] = [];
          acc[like.event_id].push(like);
          return acc;
        }, {}),
        comments: commentsData.reduce((acc, comment) => {
          if (!acc[comment.event_id]) acc[comment.event_id] = [];
          acc[comment.event_id].push(comment);
          return acc;
        }, {}),
        requests: requestsData.reduce((acc, request) => {
          acc[request.event_id] = request.status;
          return acc;
        }, {})
      };
    },
    enabled: !!user && events.length > 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: { likes: {}, comments: {}, requests: {} },
  });

  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    if (!user?.location?.lat) {
      return [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // ✅ USAR UTILITÁRIO ao invés de código duplicado
    return sortEventsByDistance(events, user.location);
  }, [events, user?.location]);

  // ✅ USAR DEBOUNCED SEARCH ao invés de searchTerm direto
  const filteredEvents = useMemo(() => {
    if (!debouncedSearch) return sortedEvents;
    
    const lowerSearch = debouncedSearch.toLowerCase();
    return sortedEvents.filter(event =>
      event.title?.toLowerCase().includes(lowerSearch) ||
      event.genre?.toLowerCase().includes(lowerSearch) ||
      event.location?.venue_name?.toLowerCase().includes(lowerSearch) ||
      event.location?.city?.toLowerCase().includes(lowerSearch) ||
      event.organizer?.toLowerCase().includes(lowerSearch)
    );
  }, [sortedEvents, debouncedSearch]);

  const feedWithAds = useMemo(() => {
    if (!advertisements || advertisements.length === 0) {
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
      
      if ((index + 1) % 3 === 0 && middleAds.length > 0) {
        const adIndex = Math.floor(index / 3) % middleAds.length;
        const ad = middleAds[adIndex];
        if (ad?.id) {
          result.push({ type: 'ad', data: ad, key: `ad-middle-${ad.id}-${index}`, featured: true });
        }
      }
    });

    return result;
  }, [filteredEvents, advertisements]);

  // ✅ PAGINAÇÃO: Mostrar apenas eventos da página atual
  const paginatedFeed = useMemo(() => {
    const itemsToShow = page * pageSize;
    const items = feedWithAds.slice(0, itemsToShow);
    
    // Atualizar hasMore
    if (items.length >= feedWithAds.length) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
    
    return items;
  }, [feedWithAds, page, pageSize, setHasMore]);

  // ✅ PREFETCHING: Pré-carregar detalhes ao hover
  const handleEventHover = (eventId) => {
    // Prefetch das interações do evento
    queryClient.prefetchQuery({
      queryKey: ['eventDetails', eventId],
      queryFn: async () => {
        const [likes, comments] = await Promise.all([
          base44.entities.Like.filter({ event_id: eventId }),
          base44.entities.Comment.filter({ event_id: eventId })
        ]);
        return { likes, comments };
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleEventClick = (event) => {
    // Navegar para detalhes ou abrir modal
    console.log('📍 Evento clicado:', event.title);
    navigate(createPageUrl("Mapa"));
  };

  return (
    <div className="max-w-xl mx-auto px-0 py-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-gray-800/50 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
            Feed
          </h1>
          <div className="flex items-center gap-2">
            {/* Toggle View Mode */}
            <div className="flex items-center gap-1 bg-gray-800/80 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-7 w-7 ${viewMode === "grid" ? "bg-cyan-600 text-white" : "text-gray-400"}`}
              >
                <GridIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("compact")}
                className={`h-7 w-7 ${viewMode === "compact" ? "bg-cyan-600 text-white" : "text-gray-400"}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => refetch()}
              className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-cyan-500/20"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </Button>
            {isGuest && (
              <Button 
                onClick={() => navigate(createPageUrl("BemVindo"))}
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-xs h-8 px-3"
              >
                Entrar
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("Mapa"))} className="h-8 w-8 sm:h-9 sm:w-9">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </Button>
          </div>
        </div>

        {/* Search com Debounce */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar evento, gênero, local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-900/80 border-gray-700 pl-9 pr-3 text-white placeholder:text-gray-500 focus:border-cyan-500 text-sm h-9 rounded-lg"
          />
          {/* Indicador de Debounce */}
          {searchTerm !== debouncedSearch && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Info de Resultados */}
        {debouncedSearch && (
          <div className="mt-2 text-xs text-gray-400">
            {filteredEvents.length} resultado(s) para "{debouncedSearch}"
          </div>
        )}
      </div>

      {/* Share Vibe Button */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-gray-800/30">
        <Button
          className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 h-10 text-sm font-semibold shadow-lg"
          onClick={() => setShowShareVibe(true)}
          disabled={isGuest}
        >
          <Heart className="w-4 h-4 mr-2" />
          {isGuest ? "Entre para Compartilhar sua Vibe" : "Compartilhar Minha Vibe"}
        </Button>
      </div>

      {/* FEED COM PAGINAÇÃO */}
      <div className="space-y-0">
        {isLoadingEvents ? (
          <>
            <LoadingSkeleton />
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <LoadingSkeleton />
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <LoadingSkeleton />
          </>
        ) : paginatedFeed.length > 0 ? (
          <>
            {paginatedFeed.map((item, index) => {
              if (!item || !item.data || !item.key) return null;
              
              return (
                <React.Fragment key={item.key}>
                  {item.type === 'ad' ? (
                    <SponsoredAdCard ad={item.data} featured={item.featured} />
                  ) : viewMode === "compact" ? (
                    <EventCompactCard
                      event={item.data}
                      onClick={() => handleEventClick(item.data)}
                      onMouseEnter={() => handleEventHover(item.data.id)}
                    />
                  ) : (
                    <EventFeedCard
                      event={item.data}
                      user={user}
                      isGuest={isGuest}
                      initialLikes={interactions.likes[item.data.id] || []}
                      initialComments={interactions.comments[item.data.id] || []}
                      initialRequestStatus={interactions.requests[item.data.id] || null}
                      onMouseEnter={() => handleEventHover(item.data.id)}
                    />
                  )}
                  
                  {/* Separador */}
                  {index < paginatedFeed.length - 1 && (
                    <div className="relative h-[1px] bg-gradient-to-r from-transparent via-gray-800/50 to-transparent">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-[2px]" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div 
                ref={observerTarget}
                className="py-8 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm text-gray-400">Carregando mais eventos...</p>
                </div>
              </div>
            )}

            {/* Final do Feed */}
            {!hasMore && paginatedFeed.length > 0 && (
              <div className="py-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full text-sm text-gray-400">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Você viu todos os eventos disponíveis!</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 sm:py-16 bg-gray-900/50 rounded-lg border border-gray-700 mx-3 sm:mx-4 mt-4">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-sm sm:text-base text-gray-500 px-4 mb-4">
              {debouncedSearch 
                ? "Tente ajustar sua busca" 
                : "Ainda não há eventos futuros. Volte em breve!"}
            </p>
            {debouncedSearch && (
              <Button 
                onClick={() => setSearchTerm("")}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Limpar Busca
              </Button>
            )}
          </div>
        )}
      </div>

      {showShareVibe && (
        <ShareVibeModal
          onClose={() => setShowShareVibe(false)}
          user={user}
        />
      )}
    </div>
  );
}

// Componente de Anúncio Patrocinado
function SponsoredAdCard({ ad, featured = false }) {
  if (!ad || !ad.id) {
    console.warn('SponsoredAdCard: Anúncio inválido recebido');
    return null;
  }

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
      <div className="absolute top-2 left-2 z-10">
        <Badge className={`backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 shadow-lg ${
          featured 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-2 border-yellow-300 animate-pulse' 
            : 'bg-purple-600/90 text-white'
        }`}>
          {featured ? (
            <>
              <Sparkles className="w-3 h-3" />
              DESTAQUE PATROCINADO
            </>
          ) : (
            <>
              <TrendingUp className="w-3 h-3" />
              PATROCINADO
            </>
          )}
        </Badge>
      </div>

      {ad.impressions > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5">
            <Zap className="w-2.5 h-2.5 mr-0.5" />
            {ad.impressions > 999 ? `${Math.floor(ad.impressions / 1000)}k` : ad.impressions} views
          </Badge>
        </div>
      )}

      {ad.image_url && (
        <div className={`relative w-full overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
          <img
            src={ad.image_url}
            alt={ad.title || 'Anúncio'}
            className={`w-full h-full object-cover ${featured ? 'scale-105' : ''} transition-transform duration-500 hover:scale-110`}
          />
          <div className={`absolute inset-0 ${
            featured 
              ? 'bg-gradient-to-t from-yellow-900/80 via-purple-900/40 to-transparent' 
              : 'bg-gradient-to-t from-black/60 via-transparent to-transparent'
          }`} />
          
          {featured && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative">
                <Crown className="w-16 h-16 text-yellow-400 opacity-20 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-10 blur-2xl rounded-full" />
              </div>
            </div>
          )}
        </div>
      )}

      <CardContent className={`${featured ? 'p-5' : 'p-4'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className={`font-bold mb-2 ${featured ? 'text-xl text-yellow-300' : 'text-lg'}`}>
              {ad.title || 'Anúncio Patrocinado'}
            </h3>
            <p className={`text-gray-300 mb-3 ${featured ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'}`}>
              {ad.description || ''}
            </p>
            
            {ad.target_audience && (ad.target_audience.genres?.length > 0 || ad.target_audience.cities?.length > 0) && (
              <div className="flex flex-wrap gap-1 mb-3">
                {ad.target_audience.genres?.slice(0, 3).map(genre => (
                  <Badge key={genre} className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-[9px]">
                    {genre}
                  </Badge>
                ))}
                {ad.target_audience.cities?.slice(0, 2).map(city => (
                  <Badge key={city} className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-[9px]">
                    📍 {city}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-3 text-xs">
              <span className={featured ? 'text-yellow-400 font-semibold' : 'text-gray-400'}>
                {ad.advertiser_name || 'Anunciante'}
              </span>
              {ad.link_url && (
                <div className={`flex items-center gap-1 ${featured ? 'text-yellow-400' : 'text-cyan-400'}`}>
                  <ExternalLink className="w-3 h-3" />
                  <span className="font-semibold">Saiba mais</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
