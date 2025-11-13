import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useEventUpdates } from './WebSocketEventProvider';

export default function useRealtimeEvent(eventId) {
  const { eventUpdates, subscribeToEvent, unsubscribeFromEvent, isConnected } = useEventUpdates();

  // Buscar dados completos do evento
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['eventDetails', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      try {
        const events = await base44.entities.Event.filter({ id: eventId });
        return events[0] || null;
      } catch (error) {
        console.error('Erro ao buscar evento:', error);
        return null;
      }
    },
    enabled: !!eventId,
    staleTime: 10000, // 10 segundos
    refetchInterval: 15000, // Refetch a cada 15s como fallback
  });

  // Inscrever/desinscrever no evento para updates em tempo real
  useEffect(() => {
    if (eventId) {
      subscribeToEvent(eventId);
      return () => unsubscribeFromEvent(eventId);
    }
  }, [eventId, subscribeToEvent, unsubscribeFromEvent]);

  // Merge dos dados do evento com updates em tempo real
  const realtimeEvent = useMemo(() => {
    if (!event) return null;

    const updates = eventUpdates[eventId];
    
    if (!updates) return event;

    // Merge inteligente: updates sobrescrevem dados originais
    return {
      ...event,
      current_attendees: updates.current_attendees ?? event.current_attendees,
      max_capacity: updates.max_capacity ?? event.max_capacity,
      status: updates.status ?? event.status,
      is_secret: updates.is_secret ?? event.is_secret,
      requires_approval: updates.requires_approval ?? event.requires_approval,
      _realtime: true,
      _updated_at: updates.updated_at
    };
  }, [event, eventUpdates, eventId]);

  // Calcular ocupação em porcentagem
  const occupancyPercentage = useMemo(() => {
    if (!realtimeEvent?.max_capacity || realtimeEvent.max_capacity === 0) return 0;
    return Math.round((realtimeEvent.current_attendees / realtimeEvent.max_capacity) * 100);
  }, [realtimeEvent]);

  // Status de disponibilidade
  const availabilityStatus = useMemo(() => {
    if (!realtimeEvent) return 'unknown';
    
    if (occupancyPercentage >= 100) return 'sold_out';
    if (occupancyPercentage >= 90) return 'almost_full';
    if (occupancyPercentage >= 70) return 'filling_fast';
    return 'available';
  }, [realtimeEvent, occupancyPercentage]);

  return {
    event: realtimeEvent,
    isLoading,
    error,
    isConnected,
    occupancyPercentage,
    availabilityStatus,
    isRealtime: !!eventUpdates[eventId]
  };
}