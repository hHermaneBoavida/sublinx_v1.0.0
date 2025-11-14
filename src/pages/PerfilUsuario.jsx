import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Calendar, Share2, Crown, Award, Users, Ticket, Trophy, Instagram, 
  Twitter, CheckCircle, AlertCircle, Music, Heart, MessageCircle, Clock, Filter,
  Play, TrendingUp, Zap, Star, Target, Gift
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import FollowButton from "../components/profile/FollowButton";
import EventHistoryCard from "../components/profile/EventHistoryCard";
import ProfileAvatar from "../components/shared/ProfileAvatar";
import { CACHE_CONFIG } from "../components/shared/helpers";

export default function PerfilUsuario() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [eventFilter, setEventFilter] = useState('all'); // all, upcoming, past
  
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

  const { data: profileUser, isLoading, error } = useQuery({
    queryKey: ['profileUser', userId],
    queryFn: async () => {
      if (!userId) throw new Error("ID não fornecido");
      
      try {
        const users = await base44.entities.User.filter({ id: userId });
        
        if (!users || users.length === 0) {
          throw new Error("Usuário não encontrado");
        }
        
        return users[0];
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        throw error;
      }
    },
    enabled: !!userId,
    retry: 1,
    ...CACHE_CONFIG.MEDIUM,
  });

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
    queryFn: async () => {
      return await base44.entities.Event.list("-date", 100);
    },
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

      const activities = [
        ...likes.map(like => ({
          type: 'like',
          data: like,
          timestamp: like.created_date
        })),
        ...comments.map(comment => ({
          type: 'comment',
          data: comment,
          timestamp: comment.created_date
        }))
      ];

      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 15);
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
      case 'past':
        return userEvents.filter(e => isBefore(new Date(e.date), now));
      default:
        return userEvents;
    }
  }, [userEvents, eventFilter]);

  // Mock de playlists/artistas favoritos
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

  const isOwnProfile = currentUser?.id === userId;

  const followMutation = useMutation({
    mutationFn: async () => {
      // Será tratado pelo FollowButton, mas vamos notificar
      if (userId && currentUser) {
        await base44.entities.Notification.create({
          user_id: userId,
          type: 'new_follower',
          title: '👥 Novo seguidor!',
          message: `${currentUser.full_name || currentUser.email} começou a seguir você`,
          is_read: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['followers', userId]);
    }
  });

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
        alert('Link do perfil copiado!');
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      alert('Link do perfil copiado!');
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-red-500/30">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">ID não fornecido</h2>
            <p className="text-gray-400 mb-4">Não foi possível identificar o usuário</p>
            <Button onClick={() => navigate(createPageUrl("Feed"))}>
              Voltar ao Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-red-500/30">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Usuário não encontrado</h2>
            <p className="text-gray-400 mb-4">
              {error?.message || "Não foi possível carregar o perfil"}
            </p>
            <Button 
              onClick={() => navigate(createPageUrl("Feed"))}
              className="bg-gradient-to-r from-cyan-600 to-purple-600"
            >
              Voltar ao Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    followers: followers.length,
    following: following.length,
    events: userEvents.length,
    badges: userBadges.length,
    level: profileUser.underground_level || 1,
    xp: profileUser.experience_points || 0
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 md:pb-8">
      {/* Hero Header */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-purple-900/40 to-pink-900/40" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 2 === 0 ? '#06b6d4' : '#8b5cf6',
              boxShadow: `0 0 10px currentColor`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20"
        >
          <ProfileAvatar user={profileUser} stats={stats} size="lg" />
        </motion.div>

        <div className="absolute top-4 left-4 z-10">
          <Button
            onClick={() => navigate(-1)}
            size="icon"
            variant="ghost"
            className="bg-black/50 backdrop-blur-xl border border-gray-700 hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </div>

        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={handleShareProfile}
            size="icon"
            variant="ghost"
            className="bg-black/50 backdrop-blur-xl border border-cyan-500/30 hover:bg-cyan-600/20"
          >
            <Share2 className="w-5 h-5 text-cyan-400" />
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {profileUser.full_name}
          </h1>
          {profileUser.bio && (
            <p className="text-gray-400 max-w-md mx-auto mb-4">{profileUser.bio}</p>
          )}

          <div className="flex items-center justify-center gap-3 mb-4">
            <Badge className={`${
              profileUser.is_organizer 
                ? 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300'
                : profileUser.is_pro_member
                ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300'
                : 'bg-gray-700/20 border-gray-500/50 text-gray-400'
            }`}>
              <Crown className="w-3 h-3 mr-1" />
              {profileUser.is_organizer ? 'Organizador' : profileUser.is_pro_member ? 'Pro Member' : 'Membro'}
            </Badge>
            {profileUser.verified_organizer && (
              <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verificado
              </Badge>
            )}
          </div>

          {/* Social Links */}
          {profileUser.social_links && (
            <div className="flex items-center justify-center gap-3 mb-4">
              {profileUser.social_links.instagram && (
                <a href={profileUser.social_links.instagram} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="text-pink-400 hover:bg-pink-900/20">
                    <Instagram className="w-5 h-5" />
                  </Button>
                </a>
              )}
              {profileUser.social_links.twitter && (
                <a href={profileUser.social_links.twitter} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="text-blue-400 hover:bg-blue-900/20">
                    <Twitter className="w-5 h-5" />
                  </Button>
                </a>
              )}
            </div>
          )}

          {/* Follow Button */}
          {currentUser && currentUser.id !== userId && (
            <FollowButton
              targetUserId={userId}
              currentUserId={currentUser.id}
              size="lg"
            />
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card className="bg-gray-900/50 border-cyan-700/50 text-center">
            <CardContent className="p-4">
              <Users className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-white">{stats.followers}</div>
              <div className="text-xs text-gray-400">Seguidores</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-purple-700/50 text-center">
            <CardContent className="p-4">
              <Users className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-white">{stats.following}</div>
              <div className="text-xs text-gray-400">Seguindo</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-pink-700/50 text-center">
            <CardContent className="p-4">
              {profileUser.is_organizer ? (
                <Calendar className="w-5 h-5 text-pink-400 mx-auto mb-2" />
              ) : (
                <Ticket className="w-5 h-5 text-pink-400 mx-auto mb-2" />
              )}
              <div className="text-xl font-bold text-white">{stats.events}</div>
              <div className="text-xs text-gray-400">
                {profileUser.is_organizer ? 'Eventos' : 'Ingressos'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-yellow-700/50 text-center">
            <CardContent className="p-4">
              <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-white">{stats.badges}</div>
              <div className="text-xs text-gray-400">Badges</div>
            </CardContent>
          </Card>
        </div>

        {/* XP Bar */}
        <Card className="bg-gray-900/50 border-gray-700 mb-6 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Nível {stats.level}</span>
              <span className="text-sm font-bold text-cyan-400">{stats.xp} XP</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.xp % 1000) / 10}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {1000 - (stats.xp % 1000)} XP para o próximo nível
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="eventos" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900/80 border border-gray-700">
            <TabsTrigger value="eventos">
              {profileUser.is_organizer ? 'Eventos' : 'Histórico'}
            </TabsTrigger>
            <TabsTrigger value="badges">Conquistas</TabsTrigger>
            <TabsTrigger value="music">Música</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          {/* Eventos Tab */}
          <TabsContent value="eventos" className="space-y-3 mt-4">
            {/* Filtros */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-400" />
              <Button
                variant={eventFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEventFilter('all')}
                className={eventFilter === 'all' ? 'bg-cyan-600' : 'border-gray-600'}
              >
                Todos ({userEvents.length})
              </Button>
              <Button
                variant={eventFilter === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEventFilter('upcoming')}
                className={eventFilter === 'upcoming' ? 'bg-green-600' : 'border-gray-600'}
              >
                Próximos ({userEvents.filter(e => isAfter(new Date(e.date), new Date())).length})
              </Button>
              <Button
                variant={eventFilter === 'past' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEventFilter('past')}
                className={eventFilter === 'past' ? 'bg-purple-600' : 'border-gray-600'}
              >
                Passados ({userEvents.filter(e => isBefore(new Date(e.date), new Date())).length})
              </Button>
            </div>

            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <EventHistoryCard key={event.id} event={event} index={index} />
              ))
            ) : (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    Nenhum evento encontrado
                  </h3>
                  <p className="text-gray-500">
                    {eventFilter === 'upcoming' 
                      ? 'Nenhum evento futuro agendado'
                      : eventFilter === 'past'
                      ? 'Nenhum evento passado registrado'
                      : profileUser.is_organizer 
                        ? 'Este organizador ainda não criou eventos' 
                        : 'Este usuário ainda não participou de eventos'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="mt-4">
            {/* Badge Progress */}
            <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-white">Progresso de Conquistas</span>
                  </div>
                  <span className="text-yellow-400 font-bold">{stats.badges}/20</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.badges / 20) * 100}%` }}
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                  />
                </div>
              </CardContent>
            </Card>

            {userBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userBadges.map((badge, index) => {
                  const rarityConfig = {
                    comum: { color: 'from-gray-600 to-gray-700', glow: 'rgba(156, 163, 175, 0.5)' },
                    raro: { color: 'from-blue-600 to-cyan-600', glow: 'rgba(6, 182, 212, 0.6)' },
                    épico: { color: 'from-purple-600 to-pink-600', glow: 'rgba(168, 85, 247, 0.6)' },
                    lendário: { color: 'from-yellow-500 to-orange-600', glow: 'rgba(251, 191, 36, 0.8)' }
                  };

                  const config = rarityConfig[badge.rarity] || rarityConfig.comum;

                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <Card className={`bg-gradient-to-br ${config.color}/20 to-gray-900 border-2 relative overflow-hidden`}
                        style={{ borderColor: config.glow }}
                      >
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background: `radial-gradient(circle at 50% 0%, ${config.glow}, transparent 70%)`,
                            filter: 'blur(20px)',
                          }}
                          animate={{ opacity: [0.2, 0.4, 0.2] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        
                        <CardContent className="p-6 text-center relative z-10">
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}
                            style={{ boxShadow: `0 0 30px ${config.glow}` }}
                          >
                            <Award className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="font-bold text-white mb-1 text-sm">{badge.badge_name}</h3>
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{badge.badge_description}</p>
                          <Badge className={`bg-gradient-to-r ${config.color} text-white border-0 text-xs mb-2`}>
                            {badge.rarity}
                          </Badge>
                          {badge.earned_at && (
                            <p className="text-[10px] text-gray-500">
                              {format(new Date(badge.earned_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    Nenhuma conquista ainda
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Participe de eventos e ganhe badges exclusivos!
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl("Feed"))}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Explorar Eventos
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="mt-4">
            {/* Gêneros Favoritos */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 mb-4">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Music className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-white">Gêneros Favoritos</h3>
                </div>
                
                {favoriteGenres.length > 0 ? (
                  <div className="space-y-3">
                    {favoriteGenres.map((item, index) => (
                      <motion.div
                        key={item.genre}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center ${
                            index === 0 ? 'from-yellow-500 to-orange-500' :
                            index === 1 ? 'from-purple-500 to-pink-500' :
                            'from-cyan-500 to-blue-500'
                          }`}>
                            <span className="text-white font-bold text-sm">#{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white capitalize">{item.genre}</p>
                            <p className="text-xs text-gray-400">{item.count} evento{item.count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="w-24">
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / userEvents.length) * 100}%` }}
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">
                    Nenhum dado musical disponível ainda
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas Musicais */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-1">Evento Mais Curtido</p>
                  <p className="font-bold text-white text-sm">
                    {userEvents.length > 0 ? userEvents[0]?.genre || 'N/A' : 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-1">Gênero #1</p>
                  <p className="font-bold text-white text-sm capitalize">
                    {favoriteGenres[0]?.genre || 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Playlists do Usuário (Mock) */}
            {profileUser.is_organizer && (
              <Card className="bg-gray-900/50 border-gray-700 mt-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Play className="w-5 h-5 text-cyan-400" />
                      Playlists dos Eventos
                    </h3>
                  </div>
                  <p className="text-gray-400 text-sm text-center py-8">
                    🎵 Playlists disponíveis em breve!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Atividade Recente
                </h3>
                
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={`${activity.type}-${activity.data.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'like' 
                            ? 'bg-red-600/20' 
                            : 'bg-blue-600/20'
                        }`}>
                          {activity.type === 'like' ? (
                            <Heart className="w-5 h-5 text-red-400" />
                          ) : (
                            <MessageCircle className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            {activity.type === 'like' 
                              ? 'Curtiu um evento'
                              : 'Comentou em um evento'}
                          </p>
                          {activity.type === 'comment' && activity.data.content && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                              "{activity.data.content}"
                            </p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            {format(new Date(activity.timestamp), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Nenhuma atividade recente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}