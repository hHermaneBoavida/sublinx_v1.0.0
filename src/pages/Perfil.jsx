import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut, Crown, Calendar, Ticket, Award, Edit2, Share2, CheckCircle, 
  Settings, Shield, Music, Trophy, BarChart3, MessageCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EditProfileModal from "../components/profile/EditProfileModal";
import TicketCard from "../components/tickets/TicketCard";
import BirthdayBanner from "../components/profile/BirthdayBanner";
import CalendarIntegration from "../components/integrations/CalendarIntegration";
import { CACHE_CONFIG } from "../components/shared/helpers";
import { queryKeys } from "../components/shared/optimizations";
import { getUserDisplayName, getUserAvatar } from "../components/shared/userHelpers";
import useCurrentUser from "../components/shared/useCurrentUser";

export default function Perfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const { data: user, isLoading } = useCurrentUser();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate(createPageUrl("BemVindo"));
    }
  }, [user, isLoading, navigate]);

  const { data: socialData } = useQuery({
    queryKey: queryKeys.userSocial(user?.id),
    queryFn: async () => {
      if (!user?.id) return { followers: [], following: [] };
      
      const [followers, following] = await Promise.allSettled([
        base44.entities.Follow.filter({ following_id: user.id }),
        base44.entities.Follow.filter({ follower_id: user.id })
      ]);

      return {
        followers: followers.status === 'fulfilled' ? followers.value : [],
        following: following.status === 'fulfilled' ? following.value : []
      };
    },
    enabled: !!user?.id,
    ...CACHE_CONFIG.SHORT,
    initialData: { followers: [], following: [] },
  });

  const { data: userTickets = [] } = useQuery({
    queryKey: ['userTickets', user?.id],
    queryFn: () => base44.entities.Ticket.filter({ user_id: user.id }, "-created_date"),
    enabled: !!user?.id && !user?.is_organizer,
    ...CACHE_CONFIG.MEDIUM,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['profileEvents'],
    queryFn: () => base44.entities.Event.list("-date", 100),
    ...CACHE_CONFIG.MEDIUM,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: () => base44.entities.UserBadge.filter({ user_id: user.id }),
    enabled: !!user?.id,
    ...CACHE_CONFIG.LONG,
  });

  const myEvents = useMemo(() => {
    if (!user || !allEvents) return [];
    return allEvents.filter(e => e.organizer_id === user.id);
  }, [allEvents, user]);

  const attendedEvents = useMemo(() => {
    if (!userTickets || !allEvents) return [];
    const eventIds = userTickets.map(t => t.event_id);
    return allEvents.filter(e => eventIds.includes(e.id));
  }, [userTickets, allEvents]);

  const favoriteGenres = useMemo(() => {
    const events = user?.is_organizer ? myEvents : attendedEvents;
    if (!events || events.length === 0) return [];
    
    const genreCounts = events.reduce((acc, event) => {
      const genre = event.genre || 'outros';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));
  }, [myEvents, attendedEvents, user?.is_organizer]);

  const birthdayInfo = useMemo(() => {
    if (!user?.birth_date) return { isBirthday: false, daysUntil: 999 };

    const today = new Date();
    const birthDate = new Date(user.birth_date);
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    const isBirthday = 
      today.getDate() === birthDate.getDate() && 
      today.getMonth() === birthDate.getMonth();

    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

    return { isBirthday, daysUntil };
  }, [user?.birth_date]);

  const handleLogout = () => {
    base44.auth.logout();
    navigate(createPageUrl("BemVindo"));
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}${createPageUrl("PerfilUsuario")}?id=${user.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${getUserDisplayName(user)}`,
          text: `Confira meu perfil no SUBLINX!`,
          url: profileUrl
        });
      } catch {
        navigator.clipboard.writeText(profileUrl);
        alert('Link copiado!');
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      alert('Link copiado!');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const stats = {
    followers: socialData.followers.length,
    following: socialData.following.length,
    events: user.is_organizer ? myEvents.length : attendedEvents.length,
    level: user.underground_level || 1,
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 md:pb-8">
      <div className="border-b border-gray-800 sticky top-0 bg-black/95 backdrop-blur-lg z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Perfil</h1>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="sm"
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-red-500/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
              <Button onClick={handleShareProfile} variant="ghost" size="icon" className="text-white hover:bg-gray-900">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button onClick={() => setShowEditModal(true)} variant="ghost" size="icon" className="text-cyan-400 hover:bg-cyan-500/10">
                <Edit2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <BirthdayBanner 
          user={user} 
          isBirthday={birthdayInfo.isBirthday} 
          daysUntilBirthday={birthdayInfo.daysUntil} 
        />

        <div className="flex items-start gap-6 mb-6">
          <div className="relative flex-shrink-0">
            <img
              src={getUserAvatar(user)}
              alt={getUserDisplayName(user)}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-800"
            />
            {(user.is_pro_member || user.is_organizer) && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-black">
                <Crown className="w-3 h-3 text-black" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold">{stats.events}</div>
                <div className="text-sm text-gray-400">{user.is_organizer ? 'eventos' : 'ingressos'}</div>
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

            <div className="mb-4">
              <p className="font-semibold mb-1">{getUserDisplayName(user)}</p>
              {user.bio && <p className="text-sm text-gray-300">{user.bio}</p>}
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {user.is_organizer && (
                  <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">
                    Organizador
                  </Badge>
                )}
                {user.verified_organizer && <CheckCircle className="w-4 h-4 text-blue-500" />}
                <span className="text-xs text-gray-500">Nível {stats.level}</span>
                {user.birth_date && (
                  <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                    🎂 {format(new Date(user.birth_date), "dd/MM")}
                  </Badge>
                )}
              </div>
            </div>

            {user.is_organizer && (
              <div className="flex gap-2">
                <Button onClick={() => navigate(createPageUrl("DashboardOrganizador"))} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button onClick={() => navigate(createPageUrl("ChatOrganizadores"))} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue={user.is_organizer ? "eventos" : "ingressos"} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-black border-b border-gray-800 rounded-none h-auto p-0">
            <TabsTrigger value={user.is_organizer ? "eventos" : "ingressos"} className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-3">
              {user.is_organizer ? <Calendar className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
            </TabsTrigger>
            <TabsTrigger value="badges" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-3">
              <Trophy className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="music" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-3">
              <Music className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="config" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-3">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value={user.is_organizer ? "eventos" : "ingressos"} className="mt-4">
            {user.is_organizer ? (
              myEvents.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {myEvents.map((event) => (
                    <div key={event.id} className="aspect-square bg-gray-900 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(createPageUrl("MeusEventos"))}>
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
                  <p className="text-gray-400 text-sm mb-4">Nenhum evento criado</p>
                  <Button onClick={() => navigate(createPageUrl("CriarEvento"))} className="bg-cyan-600 hover:bg-cyan-700">Criar Evento</Button>
                </div>
              )
            ) : (
              userTickets.filter(t => t.status === 'valid').length > 0 ? (
                <div className="space-y-3">
                  {userTickets.filter(t => t.status === 'valid').map((ticket) => {
                    const event = allEvents.find(e => e.id === ticket.event_id);
                    return event ? <TicketCard key={ticket.id} ticket={ticket} event={event} /> : null;
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm mb-4">Nenhum ingresso</p>
                  <Button onClick={() => navigate(createPageUrl("Feed"))} className="bg-cyan-600 hover:bg-cyan-700">Ver Eventos</Button>
                </div>
              )
            )}
          </TabsContent>

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
                    <div key={badge.id} className={`aspect-square border-2 ${rarityColors[badge.rarity] || 'border-gray-600'} rounded-lg p-4 flex flex-col items-center justify-center bg-gray-900`}>
                      <Award className="w-8 h-8 text-cyan-400 mb-2" />
                      <p className="text-xs text-center font-semibold text-white line-clamp-2">{badge.badge_name}</p>
                      <Badge variant="outline" className="text-[10px] mt-2 border-gray-700 text-gray-400">{badge.rarity}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">Nenhum badge conquistado</p>
                <Button onClick={() => navigate(createPageUrl("Feed"))} className="bg-cyan-600 hover:bg-cyan-700">Explorar Eventos</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="music" className="mt-4">
            {favoriteGenres.length > 0 ? (
              <div className="space-y-2">
                {favoriteGenres.map((item, index) => (
                  <div key={item.genre} className="flex items-center justify-between p-3 bg-gray-900 rounded border border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-sm font-bold">{index + 1}</div>
                      <div>
                        <p className="font-semibold capitalize text-sm">{item.genre}</p>
                        <p className="text-xs text-gray-500">{item.count} evento{item.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {Math.round((item.count / (user.is_organizer ? myEvents.length : attendedEvents.length)) * 100)}%
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

          <TabsContent value="config" className="mt-4 space-y-3">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white font-medium text-sm">{user.email}</p>
                </div>
                {user.email_verified && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>

              {user.phone && (
                <div className="pb-4 border-b border-gray-800">
                  <p className="text-sm text-gray-400">Telefone</p>
                  <p className="text-white font-medium text-sm">{user.phone}</p>
                </div>
              )}

              {user.birth_date && (
                <div className="pb-4 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Aniversário</p>
                      <p className="text-white font-medium text-sm">
                        {format(new Date(user.birth_date), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowCalendarModal(true)}
                      variant="ghost"
                      size="sm"
                      className="text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-400">Membro desde</p>
                <p className="text-white font-medium text-sm">
                  {format(new Date(user.created_date), "MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <Button onClick={() => navigate(createPageUrl("ConfiguracoesPrivacidade"))} variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-900">
              <Shield className="w-4 h-4 mr-2" />
              Privacidade e Segurança
            </Button>

            <Button onClick={() => navigate(createPageUrl("Planos"))} className="w-full bg-cyan-600 hover:bg-cyan-700">
              <Crown className="w-4 h-4 mr-2" />
              {user.is_pro_member || user.is_organizer ? 'Gerenciar Plano' : 'Tornar-se Pro'}
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {showEditModal && <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />}
      {showCalendarModal && user.birth_date && (
        <CalendarIntegration 
          event={{
            title: `🎂 Aniversário de ${getUserDisplayName(user)}`,
            date: new Date(new Date().getFullYear(), new Date(user.birth_date).getMonth(), new Date(user.birth_date).getDate()),
            description: "Aniversário - Lembre-se de comemorar!",
            location: { venue_name: "", address: "" },
            duration_hours: 24
          }} 
          onClose={() => setShowCalendarModal(false)} 
        />
      )}
    </div>
  );
}