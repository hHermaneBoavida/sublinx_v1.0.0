import React, { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AnimatePresence } from "framer-motion";
import NotificationToast from "./NotificationToast";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Som de notificação (usando Web Audio API)
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Som cyberpunk: two tones
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log("Som de notificação não disponível:", error);
  }
};

export default function NotificationListener({ user }) {
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const [lastCheckedId, setLastCheckedId] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const soundEnabledRef = useRef(true);

  // Polling para novas notificações a cada 30 segundos
  const { data: notifications = [] } = useQuery({
    queryKey: ['realtimeNotifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const allNotifications = await base44.entities.Notification.filter(
        { user_id: user.id, is_read: false },
        '-created_date',
        10
      );
      
      return allNotifications || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Polling a cada 30 segundos
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 25000,
    initialData: [],
  });

  // Detectar novas notificações
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const newestNotification = notifications[0];
    
    // Se é uma notificação nova (não vista antes)
    if (lastCheckedId !== newestNotification.id) {
      // Verificar se já está sendo exibida
      const alreadyVisible = visibleNotifications.some(n => n.id === newestNotification.id);
      
      if (!alreadyVisible) {
        // Tocar som
        if (soundEnabledRef.current) {
          playNotificationSound();
        }

        // Adicionar à lista de visíveis
        setVisibleNotifications(prev => [...prev, newestNotification]);

        // Auto-remover após 6 segundos
        setTimeout(() => {
          setVisibleNotifications(prev => prev.filter(n => n.id !== newestNotification.id));
        }, 6000);

        // Invalidar queries para atualizar contadores
        queryClient.invalidateQueries(['notifications', user.id]);
        queryClient.invalidateQueries(['currentUser']);
      }

      setLastCheckedId(newestNotification.id);
    }
  }, [notifications, lastCheckedId, user?.id, queryClient, visibleNotifications]);

  const handleNotificationClick = async (notification) => {
    try {
      // Marcar como lida
      await base44.entities.Notification.update(notification.id, { is_read: true });
      
      // Remover da visualização
      setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Invalidar queries
      queryClient.invalidateQueries(['notifications', user.id]);
      queryClient.invalidateQueries(['realtimeNotifications', user.id]);

      // Navegar baseado no tipo
      if (notification.event_id) {
        navigate(createPageUrl("Mapa"));
      } else if (notification.type === 'new_follower') {
        navigate(createPageUrl("Perfil"));
      } else if (notification.type === 'new_message') {
        navigate(createPageUrl("Chat"));
      } else {
        navigate(createPageUrl("Notificacoes"));
      }
    } catch (error) {
      console.error("Erro ao processar notificação:", error);
    }
  };

  const handleClose = async (notification) => {
    try {
      // Marcar como lida ao fechar
      await base44.entities.Notification.update(notification.id, { is_read: true });
      
      // Remover da visualização
      setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Invalidar queries
      queryClient.invalidateQueries(['notifications', user.id]);
      queryClient.invalidateQueries(['realtimeNotifications', user.id]);
    } catch (error) {
      console.error("Erro ao fechar notificação:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-3 max-w-sm pointer-events-none">
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast
              notification={notification}
              onClose={() => handleClose(notification)}
              onClick={() => handleNotificationClick(notification)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}