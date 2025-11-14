import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut, Crown, Zap, Calendar, Ticket, Users, TrendingUp,
  Award, BarChart3, Edit2, Share2, UserPlus, Mail, Phone, 
  Shield, CreditCard, XCircle, CheckCircle, Trophy, Settings, DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EditProfileModal from "../components/profile/EditProfileModal";
import TicketCard from "../components/tickets/TicketCard";
import EventHistoryCard from "../components/profile/EventHistoryCard";
import { CACHE_CONFIG } from "../components/shared/helpers";

export default function Perfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showCancelPlan, setShowCancelPlan] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        navigate(createPageUrl("BemVindo"));
        throw error;
      }
    },
    retry: false,
    ...CACHE_CONFIG.STATIC,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Follow.filter({ following_id: user.id });
    },
    enabled: !!user?.id,
    ...CACHE_CONFIG.SHORT,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Follow.filter({ follower_id: user.id });
    },
    enabled: !!user?.id,
    ...CACHE_CONFIG.SHORT,
  });

  const { data: userTickets = [] } = useQuery({
    queryKey: ['userTickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Ticket.filter({ user_id: user.id }, "-created_date");
    },
    enabled: !!user?.id,
    ...CACHE_CONFIG.MEDIUM,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['profileEvents'],
    queryFn: async () => {
      return await base44.entities.Event.list("-date", 100);
    },
    ...CACHE_CONFIG.MEDIUM,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ 
        user_id: user.id,
        status: 'active'
      });
      return subs && subs.length > 0 ? subs[0] : null;
    },
    enabled: !!user?.id,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.UserBadge.filter({ user_id: user.id });
    },
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

  const cancelPlanMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) throw new Error("Nenhuma assinatura ativa");
      
      await base44.entities.Subscription.update(subscription.id, {
        status: 'cancelled',
        end_date: new Date().toISOString()
      });

      await base44.auth.updateMe({
        is_pro_member: false,
        is_organizer: false,
        subscription_type: 'free'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription']);
      queryClient.invalidateQueries(['currentUser']);
      setShowCancelPlan(false);
      alert("Plano cancelado com sucesso");
    }
  });

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate(createPageUrl("BemVindo"));
  };

  const handleShareProfile = async () => {
    const profileUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${user.full_name}`,
          text: `Confira meu perfil no SUBLINX!`,
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

  if (loadingUser) {
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

  const stats = {
    followers: followers.length,
    following: following.length,
    events: user.is_organizer ? myEvents.length : attendedEvents.length,
    tickets: userTickets.filter(t => t.status === 'valid').length,
    level: user.underground_level || 1,
    xp: user.experience_points || 0
  };

  const planConfig = {
    free: { name: 'Free', color: 'text-gray-400', icon: Zap },
    underground_pro: { name: 'Underground Pro', color: 'text-cyan-400', icon: Crown },
    organizer_elite: { name: 'Organizer Elite', color: 'text-yellow-400', icon: Crown }
  };

  const currentPlan = planConfig[user.subscription_type] || planConfig.free;

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
        
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#8b5cf6' : '#ec4899',
              boxShadow: `0 0 10px currentColor`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
                filter: 'blur(20px)',
                width: '180px',
                height: '180px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <motion.img
              src={user.avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png"}
              alt={user.full_name}
              className="w-32 h-32 rounded-full object-cover relative z-10 border-4"
              style={{
                borderColor: user.is_organizer ? '#FBBF24' : '#06B6D4',
                boxShadow: `0 0 40px ${user.is_organizer ? '#FBBF24' : '#06B6D4'}`
              }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            />

            <motion.div
              className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 border-4 border-black flex items-center justify-center z-20"
              whileHover={{ scale: 1.1, rotate: -10 }}
              style={{ boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)' }}
            >
              <span className="text-sm font-bold text-white">{stats.level}</span>
            </motion.div>

            {(user.is_pro_member || user.is_organizer) && (
              <motion.div
                className="absolute -top-2 -right-2 z-20"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Crown className="w-8 h-8 text-yellow-400" style={{ filter: 'drop-shadow(0 0 10px #FBBF24)' }} />
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={handleShareProfile}
              size="icon"
              variant="ghost"
              className="bg-black/50 backdrop-blur-xl border border-cyan-500/30 hover:bg-cyan-600/20"
            >
              <Share2 className="w-5 h-5 text-cyan-400" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={() => setShowEditModal(true)}
              size="icon"
              variant="ghost"
              className="bg-black/50 backdrop-blur-xl border border-purple-500/30 hover:bg-purple-600/20"
            >
              <Edit2 className="w-5 h-5 text-purple-400" />
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {user.full_name}
          </h1>
          {user.bio && (
            <p className="text-gray-400 max-w-md mx-auto mb-3">{user.bio}</p>
          )}

          <div className="flex items-center justify-center gap-3 mb-4">
            <Badge className={`bg-gradient-to-r ${
              user.is_organizer 
                ? 'from-yellow-600/20 to-orange-600/20 border-yellow-500/50 text-yellow-300'
                : user.is_pro_member
                ? 'from-cyan-600/20 to-purple-600/20 border-cyan-500/50 text-cyan-300'
                : 'from-gray-700/20 to-gray-600/20 border-gray-500/50 text-gray-400'
            }`}>
              <currentPlan.icon className="w-3 h-3 mr-1" />
              {currentPlan.name}
            </Badge>
            
            {user.verified_organizer && (
              <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verificado
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={Users}
            value={stats.followers}
            label="Seguidores"
            color="from-cyan-900/30 to-gray-900 border-cyan-700/50"
            iconColor="text-cyan-400"
            onClick={() => setShowFollowers(true)}
          />
          <StatCard
            icon={UserPlus}
            value={stats.following}
            label="Seguindo"
            color="from-purple-900/30 to-gray-900 border-purple-700/50"
            iconColor="text-purple-400"
            onClick={() => setShowFollowing(true)}
          />
          <StatCard
            icon={user.is_organizer ? Calendar : Ticket}
            value={stats.events}
            label={user.is_organizer ? 'Eventos' : 'Ingressos'}
            color="from-pink-900/30 to-gray-900 border-pink-700/50"
            iconColor="text-pink-400"
          />
          <StatCard
            icon={Trophy}
            value={userBadges.length}
            label="Badges"
            color="from-yellow-900/30 to-gray-900 border-yellow-700/50"
            iconColor="text-yellow-400"
          />
        </div>

        {/* XP Progress */}
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
                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 relative"
              >
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {1000 - (stats.xp % 1000)} XP para o próximo nível
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {user.is_organizer && (
            <>
              <QuickActionButton
                icon={BarChart3}
                label="Dashboard"
                onClick={() => navigate(createPageUrl("DashboardOrganizador"))}
                gradient="from-cyan-600 to-purple-600"
              />
              <QuickActionButton
                icon={Calendar}
                label="Meus Eventos"
                onClick={() => navigate(createPageUrl("MeusEventos"))}
                gradient="from-purple-600 to-pink-600"
              />
            </>
          )}
          
          <QuickActionButton
            icon={CreditCard}
            label="Planos"
            onClick={() => navigate(createPageUrl("Planos"))}
            gradient="from-yellow-600 to-orange-600"
            badge={!user.is_pro_member}
          />
          
          <QuickActionButton
            icon={Settings}
            label="Configurações"
            onClick={() => navigate(createPageUrl("Configuracoes"))}
            gradient="from-gray-600 to-gray-700"
          />
        </div>

        {/* Active Subscription */}
        {subscription && subscription.status === 'active' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-yellow-900/20 to-gray-900 border-yellow-700/50 mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-yellow-600/20 flex items-center justify-center">
                      <Crown className="w-7 h-7 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg mb-1">
                        {subscription.plan_type === 'underground_pro' ? 'Underground Pro' : 'Organizer Elite'}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        Ativo desde {format(new Date(subscription.start_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {subscription.features && subscription.features.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {subscription.features.slice(0, 3).map((feature, i) => (
                            <Badge key={i} className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowCancelPlan(true)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-900/20"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue={user.is_organizer ? "eventos" : "ingressos"} className="w-full">
          <TabsList className="grid w-full bg-gray-900/80 border border-gray-700" style={{
            gridTemplateColumns: user.is_organizer ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)'
          }}>
            {user.is_organizer ? (
              <>
                <TabsTrigger value="eventos">Eventos</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                <TabsTrigger value="config">Conta</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="ingressos">Ingressos</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="config">Conta</TabsTrigger>
              </>
            )}
          </TabsList>

          {user.is_organizer && (
            <TabsContent value="eventos" className="space-y-3 mt-4">
              {myEvents.length > 0 ? (
                myEvents.map((event, index) => (
                  <EventHistoryCard key={event.id} event={event} index={index} />
                ))
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="Nenhum evento criado"
                  description="Comece criando seu primeiro evento"
                  action={() => navigate(createPageUrl("CriarEvento"))}
                  actionLabel="Criar Evento"
                />
              )}
            </TabsContent>
          )}

          {!user.is_organizer && (
            <TabsContent value="ingressos" className="space-y-3 mt-4">
              {userTickets.length > 0 ? (
                userTickets
                  .filter(t => t.status === 'valid')
                  .map((ticket) => {
                    const event = allEvents.find(e => e.id === ticket.event_id);
                    return event ? (
                      <TicketCard key={ticket.id} ticket={ticket} event={event} />
                    ) : null;
                  })
              ) : (
                <EmptyState
                  icon={Ticket}
                  title="Nenhum ingresso"
                  description="Explore eventos e garanta seus ingressos"
                  action={() => navigate(createPageUrl("Feed"))}
                  actionLabel="Ver Eventos"
                />
              )}
            </TabsContent>
          )}

          <TabsContent value="badges" className="mt-4">
            {userBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userBadges.map((badge, index) => (
                  <BadgeCard key={badge.id} badge={badge} index={index} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Award}
                title="Nenhum badge conquistado"
                description="Participe de eventos para desbloquear badges"
                action={() => navigate(createPageUrl("Feed"))}
                actionLabel="Explorar Eventos"
              />
            )}
          </TabsContent>

          {user.is_organizer && (
            <TabsContent value="stats" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatsDetailCard
                  icon={DollarSign}
                  label="Receita Total"
                  value={`R$ ${myEvents.reduce((sum, e) => sum + (e.revenue || 0), 0).toFixed(2)}`}
                  color="from-green-600 to-emerald-600"
                />
                <StatsDetailCard
                  icon={Ticket}
                  label="Ingressos Vendidos"
                  value={myEvents.reduce((sum, e) => sum + (e.tickets_sold || 0), 0)}
                  color="from-blue-600 to-indigo-600"
                />
                <StatsDetailCard
                  icon={Users}
                  label="Total Participantes"
                  value={myEvents.reduce((sum, e) => sum + (e.current_attendees || 0), 0)}
                  color="from-purple-600 to-pink-600"
                />
                <StatsDetailCard
                  icon={TrendingUp}
                  label="Taxa Média Ocupação"
                  value={`${myEvents.length > 0 
                    ? (myEvents.reduce((sum, e) => sum + (e.current_attendees / e.max_capacity || 0), 0) / myEvents.length * 100).toFixed(0) 
                    : 0}%`}
                  color="from-cyan-600 to-purple-600"
                />
              </div>
            </TabsContent>
          )}

          <TabsContent value="config" className="space-y-4 mt-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                  {user.email_verified && (
                    <Badge className="bg-green-600/20 border-green-500/30 text-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                    <Phone className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Telefone</p>
                      <p className="text-white font-medium">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.city && (
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                    <Badge className="w-5 h-5 text-pink-400" />
                    <div>
                      <p className="text-sm text-gray-400">Localização</p>
                      <p className="text-white font-medium">{user.city}{user.state ? `, ${user.state}` : ''}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Membro desde</p>
                    <p className="text-white font-medium">
                      {format(new Date(user.created_date), "MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={() => navigate(createPageUrl("ConfiguracoesPrivacidade"))}
                variant="outline"
                className="w-full border-gray-700 hover:bg-gray-800"
              >
                <Shield className="w-4 h-4 mr-2" />
                Privacidade e Segurança
              </Button>

              {!user.is_pro_member && !user.is_organizer && (
                <Button
                  onClick={() => navigate(createPageUrl("Planos"))}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Tornar-se Pro
                </Button>
              )}

              <Button
                onClick={() => setShowLogoutConfirm(true)}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEditModal && (
          <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />
        )}
        {showFollowers && (
          <FollowModal
            title="Seguidores"
            follows={followers}
            currentUserId={user.id}
            onClose={() => setShowFollowers(false)}
            type="followers"
          />
        )}
        {showFollowing && (
          <FollowModal
            title="Seguindo"
            follows={following}
            currentUserId={user.id}
            onClose={() => setShowFollowing(false)}
            type="following"
          />
        )}
        {showCancelPlan && (
          <CancelPlanModal
            subscription={subscription}
            onCancel={() => cancelPlanMutation.mutateAsync()}
            onClose={() => setShowCancelPlan(false)}
            isLoading={cancelPlanMutation.isPending}
          />
        )}
        {showLogoutConfirm && (
          <LogoutConfirmModal
            onConfirm={handleLogout}
            onClose={() => setShowLogoutConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color, iconColor, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : ""}
    >
      <Card className={`bg-gradient-to-br ${color} text-center`}>
        <CardContent className="p-4">
          <Icon className={`w-6 h-6 ${iconColor} mx-auto mb-2`} />
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-xs text-gray-400">{label}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick, gradient, badge = false }) {
  return (
    <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={onClick}
        className={`w-full h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradient} relative overflow-hidden`}
      >
        <motion.div
          className="absolute inset-0 bg-white/10"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <Icon className="w-6 h-6 relative z-10" />
        <span className="text-sm font-semibold relative z-10">{label}</span>
        {badge && (
          <Badge className="absolute top-2 right-2 bg-red-600 text-white border-0 text-xs">
            Novo
          </Badge>
        )}
      </Button>
    </motion.div>
  );
}

function StatsDetailCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }}>
      <Card className={`bg-gradient-to-br ${color}/20 to-gray-900`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color}/30 flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BadgeCard({ badge, index }) {
  const rarityConfig = {
    comum: { color: 'from-gray-600 to-gray-700', glow: 'rgba(156, 163, 175, 0.5)' },
    raro: { color: 'from-blue-600 to-cyan-600', glow: 'rgba(6, 182, 212, 0.6)' },
    épico: { color: 'from-purple-600 to-pink-600', glow: 'rgba(168, 85, 247, 0.6)' },
    lendário: { color: 'from-yellow-500 to-orange-600', glow: 'rgba(251, 191, 36, 0.8)' }
  };

  const config = rarityConfig[badge.rarity] || rarityConfig.comum;

  return (
    <motion.div
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
          <h3 className="font-bold text-white mb-1">{badge.badge_name}</h3>
          <p className="text-xs text-gray-400 mb-2">{badge.badge_description}</p>
          <Badge className={`bg-gradient-to-r ${config.color} text-white border-0 text-xs`}>
            {badge.rarity}
          </Badge>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="p-12 text-center">
        <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{description}</p>
        {action && (
          <Button onClick={action} className="bg-gradient-to-r from-cyan-600 to-purple-600">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function FollowModal({ title, follows, currentUserId, onClose, type }) {
  const { data: users = [] } = useQuery({
    queryKey: ['followUsers', type, follows.length],
    queryFn: async () => {
      if (!follows || follows.length === 0) return [];
      
      const userIds = type === 'followers' 
        ? follows.map(f => f.follower_id)
        : follows.map(f => f.following_id);

      const allUsers = await base44.entities.User.list("", 500);
      return allUsers.filter(u => userIds.includes(u.id));
    },
    enabled: follows.length > 0,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="bg-gray-900 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
                {follows.length}
              </Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() => {
                    onClose();
                    window.location.href = createPageUrl("PerfilUsuario") + `?id=${user.id}`;
                  }}
                >
                  <img
                    src={user.avatar_url || "https://i.pravatar.cc/80"}
                    alt={user.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/30"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{user.full_name}</p>
                    <p className="text-sm text-gray-400">
                      Nível {user.underground_level || 1}
                    </p>
                  </div>
                  {user.is_organizer && (
                    <Crown className="w-5 h-5 text-yellow-400" />
                  )}
                </motion.div>
              ))}
            </div>

            <Button onClick={onClose} className="w-full mt-6" variant="outline">
              Fechar
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function CancelPlanModal({ subscription, onCancel, onClose, isLoading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="bg-gray-900 border-red-500/30">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Cancelar Plano?</h2>
              <p className="text-gray-400">
                Você perderá acesso aos seguintes benefícios:
              </p>
            </div>

            {subscription?.features && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6 space-y-2">
                {subscription.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <XCircle className="w-4 h-4 text-red-400" />
                    {feature}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-300">
                ⚠️ O cancelamento é imediato. Você pode reativar a qualquer momento.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600"
                disabled={isLoading}
              >
                Manter Plano
              </Button>
              <Button
                onClick={onCancel}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                Confirmar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function LogoutConfirmModal({ onConfirm, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6 text-center">
            <LogOut className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sair da conta?</h2>
            <p className="text-gray-400 mb-6">
              Você precisará fazer login novamente
            </p>
            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline" className="flex-1 border-gray-600">
                Cancelar
              </Button>
              <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700">
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}