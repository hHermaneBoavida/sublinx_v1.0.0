import React, { useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NotificationToast from './NotificationToast';
import { AnimatePresence } from 'framer-motion';

export default function NotificationListener({ user }) {
  const [displayedToasts, setDisplayedToasts] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const processedNotificationsRef = useRef(new Set());
  const isMountedRef = useRef(true);

  // CORREÇÃO: Polling otimizado com verificação de mount
  const { data: notifications = [] } = useQuery({
    queryKey: ['realtimeNotifications', user?.id],
    queryFn: async () => {
      if (!user?.id || !isMountedRef.current) return [];

      try {
        const data = await base44.entities.Notification.filter(
          { user_id: user.id, is_read: false },
          '-created_date',
          10 // OTIMIZAÇÃO: Apenas 10 mais recentes
        );
        
        return Array.isArray(data) ? data.filter(n => n && n.id) : [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id && isMountedRef.current,
    refetchInterval: 30000, // OTIMIZAÇÃO: 30s (era menor)
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    initialData: [],
    staleTime: 25000,
  });

  // CORREÇÃO: Cleanup adequado
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      processedNotificationsRef.current.clear();
      setDisplayedToasts([]);
    };
  }, []);

  // Som de notificação otimizado
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKvm');
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current && isMountedRef.current) {
      audioRef.current.volume = 0.3; // OTIMIZAÇÃO: Volume reduzido
      audioRef.current.play().catch(() => {
        // Silenciar erro de autoplay bloqueado
      });
    }
  }, []);

  const sendBrowserNotification = useCallback((notification) => {
    if (!isMountedRef.current) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title || 'SUBLINX', {
          body: notification.message,
          icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a70ee66a1156f1068d2903/de9996d20_500x500.png',
          badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a70ee66a1156f1068d2903/de9996d20_500x500.png',
          tag: notification.id,
          requireInteraction: false,
          silent: false
        });
      } catch {
        // Silenciar erro
      }
    }
  }, []);

  const handleToastClick = useCallback((notification) => {
    if (!isMountedRef.current) return;

    setDisplayedToasts(prev => prev.filter(t => t.id !== notification.id));

    // Marcar como lida
    if (notification.id) {
      base44.entities.Notification.update(notification.id, { is_read: true })
        .catch(() => {});
    }

    // Navegar
    if (notification.event_id) {
      navigate(createPageUrl("Mapa"));
    } else if (notification.type === 'new_follower') {
      navigate(createPageUrl("Perfil"));
    } else if (notification.type === 'new_message') {
      navigate(createPageUrl("Chat"));
    }
  }, [navigate]);

  const handleDismissToast = useCallback((notificationId) => {
    if (!isMountedRef.current) return;

    setDisplayedToasts(prev => prev.filter(t => t.id !== notificationId));
    
    if (notificationId) {
      base44.entities.Notification.update(notificationId, { is_read: true })
        .catch(() => {});
    }
  }, []);

  // Processar novas notificações
  useEffect(() => {
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return;
    }

    if (!isMountedRef.current) return;

    const newNotifications = notifications.filter(n => 
      n && n.id && !processedNotificationsRef.current.has(n.id)
    );

    if (newNotifications.length > 0) {
      newNotifications.forEach(notification => {
        processedNotificationsRef.current.add(notification.id);
        
        // OTIMIZAÇÃO: Limitar toasts a 3 simultâneos
        setDisplayedToasts(prev => {
          const filtered = prev.slice(-2); // Manter apenas 2 últimos
          return [...filtered, notification];
        });

        playNotificationSound();
        sendBrowserNotification(notification);
      });

      // OTIMIZAÇÃO: Invalidar menos queries
      queryClient.invalidateQueries(['notifications', user?.id]);
    }
  }, [notifications, playNotificationSound, sendBrowserNotification, queryClient, user?.id]);

  // Auto-dismiss após 5s
  useEffect(() => {
    if (displayedToasts.length === 0 || !isMountedRef.current) return;

    const timers = displayedToasts.map(toast => {
      return setTimeout(() => {
        if (isMountedRef.current) {
          handleDismissToast(toast.id);
        }
      }, 5000); // OTIMIZAÇÃO: 5s (era mais longo)
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [displayedToasts, handleDismissToast]);

  // Limpar notificações antigas
  useEffect(() => {
    const interval = setInterval(() => {
      if (processedNotificationsRef.current.size > 50) {
        const arr = Array.from(processedNotificationsRef.current);
        processedNotificationsRef.current = new Set(arr.slice(-30));
      }
    }, 60000); // A cada 1min

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        <AnimatePresence>
          {displayedToasts.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onClick={() => handleToastClick(notification)}
              onDismiss={() => handleDismissToast(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}