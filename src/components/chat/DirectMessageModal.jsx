import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Send, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function DirectMessageModal({ recipientUser, currentUser, onClose }) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState("");

  // Buscar ou criar chat direto - fetch only chats created by either participant to avoid fetching all direct chats
  const { data: directChat } = useQuery({
    queryKey: ['directChat', currentUser.id, recipientUser.id],
    queryFn: async () => {
      const [chatsAsCreator, chatsAsRecipient] = await Promise.all([
        base44.entities.Chat.filter({ type: "direct", creator_id: currentUser.id }),
        base44.entities.Chat.filter({ type: "direct", creator_id: recipientUser.id }),
      ]);

      const allChats = [...(chatsAsCreator || []), ...(chatsAsRecipient || [])];
      const existingChat = allChats.find(chat =>
        chat.participants?.includes(currentUser.id) &&
        chat.participants?.includes(recipientUser.id)
      );

      if (existingChat) {
        return existingChat;
      }

      return await base44.entities.Chat.create({
        name: `${currentUser.full_name || currentUser.email} & ${recipientUser.full_name || recipientUser.email}`,
        type: "direct",
        creator_id: currentUser.id,
        participants: [currentUser.id, recipientUser.id],
        is_private: true,
        description: "Mensagem direta"
      });
    },
  });

  // Buscar mensagens (polling a cada 2 segundos)
  const { data: messages = [] } = useQuery({
    queryKey: ['directMessages', directChat?.id],
    queryFn: async () => {
      if (!directChat) return [];
      
      const msgs = await base44.entities.ChatMessage.filter({
        chat_id: directChat.id,
        is_deleted: false
      }, "created_date");

      return msgs || [];
    },
    enabled: !!directChat,
    refetchInterval: 2000,
    initialData: [],
  });

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      const newMsg = await base44.entities.ChatMessage.create({
        chat_id: directChat.id,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name || currentUser.email.split('@')[0],
        message: messageText,
        message_type: "text"
      });

      // Atualizar timestamp do chat
      await base44.entities.Chat.update(directChat.id, {
        last_message_at: new Date().toISOString()
      });

      return newMsg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['directMessages', directChat?.id]);
      setMessage("");
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !directChat) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-cyan-500 text-white max-w-2xl h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={recipientUser.avatar_url || `https://i.pravatar.cc/40?u=${recipientUser.id}`}
                alt={recipientUser.full_name}
                className="w-10 h-10 rounded-full border-2 border-cyan-500/50"
              />
              <div>
                <DialogTitle className="text-lg">
                  {recipientUser.full_name || recipientUser.email}
                </DialogTitle>
                <p className="text-xs text-gray-400">Mensagem Direta</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!directChat ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400">
                Nenhuma mensagem ainda.
                <br />
                Seja o primeiro a enviar!
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isMyMessage = msg.sender_id === currentUser.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <img
                      src={
                        isMyMessage
                          ? currentUser.avatar_url || `https://i.pravatar.cc/40?u=${currentUser.id}`
                          : recipientUser.avatar_url || `https://i.pravatar.cc/40?u=${recipientUser.id}`
                      }
                      alt="avatar"
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />

                    <div className={`flex flex-col max-w-[70%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-gray-500 mb-1">
                        {format(new Date(msg.created_date), 'HH:mm', { locale: ptBR })}
                      </span>

                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isMyMessage
                            ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white'
                            : 'bg-gray-800 text-white'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
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
          <p className="text-xs text-gray-500 mt-2">
            {message.length}/500 caracteres
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}