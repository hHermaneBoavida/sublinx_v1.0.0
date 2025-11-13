import React, { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateDistance } from '../shared/helpers';

const PROXIMITY_RADIUS_KM = 5; // REDUZIDO: 5km (era 10km)
const CHECK_INTERVAL = 120000; // AUMENTADO: 2min (era 1min)

export default function EventProximityChecker({ user, userLocation }) {
  const queryClient = useQueryClient();
  const notifiedEventsRef = useRef(new Set());
  const isMountedRef = useRef(true);

  // OTIMIZAÇÃO: Query com cache longo
  const { data: events = [] } = useQuery({
    queryKey: ['proximityEvents'],
    queryFn: async () => {
      if (!isMountedRef.current) return [];
      
      try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const data = await base44.entities.Event.list('-date', 50); // REDUZIDO: 50 (era 100)
        
        return (data || []).filter(e => 
          e && 
          e.id && 
          e.date && 
          new Date(e.date) > now && 
          new Date(e.date) < tomorrow
        );
      } catch {
        return [];
      }
    },
    enabled: !!user?.id && !!userLocation && isMountedRef.current,
    refetchInterval: CHECK_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: CHECK_INTERVAL - 5000,
    initialData: [],
  });

  // CORREÇÃO: Cleanup adequado
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      notifiedEventsRef.current.clear();
    };
  }, []);

  // Check de proximidade otimizado
  useEffect(() => {
    if (!events || events.length === 0 || !userLocation || !user?.id || !isMountedRef.current) {
      return;
    }

    const checkProximity = async () => {
      for (const event of events) {
        if (!event?.location?.lat || !event?.location?.lng || !isMountedRef.current) {
          continue;
        }

        // Já notificou? Skip
        if (notifiedEventsRef.current.has(event.id)) {
          continue;
        }

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          event.location.lat,
          event.location.lng
        );

        if (distance <= PROXIMITY_RADIUS_KM) {
          try {
            // Verificar se já existe notificação
            const existing = await base44.entities.Notification.filter({
              user_id: user.id,
              event_id: event.id,
              type: 'event_alert'
            });

            if (existing && existing.length > 0) {
              notifiedEventsRef.current.add(event.id);
              continue;
            }

            // Criar notificação
            const matchesPreferences = user.music_preferences?.includes(event.genre);

            await base44.entities.Notification.create({
              user_id: user.id,
              event_id: event.id,
              type: 'event_alert',
              title: matchesPreferences 
                ? `🎵 ${event.genre} perto de você!` 
                : `📍 Evento próximo!`,
              message: `${event.title} está a ${distance.toFixed(1)}km de você!`,
              location_match: true,
              genre_match: matchesPreferences ? [event.genre] : []
            });

            notifiedEventsRef.current.add(event.id);
            
            if (isMountedRef.current) {
              queryClient.invalidateQueries(['notifications', user.id]);
              queryClient.invalidateQueries(['realtimeNotifications', user.id]);
            }

          } catch (error) {
            // Silenciar erro
            notifiedEventsRef.current.add(event.id);
          }
        }
      }
    };

    checkProximity();
  }, [events, userLocation, user, queryClient]);

  // Limpar notificações antigas periodicamente
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (notifiedEventsRef.current.size > 30) {
        const arr = Array.from(notifiedEventsRef.current);
        notifiedEventsRef.current = new Set(arr.slice(-20));
      }
    }, 5 * 60 * 1000); // 5min

    return () => clearInterval(cleanupInterval);
  }, []);

  return null;
}