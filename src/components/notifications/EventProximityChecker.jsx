import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calculateDistance, filterFutureEvents, CACHE_CONFIG } from "../shared/helpers";

const PROXIMITY_RADIUS_KM = 5;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

export default function EventProximityChecker({ user, userLocation }) {
  const queryClient = useQueryClient();
  const notifiedEvents = useRef(new Set());

  // Buscar eventos futuros
  const { data: events = [] } = useQuery({
    queryKey: ['nearbyEventsCheck', user?.id, userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation?.lat || !userLocation?.lng) return [];
      
      try {
        const data = await base44.entities.Event.list('-date', 50);
        return filterFutureEvents(data);
      } catch (error) {
        console.error("Erro ao buscar eventos próximos:", error);
        return [];
      }
    },
    enabled: !!user?.id && !!userLocation?.lat && !!userLocation?.lng,
    refetchInterval: CHECK_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: 4 * 60 * 1000, // 4 min
    initialData: [],
  });

  useEffect(() => {
    if (!events || events.length === 0 || !userLocation) return;

    const checkProximity = async () => {
      console.log('📍 Verificando eventos próximos...');

      for (const event of events) {
        // Pular se já notificado
        if (notifiedEvents.current.has(event.id)) continue;

        // Verificar se o evento tem localização
        if (!event.location?.lat || !event.location?.lng) continue;

        // Calcular distância
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          event.location.lat,
          event.location.lng
        );

        console.log(`📏 Evento "${event.title}": ${distance.toFixed(2)}km`);

        // Se está dentro do raio
        if (distance <= PROXIMITY_RADIUS_KM) {
          console.log(`✅ Evento próximo detectado: ${event.title}`);

          // Verificar se já existe notificação
          try {
            const existingNotifications = await base44.entities.Notification.filter({
              user_id: user.id,
              event_id: event.id,
              type: 'event_alert'
            });

            if (existingNotifications && existingNotifications.length > 0) {
              console.log('⏭️ Notificação já existe para este evento');
              notifiedEvents.current.add(event.id);
              continue;
            }

            // Verificar se gênero do evento combina com preferências do usuário
            const genreMatch = user.music_preferences?.includes(event.genre);
            
            const message = genreMatch
              ? `🎵 Evento perfeito pra você! ${event.title} está a ${distance.toFixed(1)}km de distância`
              : `📍 Novo evento próximo! ${event.title} está a ${distance.toFixed(1)}km`;

            // Criar notificação
            await base44.entities.Notification.create({
              user_id: user.id,
              type: 'event_alert',
              title: genreMatch ? '🎵 Evento na Sua Vibe!' : '📍 Evento Próximo!',
              message: message,
              event_id: event.id,
              is_read: false,
              location_match: true,
              genre_match: genreMatch ? [event.genre] : []
            });

            // Marcar como notificado
            notifiedEvents.current.add(event.id);

            // Invalidar queries para mostrar toast
            queryClient.invalidateQueries(['realtimeNotifications', user.id]);
            queryClient.invalidateQueries(['notifications', user.id]);

            console.log('✅ Notificação de proximidade criada');
          } catch (error) {
            console.error('Erro ao criar notificação de proximidade:', error);
          }
        }
      }
    };

    checkProximity();
  }, [events, userLocation, user, queryClient]);

  // Não renderiza nada
  return null;
}