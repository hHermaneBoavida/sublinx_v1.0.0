import React, { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AnimatePresence } from "framer-motion";
import NotificationToast from "./NotificationToast";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CACHE_CONFIG } from "../shared/helpers";

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log("Som não disponível:", error);
  }
};

export default function NotificationListener({ user }) {
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const [lastCheckedId, setLastCheckedId] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const soundEnabledRef = useRef(true);

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
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    ...CACHE_CONFIG.SHORT,
    initialData: [],
  });

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const newestNotification = notifications[0];
    
    if (lastCheckedId !== newestNotification.id) {
      const alreadyVisible = visibleNotifications.some(n => n.id === newestNotification.id);
      
      if (!alreadyVisible) {
        if (soundEnabledRef.current) {
          playNotificationSound();
        }

        setVisibleNotifications(prev => [...prev, newestNotification]);

        setTimeout(() => {
          setVisibleNotifications(prev => prev.filter(n => n.id !== newestNotification.id));
        }, 6000);

        queryClient.invalidateQueries(['notifications', user.id]);
      }

      setLastCheckedId(newestNotification.id);
    }
  }, [notifications, lastCheckedId, user?.id, queryClient, visibleNotifications]);

  const handleNotificationClick = async (notification) => {
    try {
      await base44.entities.Notification.update(notification.id, { is_read: true });
      setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      queryClient.invalidateQueries(['notifications', user.id]);
      queryClient.invalidateQueries(['realtimeNotifications', user.id]);

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
      await base44.entities.Notification.update(notification.id, { is_read: true });
      setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
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