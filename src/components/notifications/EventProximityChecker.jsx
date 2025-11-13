import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Calcular distância entre coordenadas
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function EventProximityChecker({ user, userLocation }) {
  const queryClient = useQueryClient();
  const checkedEventsRef = useRef(new Set());

  // Verificar novos eventos próximos a cada 5 minutos
  const { data: nearbyEvents = [] } = useQuery({
    queryKey: ['nearbyEventsCheck', user?.id, userLocation],
    queryFn: async () => {
      if (!user?.id || !userLocation) return [];

      const now = new Date();
      const events = await base44.entities.Event.filter({
        date: { $gte: now.toISOString() }
      }, '-date', 50);

      // Filtrar eventos próximos (dentro de 5km)
      const nearby = (events || []).filter(event => {
        if (!event?.location?.lat || !event?.location?.lng) return false;
        
        const distance = getDistance(
          userLocation.lat,
          userLocation.lng,
          event.location.lat,
          event.location.lng
        );
        
        return distance <= 5; // 5km radius
      });

      return nearby;
    },
    enabled: !!user?.id && !!userLocation,
    refetchInterval: 5 * 60 * 1000, // A cada 5 minutos
    refetchIntervalInBackground: false,
    staleTime: 4 * 60 * 1000,
    initialData: [],
  });

  // Criar notificações para novos eventos próximos
  useEffect(() => {
    if (!user?.id || !nearbyEvents || nearbyEvents.length === 0) return;

    nearbyEvents.forEach(async (event) => {
      // Se já foi checado, pular
      if (checkedEventsRef.current.has(event.id)) return;

      try {
        // Verificar se o usuário tem preferências de gênero
        const matchesPreferences = !user.music_preferences || 
          user.music_preferences.length === 0 || 
          user.music_preferences.some(pref => 
            pref.toLowerCase() === event.genre?.toLowerCase()
          );

        // Criar notificação
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

        // Marcar como checado
        checkedEventsRef.current.add(event.id);

        // Invalidar queries para atualizar UI
        queryClient.invalidateQueries(['realtimeNotifications', user.id]);
        queryClient.invalidateQueries(['notifications', user.id]);
      } catch (error) {
        console.error("Erro ao criar notificação de proximidade:", error);
      }
    });
  }, [nearbyEvents, user, queryClient]);

  return null; // Componente invisível
}