import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calculateDistance } from "../shared/helpers";

export default function EventProximityChecker({ user, userLocation }) {
  const queryClient = useQueryClient();
  const checkedEventsRef = useRef(new Set());

  const { data: nearbyEvents = [] } = useQuery({
    queryKey: ['nearbyEventsCheck', user?.id, userLocation],
    queryFn: async () => {
      if (!user?.id || !userLocation) return [];

      const now = new Date();
      const events = await base44.entities.Event.filter({
        date: { $gte: now.toISOString() }
      }, '-date', 50);

      const nearby = (events || []).filter(event => {
        if (!event?.location?.lat || !event?.location?.lng) return false;
        
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          event.location.lat,
          event.location.lng
        );
        
        return distance <= 5;
      });

      return nearby;
    },
    enabled: !!user?.id && !!userLocation,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 4 * 60 * 1000,
    cacheTime: 6 * 60 * 1000,
    initialData: [],
  });

  useEffect(() => {
    if (!user?.id || !nearbyEvents || nearbyEvents.length === 0) return;

    nearbyEvents.forEach(async (event) => {
      if (checkedEventsRef.current.has(event.id)) return;

      try {
        const matchesPreferences = !user.music_preferences || 
          user.music_preferences.length === 0 || 
          user.music_preferences.some(pref => 
            pref.toLowerCase() === event.genre?.toLowerCase()
          );

        await base44.entities.Notification.create({
          user_id: user.id,
          type: 'event_alert',
          title: matchesPreferences ? '🎵 Evento perfeito pra você!' : '📍 Novo evento próximo!',
          message: `${event.title} acontece perto de você em ${event.location?.city || 'sua região'}`,
          event_id: event.id,
          is_read: false,
          location_match: true,
          genre_match: matchesPreferences ? [event.genre] : []
        });

        checkedEventsRef.current.add(event.id);
        queryClient.invalidateQueries(['realtimeNotifications', user.id]);
        queryClient.invalidateQueries(['notifications', user.id]);
      } catch (error) {
        console.error("Erro ao criar notificação:", error);
      }
    });
  }, [nearbyEvents, user, queryClient]);

  return null;
}