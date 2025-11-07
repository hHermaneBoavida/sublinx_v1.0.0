import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Zap, Star, MessageSquare, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationCard from "../components/notifications/NotificationCard";
import NotificationSettings from "../components/notifications/NotificationSettings";

export default function Notificacoes() {
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // CORREÇÃO: Usar base44.auth.me() ao invés de import User
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
    staleTime: Infinity,
  });

  // CORREÇÃO: Usar base44.entities ao invés de import Notification
  const { data: notifications = [], isLoading: loadingNotifications, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Notification.filter(
        { user_id: user.id },
        "-created_date",
        50
      );
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, { is_read: true });
      queryClient.invalidateQueries(['notifications']);
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;
    
    try {
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, { is_read: true })
        )
      );
      queryClient.invalidateQueries(['notifications']);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      alert("Ocorreu um erro. Tente novamente.");
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.is_read;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loadingUser || loadingNotifications) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
              Notificações
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <NotificationSettings 
          user={user}
          onClose={() => setShowSettings(false)}
          onUpdate={refetch}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { value: "all", label: "Todas", icon: Bell },
          { value: "unread", label: "Não Lidas", icon: Zap },
          { value: "event_alert", label: "Eventos", icon: Bell },
          { value: "surprise_event", label: "Surpresas", icon: Star },
          { value: "new_message", label: "Mensagens", icon: MessageSquare }
        ].map(tab => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "default" : "outline"}
            onClick={() => setFilter(tab.value)}
            className={`flex items-center gap-2 whitespace-nowrap ${
              filter === tab.value 
                ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
                : "border-gray-600 text-gray-300 hover:bg-gray-800"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.value === "unread" && unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-600 text-white ml-1">
                {unreadCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-700">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhuma notificação encontrada
            </h3>
            <p className="text-gray-500">
              {filter === "all" 
                ? "Você não tem notificações ainda." 
                : `Nenhuma notificação do tipo "${filter}" encontrada.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}