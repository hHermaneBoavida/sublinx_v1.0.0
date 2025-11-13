import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AnimatePresence } from "framer-motion";
import NotificationToast from "./NotificationToast";
import { CACHE_CONFIG } from "../shared/helpers";

export default function NotificationListener({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState([]);
  const processedNotifications = useRef(new Set());
  const audioRef = useRef(null);
  const lastCheckRef = useRef(Date.now());

  // CORRIGIDO: Query para notificações em tempo real
  const { data: notifications = [] } = useQuery({
    queryKey: ['realtimeNotifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const data = await base44.entities.Notification.filter(
          { 
            user_id: user.id,
            is_read: false 
          },
          '-created_date',
          10
        );
        return data || [];
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll a cada 30s
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    ...CACHE_CONFIG.SHORT,
    initialData: [],
  });

  // NOVO: Inicializar áudio cyberpunk
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.5;
    }
  }, []);

  // CORRIGIDO: Processar novas notificações
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckRef.current;

    // Filtrar notificações novas (criadas após último check)
    const newNotifications = notifications.filter(notification => {
      if (!notification?.id) return false;
      
      // Prevenir duplicatas
      if (processedNotifications.current.has(notification.id)) return false;
      
      // Verificar se é realmente nova (criada nos últimos 60s)
      const createdAt = new Date(notification.created_date).getTime();
      const isNew = (now - createdAt) < 60000; // 60s window
      
      return isNew;
    });

    if (newNotifications.length > 0) {
      console.log('🔔 Novas notificações detectadas:', newNotifications.length);

      // Tocar som cyberpunk
      playNotificationSound();

      // Adicionar aos toasts
      newNotifications.forEach(notification => {
        processedNotifications.current.add(notification.id);
        
        setToasts(prev => {
          // Limitar a 3 toasts simultâneos
          const filtered = prev.filter(t => t.id !== notification.id);
          return [...filtered.slice(-2), notification];
        });

        // Solicitar permissão de notificação do browser
        if ('Notification' in window && Notification.permission === 'granted') {
          showBrowserNotification(notification);
        }
      });

      // Auto-dismiss após 6s
      newNotifications.forEach(notification => {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== notification.id));
        }, 6000);
      });
    }

    lastCheckRef.current = now;
  }, [notifications]);

  // NOVO: Som de notificação cyberpunk
  const playNotificationSound = () => {
    if (!audioRef.current) return;

    try {
      // Gerar som cyberpunk com Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Frequências cyberpunk
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Áudio não disponível:', error);
    }
  };

  // NOVO: Notificação do navegador
  const showBrowserNotification = (notification) => {
    if (!('Notification' in window)) return;

    try {
      new Notification(notification.title, {
        body: notification.message,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/116e0559c_Sublinx_icon.png',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/116e0559c_Sublinx_icon.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200]
      });
    } catch (error) {
      console.log('Erro ao mostrar notificação:', error);
    }
  };

  // Solicitar permissão na primeira montagem
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificação:', permission);
      });
    }
  }, []);

  const handleToastClick = async (notification) => {
    // Marcar como lida
    try {
      await base44.entities.Notification.update(notification.id, { is_read: true });
      queryClient.invalidateQueries(['notifications', user.id]);
      queryClient.invalidateQueries(['realtimeNotifications', user.id]);
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }

    // Remover toast
    setToasts(prev => prev.filter(t => t.id !== notification.id));

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
  };

  const handleToastClose = (notificationId) => {
    setToasts(prev => prev.filter(t => t.id !== notificationId));
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((notification, index) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast
              notification={notification}
              onClick={() => handleToastClick(notification)}
              onClose={() => handleToastClose(notification.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}