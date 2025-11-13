import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const WebSocketContext = createContext(null);

export const useNotificationWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useNotificationWebSocket must be used within WebSocketNotificationProvider');
  }
  return context;
};

export default function WebSocketNotificationProvider({ children, user }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const queryClient = useQueryClient();

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  useEffect(() => {
    if (!user?.id) return;

    const connect = () => {
      try {
        // NOTA: Em produção, use wss:// e seu endpoint real
        // Por enquanto, usamos fallback para polling
        console.log('🔌 Tentando conectar WebSocket (fallback para polling)...');

        // Simular conexão WebSocket com polling otimizado
        const simulateWebSocket = () => {
          setIsConnected(true);
          console.log('✅ Sistema de notificações ativo (polling mode)');

          // Polling mais eficiente (30s)
          const pollInterval = setInterval(async () => {
            try {
              // Buscar apenas notificações não lidas dos últimos 60s
              const recentNotifications = await queryClient.fetchQuery({
                queryKey: ['realtimeNotifications', user.id],
                staleTime: 0 // Force fresh
              });

              if (recentNotifications && recentNotifications.length > 0) {
                setLastMessage({
                  type: 'notification',
                  data: recentNotifications[0],
                  timestamp: Date.now()
                });
              }
            } catch (error) {
              console.error('Erro no polling:', error);
            }
          }, 30000);

          return () => {
            clearInterval(pollInterval);
            setIsConnected(false);
          };
        };

        // Por enquanto, usar polling simulado
        return simulateWebSocket();

        /* 
        // CÓDIGO REAL PARA WEBSOCKET (quando backend estiver pronto):
        
        const ws = new WebSocket(`wss://your-api.com/notifications?userId=${user.id}`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket conectado');
          setIsConnected(true);
          reconnectAttempts.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Mensagem recebida:', message);

            if (message.type === 'notification') {
              setLastMessage(message);
              
              // Invalidar queries para atualizar UI
              queryClient.invalidateQueries(['notifications', user.id]);
              queryClient.invalidateQueries(['realtimeNotifications', user.id]);
            }
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ Erro no WebSocket:', error);
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket desconectado');
          setIsConnected(false);
          
          // Tentar reconectar
          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts.current++;
            console.log(`🔄 Tentando reconectar (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, RECONNECT_DELAY * reconnectAttempts.current);
          } else {
            console.log('❌ Máximo de tentativas de reconexão atingido. Usando polling...');
          }
        };
        */

      } catch (error) {
        console.error('Erro ao conectar WebSocket:', error);
        setIsConnected(false);
      }
    };

    const cleanup = connect();

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user?.id, queryClient]);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não conectado. Mensagem não enviada.');
    }
  };

  const value = {
    isConnected,
    lastMessage,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}