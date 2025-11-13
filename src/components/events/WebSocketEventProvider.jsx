import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const WebSocketEventContext = createContext({
  eventUpdates: {},
  subscribeToEvent: () => {},
  unsubscribeFromEvent: () => {},
  isConnected: false
});

export const useEventUpdates = () => useContext(WebSocketEventContext);

export default function WebSocketEventProvider({ children, user }) {
  const [eventUpdates, setEventUpdates] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const subscribedEvents = useRef(new Set());
  const pollIntervalRef = useRef(null);
  const queryClient = useQueryClient();

  // Polling fallback para atualizações em tempo real
  const pollEventUpdates = useCallback(async () => {
    if (!user?.id || subscribedEvents.current.size === 0) return;

    try {
      const eventIds = Array.from(subscribedEvents.current);
      
      // Buscar eventos subscritos em lote
      const events = await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            const eventList = await base44.entities.Event.filter({ id: eventId });
            return eventList[0] || null;
          } catch {
            return null;
          }
        })
      );

      // Atualizar estado com novos dados
      const updates = {};
      events.forEach((event) => {
        if (event) {
          updates[event.id] = {
            current_attendees: event.current_attendees || 0,
            max_capacity: event.max_capacity || 0,
            status: event.status || 'active',
            updated_at: new Date().toISOString(),
            is_secret: event.is_secret,
            requires_approval: event.requires_approval
          };
        }
      });

      setEventUpdates(prev => ({ ...prev, ...updates }));

      // Invalidar queries relevantes
      queryClient.invalidateQueries(['eventDetails']);
      queryClient.invalidateQueries(['feedInteractions']);
      
    } catch (error) {
      console.error('❌ Erro ao fazer polling de eventos:', error);
    }
  }, [user, queryClient]);

  // Iniciar polling quando houver inscrições
  useEffect(() => {
    if (subscribedEvents.current.size > 0) {
      setIsConnected(true);
      
      // Poll inicial imediato
      pollEventUpdates();
      
      // Polling a cada 5 segundos
      pollIntervalRef.current = setInterval(pollEventUpdates, 5000);
      
      console.log(`📡 Polling ativo para ${subscribedEvents.current.size} evento(s)`);
    } else {
      setIsConnected(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollEventUpdates]);

  const subscribeToEvent = useCallback((eventId) => {
    if (!eventId) return;
    
    subscribedEvents.current.add(eventId);
    console.log(`✅ Inscrito no evento ${eventId} (total: ${subscribedEvents.current.size})`);
    
    // Trigger poll imediato
    pollEventUpdates();
  }, [pollEventUpdates]);

  const unsubscribeFromEvent = useCallback((eventId) => {
    if (!eventId) return;
    
    subscribedEvents.current.delete(eventId);
    console.log(`❌ Desinscrito do evento ${eventId} (restantes: ${subscribedEvents.current.size})`);
    
    // Remover do estado
    setEventUpdates(prev => {
      const newUpdates = { ...prev };
      delete newUpdates[eventId];
      return newUpdates;
    });
  }, []);

  const value = {
    eventUpdates,
    subscribeToEvent,
    unsubscribeFromEvent,
    isConnected
  };

  return (
    <WebSocketEventContext.Provider value={value}>
      {children}
    </WebSocketEventContext.Provider>
  );
}