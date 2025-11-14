import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Search, Users, MessageCircle, Crown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_AVATAR } from "../components/shared/helpers";

export default function ChatOrganizadores() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      if (!userData?.is_organizer) {
        navigate(createPageUrl("BemVindo"));
        return null;
      }
      return userData;
    },
    retry: false,
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['organizers'],
    queryFn: async () => {
      const allOrganizers = await base44.entities.User.filter({ is_organizer: true });
      return allOrganizers.filter(o => o.id !== user?.id);
    },
    enabled: !!user,
  });

  const { data: myChats = [] } = useQuery({
    queryKey: ['organizerChats', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const chats = await base44.entities.Chat.filter({
        participants: { $in: [user.id] },
        type: 'direct'
      });
      return chats.sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date));
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat?.id) return [];
      return await base44.entities.ChatMessage.filter({ chat_id: selectedChat.id }, "created_date");
    },
    enabled: !!selectedChat?.id,
    refetchInterval: 3000,
  });

  const createChatMutation = useMutation({
    mutationFn: async (recipientId) => {
      const existingChat = myChats.find(chat => 
        chat.participants.includes(recipientId) && chat.participants.includes(user.id)
      );

      if (existingChat) return existingChat;

      const recipient = organizers.find(o => o.id === recipientId);
      return await base44.entities.Chat.create({
        name: `${user.full_name} • ${recipient.full_name}`,
        type: 'direct',
        creator_id: user.id,
        participants: [user.id, recipientId],
        is_private: true,
        last_message_at: new Date().toISOString()
      });
    },
    onSuccess: (newChat) => {
      queryClient.invalidateQueries(['organizerChats']);
      setSelectedChat(newChat);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      const message = await base44.entities.ChatMessage.create({
        chat_id: selectedChat.id,
        sender_id: user.id,
        sender_name: user.full_name,
        message: text,
        message_type: 'text'
      });

      await base44.entities.Chat.update(selectedChat.id, {
        last_message_at: new Date().toISOString()
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages']);
      queryClient.invalidateQueries(['organizerChats']);
      setMessageText("");
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleStartChat = (organizerId) => {
    createChatMutation.mutate(organizerId);
  };

  const filteredOrganizers = organizers.filter(org => 
    org.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOtherParticipant = (chat) => {
    const otherId = chat.participants.find(p => p !== user?.id);
    return organizers.find(o => o.id === otherId);
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/95 backdrop-blur-xl p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("Perfil"))}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
                Chat Organizadores
              </h1>
              <p className="text-xs text-gray-400">Troque experiências e dicas</p>
            </div>
          </div>
          <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
            <Crown className="w-3 h-3 mr-1" />
            Exclusivo
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-800 flex flex-col bg-gray-900/30">
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar organizador..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Chats List */}
          <div className="flex-1 overflow-y-auto">
            {myChats.length > 0 ? (
              <div className="p-2 space-y-1">
                {myChats.map(chat => {
                  const other = getOtherParticipant(chat);
                  if (!other) return null;

                  return (
                    <motion.div
                      key={chat.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 cursor-pointer transition-all ${
                          selectedChat?.id === chat.id
                            ? 'bg-cyan-600/20 border-cyan-500/50'
                            : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={other.avatar_url || DEFAULT_AVATAR}
                            alt={other.full_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{other.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {chat.last_message_at && format(new Date(chat.last_message_at), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Nenhuma conversa ainda</p>
              </div>
            )}

            {/* Available Organizers */}
            {filteredOrganizers.length > 0 && (
              <div className="p-4 border-t border-gray-800">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Organizadores
                </h3>
                <div className="space-y-2">
                  {filteredOrganizers.slice(0, 5).map(org => (
                    <motion.div
                      key={org.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        onClick={() => handleStartChat(org.id)}
                        className="p-2 cursor-pointer bg-gray-800/30 border-gray-700 hover:bg-gray-800 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={org.avatar_url || DEFAULT_AVATAR}
                            alt={org.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <p className="text-sm text-white truncate">{org.full_name}</p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-3">
                  {(() => {
                    const other = getOtherParticipant(selectedChat);
                    return (
                      <>
                        <img
                          src={other?.avatar_url || DEFAULT_AVATAR}
                          alt={other?.full_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500/30"
                        />
                        <div>
                          <h2 className="font-semibold text-white">{other?.full_name}</h2>
                          <p className="text-xs text-gray-400">Organizador</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isMe 
                            ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white' 
                            : 'bg-gray-800 text-white'
                        }`}>
                          <p className="text-sm break-words">{msg.message}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-cyan-100' : 'text-gray-500'}`}>
                            {format(new Date(msg.created_date), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-gray-900/50">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-gray-500 text-sm">
                  Ou inicie um chat com outro organizador
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}