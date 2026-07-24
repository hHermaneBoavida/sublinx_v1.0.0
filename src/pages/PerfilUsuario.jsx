import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Calendar, Share2, Crown, Award, Music, Clock, Heart, MessageCircle, CheckCircle, AlertCircle, MapPin, Ticket, Trophy, Users
} from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import FollowButton from "../components/profile/FollowButton";
import { CACHE_CONFIG, DEFAULT_AVATAR } from "../components/shared/helpers";
import OrganizerRating from "../components/reviews/OrganizerRating";
import { useSignalCapture } from "../components/resonance/SignalCapture";
import DirectMessageModal from "../components/chat/DirectMessageModal";

export default function PerfilUsuario() {
  const location = useLocation();
  const navigate = useNavigate();
  const [eventFilter, setEventFilter] = useState('all');
  const [viewStartTime] = useState(Date.now());
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get('id');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
    ...CACHE_CONFIG.STATIC,
  });

  const { captureArtistProfileView, captureOrganizerPattern } = useSignalCapture(currentUser, {
    profile_user_id: userId
  });

  const { data: profileUser, isLoading, error } = useQuery({
    queryKey: ['profileUser', userId],
    queryFn: async () => {
      if (!userId) throw new Error("ID não fornecido");
      const users = await base44.entities.User.filter({ id: userId });
      const found = users?.[0];
      if (!found) throw new Error("Usuário não encontrado");
      return found;
    },
    enabled: !!userId,
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Capturar visualização de perfil — after profileUser is declared
  useEffect(() => {
    if (!currentUser || !profileUser) return;
    return () => {
      const duration = (Date.now() - viewStartTime) / 1000;
      if (duration > 5) {
        captureArtistProfileView(duration, {
          organizer_id: profileUser.is_organizer ? userId : null,
          is_organizer: profileUser.is_organizer
        });
      }
    };
  }, [currentUser?.id, profileUser?.id, viewStartTime]);

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await base44.entities.Follow.filter({ following_id: userId });
    },
    enabled: !!userId,
    ...CACHE_CONFIG.SHORT,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await base44.entities.Follow.filter({ follower_id: userId });
    },
    enabled: !!userId,
    ...CACHE_CONFIG.SHORT,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['allEventsForProfile'],
    queryFn: async () => await base44.entities.Event.list("-date", 100),
    ...CACHE_CONFIG.MEDIUM,
  });

  const { data: userTickets = [] } = useQuery({
    queryKey: ['userTickets', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await base44.entities.Ticket.filter({ user_id: userId }, "-created_date");
    },
    enabled: !!userId && !!profileUser && !profileUser.is_organizer,
    ...CACHE_CONFIG.MEDIUM,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await base44.entities.UserBadge.filter({ user_id: userId });
    },
    enabled: !!userId,
    ...CACHE_CONFIG.LONG,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['userActivity', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const [likes, comments] = await Promise.all([
        base44.entities.Like.filter({ user_id: userId }, "-created_date", 10),
        base44.entities.Comment.filter({ user_id: userId }, "-created_date", 10)
      ]);

      return [
        ...likes.map(like => ({ type: 'like', data: like, timestamp: like.created_date })),
        ...comments.map(comment => ({ type: 'comment', data: comment, timestamp: comment.created_date }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);
    },
    enabled: !!userId,
    ...CACHE_CONFIG.SHORT,
  });

  const userEvents = useMemo(() => {
    if (!profileUser || !allEvents) return [];
    
    if (profileUser.is_organizer) {
      return allEvents.filter(e => e.organizer_id === userId);
    } else {
      const eventIds = userTickets.map(t => t.event_id);
      return allEvents.filter(e => eventIds.includes(e.id));
    }
  }, [profileUser, allEvents, userId, userTickets]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    switch (eventFilter) {
      case 'upcoming':
        return userEvents.filter(e => isAfter(new Date(e.date), now));
      case 'active':
        return userEvents.filter(e => {
          const eventDate = new Date(e.date);
          const endDate = new Date(eventDate.getTime() + (e.duration_hours || 8) * 60 * 60 * 1000);
          return !isAfter(eventDate, now) && isAfter(endDate, now);
        });
      case 'past':
        return userEvents.filter(e => {
          const eventDate = new Date(e.date);
          const endDate = new Date(eventDate.getTime() + (e.duration_hours || 8) * 60 * 60 * 1000);
          return isBefore(endDate, now);
        });
      default:
        return userEvents;
    }
  }, [userEvents, eventFilter]);

  const favoriteGenres = useMemo(() => {
    if (!userEvents || userEvents.length === 0) return [];
    
    const genreCounts = userEvents.reduce((acc, event) => {
      const genre = event.genre || 'outros';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));
  }, [userEvents]);

  const handleShareProfile = async () => {
    const profileUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${profileUser.full_name}`,
          text: `Confira o perfil de ${profileUser.full_name} no SUBLINX!`,
          url: profileUrl
        });
      } catch (err) {
        navigator.clipboard.writeText(profileUrl);
        alert('Link copiado!');
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      alert('Link copiado!');
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">ID não fornecido</h2>
          <Button onClick={() => navigate(createPageUrl("Feed"))} className="mt-4 bg-cyan-600 hover:bg-cyan-700">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Usuário não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl("Feed"))} className="mt-4 bg-cyan-600 hover:bg-cyan-700">
            Voltar ao Feed
          </Button>
        </div>
      </div>
    );
  }

  const stats = {
    followers: followers.length,
    following: following.length,
    events: userEvents.length,
    badges: userBadges.length,
    level: profileUser.underground_level || 1,
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 md:pb-8">
      {/* Header Clean */}
      <div className="border-b border-gray-800 sticky top-0 bg-black z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate(createPageUrl('Feed'));
              }}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <h1 className="text-lg font-semibold">{profileUser.full_name}</h1>
            
            <Button
              onClick={handleShareProfile}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-900"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-start gap-6 mb-6">
          {/* Avatar Simples */}
          <div className="relative flex-shrink-0">
            <img
              src={profileUser.avatar_url || DEFAULT_AVATAR}
              alt={profileUser.full_name}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-800"
            />
            {(profileUser.is_pro_member || profileUser.is_organizer) && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-black">
                <Crown className="w-3 h-3 text-black" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold">{stats.events}</div>
                <div className="text-sm text-gray-400">
                  {profileUser.is_organizer ? 'eventos' : 'ingressos'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{stats.followers}</div>
                <div className="text-sm text-gray-400">seguidores</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{stats.following}</div>
                <div className="text-sm text-gray-400">seguindo</div>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              <p className="font-semibold mb-1">{profileUser.full_name}</p>
              {profileUser.bio && (
                <p className="text-sm text-gray-300">{profileUser.bio}</p>
              )}
              
              {/* Badges */}
              <div className="flex items-center gap-2 mt-2">
                {profileUser.is_organizer && (
                  <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">
                    Organizador
                  </Badge>
                )}
                {profileUser.verified_organizer && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-xs text-gray-500">Nível {stats.level}</span>
              </div>
            </div>

            {/* Follow + Message Buttons */}
            {currentUser && currentUser.id !== userId && (
              <div className="mt-4 flex gap-2">
                <FollowButton
                  targetUserId={userId}
                  currentUserId={currentUser.id}
                  targetUserName={profileUser?.full_name}
                  size="default"
                  className="flex-1 font-semibold shadow-lg border border-cyan-400/60 transition-all duration-300 hover:scale-105"
                  style={{ boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)' }}
                />
                <Button
                  onClick={() => setShowMessageModal(true)}
                  variant="outline"
                  size="default"
                  className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/20 hover:border-cyan-400"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensagem
                </Button>
              </div>
            )}
          </div>
        </div>

        {profileUser.is_organizer && (
          <div className="mb-6">
            <OrganizerRating organizerId={profileUser.id} />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="eventos" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-black border-b border-gray-800 rounded-none h-auto p-0">
            <TabsTrigger 
              value="eventos" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-3"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="badges" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-3"
            >
              <Trophy className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger 
              value="music" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-3"
            >
              <Music className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Música</span>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-3"
            >
              <Clock className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Atividade</span>
            </TabsTrigger>
          </TabsList>

          {/* Eventos */}
           <TabsContent value="eventos" className="mt-4">
             <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
               <Button
                 variant={eventFilter === 'all' ? 'default' : 'ghost'}
                 size="sm"
                 onClick={() => setEventFilter('all')}
                 className={eventFilter === 'all' ? 'bg-cyan-600 hover:bg-cyan-700 font-semibold text-white' : 'text-gray-400 hover:text-cyan-300'}
               >
                 Todos
               </Button>
               <Button
                 variant={eventFilter === 'upcoming' ? 'default' : 'ghost'}
                 size="sm"
                 onClick={() => setEventFilter('upcoming')}
                 className={eventFilter === 'upcoming' ? 'bg-cyan-600 hover:bg-cyan-700 font-semibold text-white' : 'text-gray-400 hover:text-cyan-300'}
               >
                 Próximos
               </Button>
               <Button
                 variant={eventFilter === 'active' ? 'default' : 'ghost'}
                 size="sm"
                 onClick={() => setEventFilter('active')}
                 className={eventFilter === 'active' ? 'bg-green-600 hover:bg-green-700 font-semibold text-white' : 'text-gray-400 hover:text-green-300'}
               >
                 Ativos
               </Button>
               <Button
                 variant={eventFilter === 'past' ? 'default' : 'ghost'}
                 size="sm"
                 onClick={() => setEventFilter('past')}
                 className={eventFilter === 'past' ? 'bg-gray-600 hover:bg-gray-700 font-semibold text-white' : 'text-gray-400 hover:text-gray-300'}
               >
                 Passados
               </Button>
             </div>

            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="aspect-square bg-gray-900 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(createPageUrl("Mapa") + `?event=${event.id}`)}
                  >
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Calendar className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Nenhum evento encontrado</p>
              </div>
            )}
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges" className="mt-4">
            {userBadges.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {userBadges.map((badge) => {
                  const rarityColors = {
                    comum: 'border-gray-600',
                    raro: 'border-blue-500',
                    épico: 'border-purple-500',
                    lendário: 'border-yellow-500'
                  };

                  return (
                    <div
                      key={badge.id}
                      className={`aspect-square border-2 ${rarityColors[badge.rarity] || 'border-gray-600'} rounded-lg p-4 flex flex-col items-center justify-center bg-gray-900`}
                    >
                      <Award className="w-8 h-8 text-cyan-400 mb-2" />
                      <p className="text-xs text-center font-semibold text-white line-clamp-2">{badge.badge_name}</p>
                      <Badge variant="outline" className="text-[10px] mt-2 border-gray-700 text-gray-400">
                        {badge.rarity}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Nenhum badge conquistado</p>
              </div>
            )}
          </TabsContent>

          {/* Music */}
          <TabsContent value="music" className="mt-4">
            {favoriteGenres.length > 0 ? (
              <div className="space-y-2">
                {favoriteGenres.map((item, index) => (
                  <div key={item.genre} className="flex items-center justify-between p-3 bg-gray-900 rounded border border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold capitalize text-sm">{item.genre}</p>
                        <p className="text-xs text-gray-500">{item.count} evento{item.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {Math.round((item.count / userEvents.length) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Nenhum dado musical</p>
              </div>
            )}
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="mt-4">
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.data.id}`}
                    className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-800"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'like' ? 'bg-red-600/20' : 'bg-blue-600/20'
                    }`}>
                      {activity.type === 'like' ? (
                        <Heart className="w-4 h-4 text-red-400" />
                      ) : (
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {activity.type === 'like' ? 'Curtiu um evento' : 'Comentou'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(activity.timestamp), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Nenhuma atividade recente</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showMessageModal && currentUser && profileUser && (
        <DirectMessageModal
          recipientUser={profileUser}
          currentUser={currentUser}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}