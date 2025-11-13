import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bell, Settings, Loader2, CheckCircle2, Trash2, Volume2, VolumeX, MapPin, Heart, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import NotificationCard from "../components/notifications/NotificationCard";
import NotificationSettings from "../components/notifications/NotificationSettings";
import { CACHE_CONFIG } from "../components/shared/helpers";

export default function Notificacoes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const { data: user } = useQuery({
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

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const data = await base44.entities.Notification.filter(
        { user_id: user.id },
        '-created_date',
        50
      );
      return data || [];
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.SHORT,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', user?.id]);
      queryClient.invalidateQueries(['realtimeNotifications', user?.id]);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
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
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.delete(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', user?.id]);
      queryClient.invalidateQueries(['realtimeNotifications', user?.id]);
    }
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.event_id) {
      navigate(createPageUrl("Mapa"));
    } else if (notification.type === 'new_follower') {
      navigate(createPageUrl("Perfil"));
    } else if (notification.type === 'new_message') {
      navigate(createPageUrl("Chat"));
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.is_read;
    if (filterType === 'read') return n.is_read;
    return n.type === filterType;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
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
            className="mb-6"
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
            <MessageCircle className="w-3 h-3 sm:mr-1" />
            <span className="hidden sm:inline">Msgs</span>
          </TabsTrigger>
          <TabsTrigger value="new_follower" className="text-xs sm:text-sm">
            <Heart className="w-3 h-3 sm:mr-1" />
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
              <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {filterType === 'all' ? 'Nenhuma notificação' : 'Nenhuma notificação deste tipo'}
              </h3>
              <p className="text-sm text-gray-500">
                {filterType === 'unread' 
                  ? 'Você está em dia! 🎉' 
                  : 'Quando algo acontecer, você será notificado aqui'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}