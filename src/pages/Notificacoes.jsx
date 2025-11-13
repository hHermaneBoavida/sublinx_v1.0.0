import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bell, Settings, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import NotificationCard from "../components/notifications/NotificationCard";
import NotificationSettings from "../components/notifications/NotificationSettings";
import { CACHE_CONFIG } from "../components/shared/helpers";

export default function Notificacoes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // CORRIGIDO: Query do usuário
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        return userData;
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        navigate(createPageUrl("BemVindo"));
        return null;
      }
    },
    retry: false,
    ...CACHE_CONFIG.STATIC,
  });

  // CORRIGIDO: Query de notificações com error handling
  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('⚠️ User ID não disponível');
        return [];
      }

      try {
        console.log('📥 Buscando notificações para user:', user.id);
        const data = await base44.entities.Notification.filter(
          { user_id: user.id },
          '-created_date',
          50
        );
        
        console.log('✅ Notificações recebidas:', data?.length || 0);
        
        // Garantir que data é um array
        if (!Array.isArray(data)) {
          console.warn('⚠️ Dados recebidos não são array:', data);
          return [];
        }
        
        // Filtrar notificações válidas
        const validNotifications = data.filter(n => 
          n && 
          typeof n === 'object' && 
          n.id && 
          n.title && 
          n.message
        );
        
        console.log('✅ Notificações válidas:', validNotifications.length);
        return validNotifications;
      } catch (error) {
        console.error('❌ Erro ao buscar notificações:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.SHORT,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // CORRIGIDO: Mutations com error handling
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      if (!notificationId) throw new Error('ID da notificação inválido');
      await base44.entities.Notification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', user?.id]);
      queryClient.invalidateQueries(['realtimeNotifications', user?.id]);
    },
    onError: (error) => {
      console.error('❌ Erro ao marcar como lida:', error);
      alert('Erro ao marcar notificação. Tente novamente.');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!notifications || notifications.length === 0) {
        throw new Error('Nenhuma notificação para marcar');
      }

      const unreadNotifications = notifications.filter(n => n && !n.is_read);
      
      if (unreadNotifications.length === 0) {
        throw new Error('Nenhuma notificação não lida');
      }

      console.log(`🔄 Marcando ${unreadNotifications.length} notificações como lidas...`);
      
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', user?.id]);
      queryClient.invalidateQueries(['realtimeNotifications', user?.id]);
      alert('✅ Todas as notificações marcadas como lidas');
    },
    onError: (error) => {
      console.error('❌ Erro ao marcar todas:', error);
      alert('Erro ao marcar notificações. Tente novamente.');
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      if (!notificationId) throw new Error('ID da notificação inválido');
      await base44.entities.Notification.delete(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', user?.id]);
      queryClient.invalidateQueries(['realtimeNotifications', user?.id]);
    },
    onError: (error) => {
      console.error('❌ Erro ao deletar:', error);
      alert('Erro ao deletar notificação. Tente novamente.');
    }
  });

  const handleNotificationClick = async (notification) => {
    if (!notification) return;

    // Marcar como lida
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navegar baseado no tipo
    if (notification.event_id) {
      navigate(createPageUrl("Mapa"));
    } else if (notification.type === 'new_follower') {
      navigate(createPageUrl("Perfil"));
    } else if (notification.type === 'new_message') {
      navigate(createPageUrl("Chat"));
    }
  };

  // CORRIGIDO: Filtrar com validação
  const filteredNotifications = Array.isArray(notifications) 
    ? notifications.filter(n => {
        if (!n || !n.id) return false;
        if (filterType === 'all') return true;
        if (filterType === 'unread') return !n.is_read;
        if (filterType === 'read') return n.is_read;
        return n.type === filterType;
      })
    : [];

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter(n => n && !n.is_read).length 
    : 0;

  const isLoading = loadingUser || isLoadingNotifications;

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-cyan-400" />
          </motion.div>
          <p className="text-gray-400 text-sm">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-black">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Faça login para ver notificações</p>
          <Button 
            onClick={() => navigate(createPageUrl("BemVindo"))}
            className="mt-4 bg-cyan-600"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={unreadCount > 0 ? {
              rotate: [0, -15, 15, -10, 10, 0]
            } : {}}
            transition={{
              duration: 0.5,
              repeat: unreadCount > 0 ? Infinity : 0,
              repeatDelay: 3
            }}
          >
            <Bell className="w-7 h-7 text-cyan-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                size="sm"
                variant="outline"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Marcar todas</span>
                  </>
                )}
              </Button>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-9 w-9"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <NotificationSettings user={user} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <Tabs value={filterType} onValueChange={setFilterType} className="mb-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-900/50 border border-gray-800">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Todas
            {notifications.length > 0 && (
              <Badge className="ml-1 bg-cyan-600 text-white text-[10px] px-1">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs sm:text-sm">
            Não lidas
            {unreadCount > 0 && (
              <Badge className="ml-1 bg-red-600 text-white text-[10px] px-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="event_alert" className="text-xs sm:text-sm">
            <Bell className="w-3 h-3 sm:mr-1" />
            <span className="hidden sm:inline">Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="new_message" className="text-xs sm:text-sm">
            <Bell className="w-3 h-3 sm:mr-1" />
            <span className="hidden sm:inline">Msgs</span>
          </TabsTrigger>
          <TabsTrigger value="new_follower" className="text-xs sm:text-sm">
            <Bell className="w-3 h-3 sm:mr-1" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <NotificationCard
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                  isDeleting={deleteNotificationMutation.isPending}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {filterType === 'all' ? 'Nenhuma notificação' : 'Nenhuma notificação deste tipo'}
              </h3>
              <p className="text-sm text-gray-500">
                {filterType === 'unread' 
                  ? 'Você está em dia! 🎉' 
                  : 'Quando algo acontecer, você será notificado aqui'}
              </p>
              {filterType !== 'all' && filterType !== 'unread' && (
                <Button
                  onClick={() => setFilterType('all')}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-gray-600 text-gray-300"
                >
                  Ver Todas as Notificações
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Debug Info (pode remover em produção) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-500 mb-2">🔍 Debug Info:</p>
          <p className="text-xs text-gray-400">Total: {notifications.length}</p>
          <p className="text-xs text-gray-400">Não lidas: {unreadCount}</p>
          <p className="text-xs text-gray-400">Filtradas: {filteredNotifications.length}</p>
          <p className="text-xs text-gray-400">User ID: {user?.id || 'N/A'}</p>
        </div>
      )}
    </div>
  );
}