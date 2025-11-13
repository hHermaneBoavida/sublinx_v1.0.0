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
  const isMountedRef = useRef(true);

  // CORREÇÃO: Polling seguro com verificação de mount
  const pollEventUpdates = useCallback(async () => {
    if (!isMountedRef.current || !user?.id || subscribedEvents.current.size === 0) {
      return;
    }

    try {
      const eventIds = Array.from(subscribedEvents.current);
      
      const events = await Promise.allSettled(
        eventIds.map(async (eventId) => {
          try {
            const eventList = await base44.entities.Event.filter({ id: eventId });
            return eventList[0] || null;
          } catch {
            return null;
          }
        })
      );

      if (!isMountedRef.current) return;

      const updates = {};
      events.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const event = result.value;
          updates[event.id] = {
            current_attendees: event.current_attendees || 0,
            max_capacity: event.max_capacity || 0,
            status: event.status || 'active',
            updated_at: new Date().toISOString()
          };
        }
      });

      if (isMountedRef.current && Object.keys(updates).length > 0) {
        setEventUpdates(prev => ({ ...prev, ...updates }));
      }
      
    } catch (error) {
      // Silenciar erro para evitar spam no console
    }
  }, [user, queryClient]);

  // CORREÇÃO: Cleanup adequado do polling
  useEffect(() => {
    isMountedRef.current = true;

    if (subscribedEvents.current.size > 0 && user?.id) {
      setIsConnected(true);
      
      // OTIMIZAÇÃO: Polling mais espaçado (10s vs 5s)
      pollIntervalRef.current = setInterval(pollEventUpdates, 10000);
    } else {
      setIsConnected(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pollEventUpdates, user?.id]);

  const subscribeToEvent = useCallback((eventId) => {
    if (!eventId || !isMountedRef.current) return;
    
    subscribedEvents.current.add(eventId);
    
    // Trigger poll apenas se não tiver interval ativo
    if (!pollIntervalRef.current) {
      pollEventUpdates();
    }
  }, [pollEventUpdates]);

  const unsubscribeFromEvent = useCallback((eventId) => {
    if (!eventId || !isMountedRef.current) return;
    
    subscribedEvents.current.delete(eventId);
    
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