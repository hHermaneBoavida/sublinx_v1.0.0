import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


export default function CommunityChat({ communityId, user }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['communityChat', communityId],
    queryFn: async () => {
      const chatId = `community-chat-${communityId}`;
      return await base44.entities.ChatMessage.filter({ chat_id: chatId }, 'created_date', 100);
    },
    enabled: !!communityId,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      // Moderação automática
      const moderation = await base44.functions.invoke('moderateContent', {
        content: content,
        communityId: communityId,
        contentType: 'message'
      });

      if (!moderation.data.allowed) {
        throw new Error('⚠️ Mensagem bloqueada por conteúdo inapropriado');
      }

      const chatId = `community-chat-${communityId}`;
      const finalContent = moderation.data.filtered_content || content;

      return await base44.entities.ChatMessage.create({
        chat_id: chatId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        message: finalContent,
        message_type: 'text'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityChat', communityId]);
      setMessage("");
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="bg-gray-900/50 border-gray-700 h-[600px] flex flex-col">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-cyan-400" />
          Chat em Grupo
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg, idx) => {
            const isOwn = msg.sender_id === user?.id;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={`https://i.pravatar.cc/32?u=${msg.sender_id}`}
                  alt={msg.sender_name}
                  className="w-8 h-8 rounded-full border border-cyan-500/30"
                />
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{msg.sender_name}</span>
                    <span className="text-[10px] text-gray-600">
                      {format(new Date(msg.created_date), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl ${
                    isOwn 
                      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white' 
                      : 'bg-gray-800 text-gray-200'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="w-12 h-12 mb-2" />
            <p className="text-sm">Nenhuma mensagem ainda. Inicie a conversa!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="bg-gray-800 border-gray-600 text-white"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}