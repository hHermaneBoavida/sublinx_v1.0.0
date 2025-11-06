
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import EventFeedCard from "../components/feed/EventFeedCard";
import LoadingSkeleton from "../components/feed/LoadingSkeleton";
import ShareVibeModal from "../components/feed/ShareVibeModal";
import { Search, MapPin, Heart, RefreshCw, ExternalLink, TrendingUp } from "lucide-react";

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
  const navigate = useNavigate();

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

  // Cache de 10 minutos para eventos
  const { data: events = [], isLoading: isLoadingEvents, refetch } = useQuery({
    queryKey: ['feedEvents'],
    queryFn: async () => {
      const data = await base44.entities.Event.list("-date", 30);
      return (data || []).filter(e => e?.id && e?.title && e?.location?.lat && e?.location?.lng);
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    initialData: [],
  });

  // Cache de 10 minutos para anúncios
  const { data: advertisements = [] } = useQuery({
    queryKey: ['feedAds'],
    queryFn: async () => {
      try {
        const ads = await base44.entities.Advertisement.filter({
          is_active: true,
          placement: { $in: ['feed_top', 'feed_middle'] }
        }, "", 5);
        return (ads || []).filter(ad => ad && ad.id); // CORREÇÃO: Filtrar ads inválidos
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
      return [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return [...events].sort((a, b) => {
      const distA = getDistance(user.location.lat, user.location.lng, a.location.lat, a.location.lng);
      const distB = getDistance(user.location.lat, user.location.lng, b.location.lat, b.location.lng);
      return distA - distB;
    });
  }, [events, user?.location]);

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return sortedEvents;
    
    const lowerSearch = searchTerm.toLowerCase();
    return sortedEvents.filter(event =>
      event.title?.toLowerCase().includes(lowerSearch) ||
      event.genre?.toLowerCase().includes(lowerSearch) ||
      event.location?.venue_name?.toLowerCase().includes(lowerSearch) ||
      event.location?.city?.toLowerCase().includes(lowerSearch) ||
      event.organizer?.toLowerCase().includes(lowerSearch)
    );
  }, [sortedEvents, searchTerm]);

  // Inserir anúncios no feed - CORREÇÃO: Validação completa
  const feedWithAds = useMemo(() => {
    if (!advertisements || advertisements.length === 0) {
      return filteredEvents.map(event => ({ type: 'event', data: event, key: `event-${event.id}` }));
    }

    const result = [];
    const topAds = advertisements.filter(ad => ad?.placement === 'feed_top');
    const middleAds = advertisements.filter(ad => ad?.placement === 'feed_middle');

    // Anúncio no topo
    if (topAds.length > 0 && topAds[0]?.id) {
      result.push({ type: 'ad', data: topAds[0], key: `ad-top-${topAds[0].id}` });
    }

    // Inserir eventos e anúncios no meio
    filteredEvents.forEach((event, index) => {
      if (event?.id) {
        result.push({ type: 'event', data: event, key: `event-${event.id}` });
      }
      
      // A cada 4 eventos, inserir um anúncio
      if ((index + 1) % 4 === 0 && middleAds.length > 0) {
        const adIndex = Math.floor(index / 4) % middleAds.length;
        const ad = middleAds[adIndex];
        if (ad?.id) {
          result.push({ type: 'ad', data: ad, key: `ad-middle-${ad.id}-${index}` });
        }
      }
    });

    return result;
  }, [filteredEvents, advertisements]);

  return (
    <div className="max-w-xl mx-auto px-0 py-0">
      {/* Header - MAIS COMPACTO */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-gray-800/50 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
            Feed
          </h1>
          <div className="flex items-center gap-2">
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

        {/* Search - MAIS COMPACTO */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar evento, gênero, local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-900/80 border-gray-700 pl-9 pr-3 text-white placeholder:text-gray-500 focus:border-cyan-500 text-sm h-9 rounded-lg"
          />
        </div>
      </div>

      {/* Share Vibe Button - MAIS COMPACTO */}
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

      {/* FEED IMERSIVO - SEM ESPAÇAMENTOS */}
      <div className="space-y-0">
        {isLoadingEvents ? (
          <>
            <LoadingSkeleton />
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <LoadingSkeleton />
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <LoadingSkeleton />
          </>
        ) : feedWithAds.length > 0 ? (
          feedWithAds.map((item, index) => {
            // CORREÇÃO: Validar item antes de renderizar
            if (!item || !item.data || !item.key) return null;
            
            return (
              <React.Fragment key={item.key}>
                {item.type === 'ad' ? (
                  <AdCard ad={item.data} />
                ) : (
                  <EventFeedCard
                    event={item.data}
                    user={user}
                    isGuest={isGuest}
                    initialLikes={interactions.likes[item.data.id] || []}
                    initialComments={interactions.comments[item.data.id] || []}
                    initialRequestStatus={interactions.requests[item.data.id] || null}
                  />
                )}
                
                {/* Separador Minimalista */}
                {index < feedWithAds.length - 1 && (
                  <div className="relative h-[1px] bg-gradient-to-r from-transparent via-gray-800/50 to-transparent">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-[2px]" />
                  </div>
                )}
              </React.Fragment>
            );
          })
        ) : (
          <div className="text-center py-12 sm:py-16 bg-gray-900/50 rounded-lg border border-gray-700 mx-3 sm:mx-4 mt-4">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-sm sm:text-base text-gray-500 px-4 mb-4">
              {searchTerm 
                ? "Tente ajustar sua busca" 
                : "Ainda não há eventos. Volte em breve!"}
            </p>
            {searchTerm && (
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

// Componente de Anúncio Patrocinado - CORREÇÃO: Validação completa
function AdCard({ ad }) {
  // CORREÇÃO: Validar ad antes de renderizar
  if (!ad || !ad.id) {
    console.warn('AdCard: Anúncio inválido recebido');
    return null;
  }

  const handleAdClick = async () => {
    try {
      // Registrar clique
      await base44.entities.Advertisement.update(ad.id, {
        clicks: (ad.clicks || 0) + 1
      });
      
      // Abrir link
      if (ad.link_url) {
        window.open(ad.link_url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
    }
  };

  return (
    <Card 
      className="bg-gradient-to-br from-purple-900/20 via-gray-900/80 to-cyan-900/20 border-0 text-white overflow-hidden cursor-pointer hover:bg-purple-900/30 transition-all"
      onClick={handleAdClick}
    >
      <div className="absolute top-2 left-2 z-10">
        <div className="bg-purple-600/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          PATROCINADO
        </div>
      </div>

      {ad.image_url && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={ad.image_url}
            alt={ad.title || 'Anúncio'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{ad.title || 'Anúncio Patrocinado'}</h3>
            <p className="text-sm text-gray-300 mb-3 line-clamp-2">{ad.description || ''}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{ad.advertiser_name || 'Anunciante'}</span>
              {ad.link_url && (
                <div className="flex items-center gap-1 text-cyan-400">
                  <ExternalLink className="w-3 h-3" />
                  <span>Saiba mais</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
