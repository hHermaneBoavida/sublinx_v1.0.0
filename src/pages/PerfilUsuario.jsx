import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Crown, Calendar, MapPin, Music, Heart,
  MessageCircle, Grid, Users, Share2, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import FollowButton from "../components/profile/FollowButton";
import EventHistoryCard from "../components/profile/EventHistoryCard";

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const [currentUser, setCurrentUser] = useState(null);

  const userImage = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png";

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }
  };

  // BUSCAR DADOS DO USUÁRIO - CORREÇÃO: Usar abordagem que respeita permissões
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) throw new Error("ID não fornecido");

      console.log("🔍 Buscando usuário:", userId);
      
      try {
        // Tentar buscar eventos do organizador (público)
        const events = await base44.entities.Event.filter({ organizer_id: userId });
        
        if (events && events.length > 0) {
          const firstEvent = events[0];
          console.log("✅ Dados extraídos de eventos");
          
          return {
            id: userId,
            full_name: firstEvent.organizer || "Organizador",
            avatar_url: firstEvent.organizer_avatar || userImage,
            is_organizer: true,
            bio: "Organizador de eventos na cena underground",
            music_preferences: [],
            underground_level: 1,
            location: { city: "São Paulo" },
            events_count: events.length,
            is_public_profile: true
          };
        }

        // Buscar via tickets
        const tickets = await base44.entities.Ticket.filter({ user_id: userId });
        
        if (tickets && tickets.length > 0) {
          console.log("✅ Usuário encontrado via tickets");
          
          return {
            id: userId,
            full_name: "Usuário Sublinx",
            avatar_url: userImage,
            is_organizer: false,
            bio: "Entusiasta da cena underground",
            music_preferences: [],
            underground_level: 1,
            location: { city: "São Paulo" },
            tickets_count: tickets.length,
            is_public_profile: true
          };
        }

        // Perfil básico
        return {
          id: userId,
          full_name: "Usuário Sublinx",
          avatar_url: userImage,
          is_organizer: false,
          bio: "Membro da comunidade Sublinx",
          music_preferences: [],
          underground_level: 1,
          location: { city: "Brasil" },
          is_public_profile: true
        };
        
      } catch (error) {
        console.error("❌ Erro:", error);
        
        // Retornar perfil básico
        return {
          id: userId,
          full_name: "Usuário Sublinx",
          avatar_url: userImage,
          is_organizer: false,
          bio: "Membro da comunidade Sublinx",
          music_preferences: [],
          underground_level: 1,
          location: { city: "Brasil" },
          is_public_profile: true
        };
      }
    },
    enabled: !!userId,
    retry: 1,
  });

  // Buscar seguidores
  const { data: followersData = [] } = useQuery({
    queryKey: ['userFollowers', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        return await base44.entities.Follow.filter({ following_id: userId });
      } catch {
        return [];
      }
    },
    enabled: !!userId && !!user,
    initialData: [],
  });

  // Buscar seguindo
  const { data: followingData = [] } = useQuery({
    queryKey: ['userFollowing', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        return await base44.entities.Follow.filter({ follower_id: userId });
      } catch {
        return [];
      }
    },
    enabled: !!userId && !!user,
    initialData: [],
  });

  // Buscar eventos passados
  const { data: pastEvents = [] } = useQuery({
    queryKey: ['userPastEvents', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      if (user?.is_organizer) {
        try {
          const events = await base44.entities.Event.filter({ organizer_id: userId }, "-date");
          const now = new Date();
          return events.filter(e => new Date(e.date) < now);
        } catch {
          return [];
        }
      }
      
      try {
        const tickets = await base44.entities.Ticket.filter({ user_id: userId });
        const eventIds = [...new Set(tickets.map(t => t.event_id))];
        
        if (eventIds.length === 0) return [];

        const events = await Promise.all(
          eventIds.map(async id => {
            try {
              const eventList = await base44.entities.Event.filter({ id });
              return eventList[0] || null;
            } catch {
              return null;
            }
          })
        );

        const now = new Date();
        return events
          .filter(e => e !== null && new Date(e.date) < now)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
      } catch {
        return [];
      }
    },
    enabled: !!userId && !!user,
    initialData: [],
  });

  // Buscar reels
  const { data: userReels = [] } = useQuery({
    queryKey: ['userProfileReels', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        return await base44.entities.Reel.filter({ user_id: userId });
      } catch {
        return [];
      }
    },
    enabled: !!userId && !!user,
    initialData: [],
  });

  const handleShare = () => {
    if (!user) return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${user.full_name}`,
        text: `Confira o perfil de ${user.full_name} no Sublinx!`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("✅ Link do perfil copiado!");
    }
  };

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">ID não fornecido</h2>
        <Button onClick={() => navigate(createPageUrl("Feed"))} className="bg-cyan-600 hover:bg-cyan-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Feed
        </Button>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-400 text-sm">Carregando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Perfil não encontrado</h2>
        <Button onClick={() => navigate(createPageUrl("Feed"))} className="bg-cyan-600 hover:bg-cyan-700">
          Ir para o Feed
        </Button>
      </div>
    );
  }

  const followersCount = followersData?.length || 0;
  const followingCount = followingData?.length || 0;
  const totalPosts = userReels?.length || 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 text-white">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10 hover:bg-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">{user.full_name}</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="h-10 w-10 hover:bg-gray-800"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6"
      >
        <div className="flex items-start gap-4 sm:gap-6 mb-6">
          <div className="flex-shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow opacity-75 blur-sm"></div>
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-900">
              <img
                src={user.avatar_url || userImage}
                alt={user.full_name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Stats */}
            <div className="flex gap-4 sm:gap-8 mb-4">
              <div className="text-center">
                <div className="text-base sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {totalPosts}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">posts</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {followersCount}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">seguidores</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {followingCount}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">seguindo</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              {currentUser && (
                <div className="flex-1">
                  <FollowButton 
                    targetUserId={userId}
                    currentUserId={currentUser.id}
                    size="default"
                  />
                </div>
              )}
              <Button
                onClick={() => {
                  if (!currentUser) {
                    navigate(createPageUrl("BemVindo"));
                    return;
                  }
                  alert("💬 Em breve: Mensagens Diretas");
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-cyan-500"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Mensagem</span>
                <span className="sm:hidden">MSG</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-3">
          <div className="font-semibold text-sm sm:text-base">{user.full_name}</div>
          {user.bio && (
            <div className="text-xs sm:text-sm text-gray-300">{user.bio}</div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {user.is_pro_member && (
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-xs shadow-lg">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            )}
            {user.is_organizer && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-xs shadow-lg">
                🎫 Organizador
              </Badge>
            )}
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 text-xs bg-cyan-500/10">
              ⭐ Nível {user.underground_level || 1}
            </Badge>
          </div>

          {/* Gêneros Favoritos */}
          {user.music_preferences && user.music_preferences.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-400" />
                <span className="text-xs sm:text-sm font-semibold text-purple-300">Gêneros Favoritos</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.music_preferences.map((genre, index) => (
                  <Badge 
                    key={genre}
                    className="bg-purple-500/20 border-purple-500/30 text-purple-300 text-xs hover:bg-purple-500/30"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Localização */}
          <div className="flex gap-4 py-3 border-t border-b border-gray-800 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-400">{pastEvents.length} eventos</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400">{user.location?.city || "Brasil"}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-gray-800">
          <TabsTrigger value="posts">
            <Grid className="w-4 h-4 mr-2" />
            Posts ({totalPosts})
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="w-4 h-4 mr-2" />
            Eventos ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          {userReels && userReels.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {userReels.map((reel, index) => (
                <div
                  key={reel.id || index}
                  className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 relative group"
                >
                  <img
                    src={reel.thumbnail_url || `https://picsum.photos/300/300?random=${index}`}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1 text-white text-xs">
                      <Heart className="w-4 h-4" fill="white" />
                      <span>{reel.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white text-xs">
                      <MessageCircle className="w-4 h-4" fill="white" />
                      <span>{reel.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
              <Grid className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum post ainda</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          {pastEvents && pastEvents.length > 0 ? (
            <div className="grid gap-4">
              {pastEvents.map((event) => (
                <EventHistoryCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum evento participado</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}