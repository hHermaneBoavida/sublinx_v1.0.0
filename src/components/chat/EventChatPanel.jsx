import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Send, Pin, Trash2, MoreVertical,
  Shield, AlertCircle, Image as ImageIcon, X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EventChatPanel({ event, user, isOrganizer }) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Buscar ou criar chat do evento
  const { data: eventChat } = useQuery({
    queryKey: ['eventChat', event.id],
    queryFn: async () => {
      // Buscar chat existente
      const chats = await base44.entities.Chat.filter({
        event_id: event.id,
        type: "event"
      });

      if (chats && chats.length > 0) {
        return chats[0];
      }

      // Criar chat do evento se não existir
      return await base44.entities.Chat.create({
        name: `Chat - ${event.title}`,
        type: "event",
        creator_id: event.organizer_id,
        participants: [event.organizer_id],
        event_id: event.id,
        is_private: false,
        description: `Chat ao vivo do evento ${event.title}`
      });
    },
    staleTime: Infinity, // Chat do evento não muda
  });

  // Buscar mensagens do chat (polling a cada 3 segundos para simular tempo real)
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', eventChat?.id],
    queryFn: async () => {
      if (!eventChat) return [];
      
      const msgs = await base44.entities.ChatMessage.filter({
        chat_id: eventChat.id,
        is_deleted: false
      }, "created_date");

      return msgs || [];
    },
    enabled: !!eventChat,
    refetchInterval: 3000, // Atualizar a cada 3 segundos
    initialData: [],
  });

  // Buscar mensagens fixadas
  const pinnedMessages = messages.filter(m => m.is_pinned);

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const newMsg = await base44.entities.ChatMessage.create({
        chat_id: eventChat.id,
        sender_id: user.id,
        sender_name: user.full_name || user.email.split('@')[0],
        message: messageData.message,
        message_type: "text",
        reply_to: messageData.reply_to || null
      });

      // Atualizar timestamp do chat
      await base44.entities.Chat.update(eventChat.id, {
        last_message_at: new Date().toISOString()
      });

      return newMsg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages', eventChat?.id]);
      setMessage("");
      setReplyingTo(null);
    },
  });

  // Mutation para fixar/desfixar mensagem (apenas organizador)
  const pinMessageMutation = useMutation({
    mutationFn: async ({ messageId, isPinned }) => {
      return await base44.entities.ChatMessage.update(messageId, {
        is_pinned: !isPinned
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages', eventChat?.id]);
    },
  });

  // Mutation para deletar mensagem (apenas organizador)
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      return await base44.entities.ChatMessage.update(messageId, {
        is_deleted: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages', eventChat?.id]);
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !eventChat) return;

    sendMessageMutation.mutate({
      message: message.trim(),
      reply_to: replyingTo?.id
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!eventChat) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900/50 rounded-lg border border-gray-700">
      {/* Header com Mensagens Fixadas */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Chat ao Vivo</h3>
            <Badge className="bg-green-600">
              {messages.length} mensagens
            </Badge>
          </div>
          {isOrganizer && (
            <Badge className="bg-purple-600">
              <Shield className="w-3 h-3 mr-1" />
              Moderador
            </Badge>
          )}
        </div>

        {/* Mensagens Fixadas */}
        {pinnedMessages.length > 0 && (
          <div className="mt-3 space-y-2">
            {pinnedMessages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2"
              >
                <div className="flex items-start gap-2">
                  <Pin className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-yellow-300">
                      {msg.sender_name}
                    </p>
                    <p className="text-sm text-white">{msg.message}</p>
                  </div>
                  {isOrganizer && (
                    <button
                      onClick={() => pinMessageMutation.mutate({ messageId: msg.id, isPinned: true })}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Área de Mensagens */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: '500px' }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMyMessage = msg.sender_id === user?.id;
            const replyingToMessage = msg.reply_to 
              ? messages.find(m => m.id === msg.reply_to)
              : null;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={`https://i.pravatar.cc/40?u=${msg.sender_id}`}
                  alt={msg.sender_name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                
                <div className={`flex flex-col max-w-[70%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400">
                      {msg.sender_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(msg.created_date), 'HH:mm')}
                    </span>
                  </div>

                  {/* Mensagem de Resposta */}
                  {replyingToMessage && (
                    <div className="bg-gray-800/50 border-l-2 border-cyan-500 rounded px-2 py-1 mb-1 text-xs">
                      <p className="text-gray-400 font-semibold">
                        {replyingToMessage.sender_name}
                      </p>
                      <p className="text-gray-500 truncate max-w-xs">
                        {replyingToMessage.message}
                      </p>
                    </div>
                  )}

                  <div className="relative group">
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isMyMessage
                          ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>

                    {/* Menu de Ações */}
                    <div className={`absolute ${isMyMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-1/2 -translate-y-1/2 px-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full bg-gray-800/90 hover:bg-gray-700"
                          >
                            <MoreVertical className="w-4 h-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem
                            onClick={() => setReplyingTo(msg)}
                            className="text-gray-300 hover:bg-gray-700"
                          >
                            Responder
                          </DropdownMenuItem>
                          
                          {isOrganizer && (
                            <>
                              <DropdownMenuItem
                                onClick={() => pinMessageMutation.mutate({ 
                                  messageId: msg.id, 
                                  isPinned: msg.is_pinned 
                                })}
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                <Pin className="w-4 h-4 mr-2" />
                                {msg.is_pinned ? 'Desafixar' : 'Fixar Mensagem'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Deletar esta mensagem?")) {
                                    deleteMessageMutation.mutate(msg.id);
                                  }
                                }}
                                className="text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Deletar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="p-4 border-t border-gray-700">
        {/* Preview de Resposta */}
        {replyingTo && (
          <div className="mb-2 bg-gray-800/50 border-l-2 border-cyan-500 rounded px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-400">
                  Respondendo a {replyingTo.sender_name}
                </p>
                <p className="text-sm text-white truncate">
                  {replyingTo.message}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-800 border-gray-600 text-white"
            maxLength={500}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{message.length}/500 caracteres</span>
          {isOrganizer && (
            <span className="flex items-center gap-1 text-purple-400">
              <Shield className="w-3 h-3" />
              Ferramentas de moderação ativas
            </span>
          )}
        </div>
      </div>
    </div>
  );
}