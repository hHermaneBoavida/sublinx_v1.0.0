import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Loader2, Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CommunityFeed({ communityId, user }) {
  const [newPost, setNewPost] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['communityPosts', communityId],
    queryFn: async () => {
      const chatId = `community-${communityId}`;
      return await base44.entities.ChatMessage.filter({ chat_id: chatId }, '-created_date', 50);
    },
    enabled: !!communityId,
  });

  const { data: communityEvents = [] } = useQuery({
    queryKey: ['communityEvents', communityId],
    queryFn: async () => {
      return await base44.entities.Event.filter({ 
        community_id: communityId,
        date: { $gte: new Date().toISOString() }
      }, '-date', 10);
    },
    enabled: !!communityId,
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: async (content) => {
      const chatId = `community-${communityId}`;
      return await base44.entities.ChatMessage.create({
        chat_id: chatId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        message: content,
        message_type: 'text'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityPosts', communityId]);
      setNewPost("");
    }
  });

  const handlePost = () => {
    if (!newPost.trim()) return;
    createPostMutation.mutate(newPost);
  };

  return (
    <div className="space-y-4">
      {/* Post Input */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="pt-4">
          <Textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Compartilhe algo com a comunidade..."
            className="bg-gray-800 border-gray-600 text-white mb-3 resize-none"
            rows={3}
          />
          <Button
            onClick={handlePost}
            disabled={!newPost.trim() || createPostMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            {createPostMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Publicar
          </Button>
        </CardContent>
      </Card>

      {/* Community Events */}
      {communityEvents.length > 0 && (
        <Card className="bg-gray-900/50 border-purple-500/30">
          <CardHeader>
            <h3 className="font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Eventos da Comunidade ({communityEvents.length})
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {communityEvents.map(event => (
              <div
                key={event.id}
                onClick={() => navigate(createPageUrl("Feed"))}
                className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 cursor-pointer transition-all"
              >
                <img
                  src={event.image_url || `https://picsum.photos/80/80?random=${event.id}`}
                  alt={event.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(event.date), "dd MMM", { locale: ptBR })}</span>
                    <MapPin className="w-3 h-3 ml-2" />
                    <span>{event.location?.city}</span>
                  </div>
                </div>
                <Badge className="bg-purple-600/20 text-purple-300">{event.genre}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/30 transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={`https://i.pravatar.cc/40?u=${post.sender_id}`}
                      alt={post.sender_name}
                      className="w-10 h-10 rounded-full border-2 border-cyan-500/30"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{post.sender_name}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(post.created_date), "HH:mm · dd MMM", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{post.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 pt-2 border-t border-gray-800">
                    <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>Curtir</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>Comentar</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
          <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma publicação ainda. Seja o primeiro!</p>
        </div>
      )}
    </div>
  );
}