
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Play, 
  Pause, 
  MapPin, 
  Clock, 
  Users,
  Crown,
  Zap,
  Check,
  Eye,
  AlertCircle,
  Loader2,
  Send,
  Lock,
  Shield,
  Trash2,
  ExternalLink // Added ExternalLink icon
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import EventApprovedModal from "./EventApprovedModal";
import EventRequestModal from "./EventRequestModal";
import ShareModal from "./ShareModal";

export default function EventFeedCard({ 
  event, 
  user, 
  isGuest,
  initialLikes = [],
  initialComments = [],
  initialRequestStatus
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [likes, setLikes] = useState(initialLikes.length || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState(initialComments || []);
  const [requestStatus, setRequestStatus] = useState(initialRequestStatus);
  
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newComment, setNewComment] = useState("");

  const isExternalEvent = event.external_source && event.external_source !== 'native';

  // BUSCAR DADOS ATUALIZADOS DO ORGANIZADOR SEMPRE
  const { data: organizerData, refetch: refetchOrganizer } = useQuery({
    queryKey: ['organizer', event.organizer_id],
    queryFn: async () => {
      if (!event.organizer_id) return null;
      
      try {
        const users = await base44.entities.User.filter({ id: event.organizer_id });
        if (users && users.length > 0) {
          return users[0];
        }
        return null;
      } catch {
        return null;
      }
    },
    staleTime: 30 * 1000,
    cacheTime: 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    initialData: null,
    enabled: !!event.organizer_id,
  });

  const organizerName = organizerData?.full_name || event.organizer;
  const organizerAvatar = organizerData?.avatar_url || event.organizer_avatar || `https://i.pravatar.cc/40?u=${event.organizer_id}`;
  
  const isEventOrganizer = user?.id === event.organizer_id;

  const handleNavigateToOrganizer = () => {
    if (!event.organizer_id) {
      console.error("❌ Organizador ID não encontrado");
      return;
    }
    
    console.log("✅ Navegando para perfil do organizador:", event.organizer_id);
    navigate(createPageUrl("PerfilUsuario") + `?id=${event.organizer_id}`);
  };

  useEffect(() => {
    setLikes(initialLikes?.length || 0);
    setComments(initialComments || []);
    setRequestStatus(initialRequestStatus);

    if (user && initialLikes) {
      setIsLiked(!!initialLikes.find(like => like.user_id === user.id));
    }
  }, [initialLikes, initialComments, initialRequestStatus, user]);

  const handleOpenEventDetails = () => {
    if (isGuest) {
      navigate(createPageUrl("BemVindo"));
      return;
    }

    if (!user.is_pro_member) {
      setShowUpgradePrompt(true);
      return;
    }

    refetchOrganizer();
    alert("🎉 Detalhes do evento (apenas PRO)");
  };

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        const existingLike = initialLikes.find(l => l.user_id === user.id);
        if (existingLike) {
          await base44.entities.Like.delete(existingLike.id);
        }
      } else {
        await base44.entities.Like.create({
          user_id: user.id,
          event_id: event.id
        });
      }
    },
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    },
    onError: () => {
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev + 1 : Math.max(0, prev - 1));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feedInteractions']);
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (commentText) => {
      return await base44.entities.Comment.create({
        user_id: user.id,
        event_id: event.id,
        content: commentText,
        user_name: user.full_name || user.email?.split('@')[0]
      });
    },
    onSuccess: (newCommentData) => {
      setComments(prev => [...prev, newCommentData]);
      setNewComment("");
      queryClient.invalidateQueries(['feedInteractions']);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.Comment.delete(commentId);
    },
    onSuccess: (_, commentId) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
      queryClient.invalidateQueries(['feedInteractions']);
      alert('✅ Comentário removido');
    },
    onError: () => {
      alert('❌ Erro ao remover comentário');
    }
  });

  const handleLike = () => {
    if (isGuest) {
      navigate(createPageUrl("BemVindo"));
      return;
    }

    likeMutation.mutate();
  };

  const handleComment = () => {
    if (isGuest) {
      navigate(createPageUrl("BemVindo"));
      return;
    }

    setShowComments(true);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  const handleDeleteComment = (commentId) => {
    if (!isEventOrganizer) return;
    
    if (window.confirm('Tem certeza que deseja remover este comentário?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleRequestAccess = () => {
    if (isGuest) {
      navigate(createPageUrl("BemVindo"));
      return;
    }

    // Se for evento externo, redirecionar para URL externa
    if (isExternalEvent && event.external_url) {
      window.open(event.external_url, '_blank');
      return;
    }

    setShowRequestModal(true);
  };

  const handleBuyTicket = () => {
    if (isGuest) {
      navigate(createPageUrl("BemVindo"));
      return;
    }

    // Se for evento externo, redirecionar para URL externa
    if (isExternalEvent && event.external_url) {
      window.open(event.external_url, '_blank');
      return;
    }

    navigate(createPageUrl("ComprarIngresso") + `?eventId=${event.id}`);
  };

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
  };

  if (!event || !event.location) {
    return null;
  }

  return (
    <>
      <Card className="bg-gray-900/95 border-0 text-white overflow-hidden shadow-none rounded-none">
        {/* Header Ultra Compacto */}
        <CardHeader className="p-2.5 pb-1.5">
          <div className="flex items-center gap-2">
            <img 
              src={organizerAvatar}
              alt={organizerName}
              className="w-8 h-8 rounded-full object-cover border border-cyan-500/50 cursor-pointer hover:border-cyan-400 transition-colors"
              onClick={handleNavigateToOrganizer}
              key={organizerAvatar}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p 
                  className="font-semibold text-xs cursor-pointer hover:text-cyan-400 transition-colors truncate"
                  onClick={handleNavigateToOrganizer}
                >
                  {organizerName}
                </p>
                {organizerData?.is_organizer && (
                  <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-[8px] px-0.5 py-0 h-3.5">
                    <Shield className="w-2 h-2 mr-0.5" />
                    ORG
                  </Badge>
                )}
                {isExternalEvent && (
                  <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-300 text-[8px] px-0.5 py-0 h-3.5">
                    <ExternalLink className="w-2 h-2 mr-0.5" />
                    {event.external_source?.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-gray-400 truncate">{event.location?.city || "Local Desconhecido"}</p>
            </div>
            {event.is_secret && (
              <Badge className="bg-purple-600/90 border border-purple-400 text-white font-bold px-1.5 py-0 shadow-lg shadow-purple-500/50 text-[9px] h-4">
                🔒
              </Badge>
            )}
          </div>
        </CardHeader>
        
        {/* BANNER Otimizado */}
        <div 
          className="relative w-full bg-gray-800 cursor-pointer overflow-hidden"
          style={{ aspectRatio: '16/9' }}
          onClick={handleOpenEventDetails}
        >
          <img
            src={event.image_url || `https://picsum.photos/800/450?random=${event.id}`}
            alt={event.title}
            className="w-full h-full object-cover object-center"
          />
          
          {!user?.is_pro_member && !isGuest && (
            <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
              <Lock className="w-2 h-2 text-white" />
              <span className="text-white text-[9px] font-bold">PRO</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
          
          {event.audio_preview_url && (
            <Button
              size="icon"
              className="absolute bottom-1.5 right-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-sm border border-white/20 z-10 h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayAudio();
              }}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
          )}
          
          {event.vibe_tags && event.vibe_tags.length > 0 && (
            <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1 z-10">
              {event.vibe_tags.slice(0, 2).map((tag, index) => (
                <Badge 
                  key={index} 
                  className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md border-0 shadow-lg text-[9px] px-1 py-0"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Content Ultra Compacto */}
        <CardContent className="p-2.5 pt-1.5 space-y-1.5">
          {/* Actions Minimalistas */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:text-red-500 transition-colors h-7 px-1.5 min-w-0"
                onClick={handleLike}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="ml-1 text-xs">{likes}</span>
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:text-cyan-400 transition-colors h-7 px-1.5 min-w-0"
                onClick={handleComment}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="ml-1 text-xs">{comments.length}</span>
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:text-green-400 transition-colors h-7 px-1.5 min-w-0"
                onClick={handleShare}
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Button 
              size="sm" 
              variant="outline" 
              className={`border-cyan-500/30 h-6 text-[10px] px-2 ${
                user?.is_pro_member 
                  ? 'text-cyan-300 hover:bg-cyan-500/10' 
                  : 'text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleOpenEventDetails}
            >
              {user?.is_pro_member ? (
                <>
                  <Eye className="w-2.5 h-2.5 mr-0.5" />
                  Ver+
                </>
              ) : (
                <>
                  <Lock className="w-2.5 h-2.5 mr-0.5" />
                  PRO
                </>
              )}
            </Button>
          </div>
          
          {/* Info Ultra Compacta */}
          <div>
            <h3 className="text-sm font-bold mb-0.5 line-clamp-1">{event.title}</h3>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
              <div className="flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span>{format(new Date(event.date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate max-w-[120px]">{event.location?.venue_name || event.location?.city}</span>
              </div>
            </div>
            
            {/* Badges Minimalistas */}
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-[9px] px-1 py-0 h-4">
                {event.genre}
              </Badge>
              <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-[9px] px-1 py-0 h-4">
                {event.type}
              </Badge>
              {event.minimum_level > 1 && (
                <Badge className="bg-orange-600/20 border-orange-500/30 text-orange-300 text-[9px] px-1 py-0 h-4">
                  <Crown className="w-2 h-2 mr-0.5" />
                  Nv{event.minimum_level}+
                </Badge>
              )}
            </div>

            {/* Descrição Compacta */}
            {event.description && (
              <p className="mt-1 text-[10px] text-gray-300 line-clamp-1">
                {event.description}
              </p>
            )}
          </div>

          {/* CTA Ultra Compacto - MODIFICADO PARA EVENTOS EXTERNOS */}
          {isExternalEvent ? (
            <Button 
              onClick={handleBuyTicket}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-8 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Ver no {event.external_source}
            </Button>
          ) : requestStatus ? (
            <div className="flex items-center justify-between p-1.5 bg-gray-800/50 rounded-lg">
              {requestStatus === 'approved' ? (
                <>
                  <div className="flex items-center gap-1 text-green-400">
                    <Check className="w-3 h-3" />
                    <span className="font-semibold text-[10px]">Aprovado!</span>
                  </div>
                  <Button 
                    onClick={() => setShowApprovedModal(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-6 text-[10px] px-2"
                  >
                    Ingresso
                  </Button>
                </>
              ) : requestStatus === 'pending' ? (
                <>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Clock className="w-3 h-3" />
                    <span className="font-semibold text-[10px]">Pendente</span>
                  </div>
                  <Button variant="outline" disabled className="border-gray-600 h-6 text-[10px] px-2">
                    Aguardando
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <span className="font-semibold text-[10px]">Negado</span>
                  </div>
                  <Button variant="outline" disabled className="border-gray-600 h-6 text-[10px] px-2">
                    Negado
                  </Button>
                </>
              )}
            </div>
          ) : event.requires_approval ? (
            <Button 
              onClick={handleRequestAccess}
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 h-8 text-xs"
            >
              <Zap className="w-3 h-3 mr-1" />
              Solicitar Acesso
            </Button>
          ) : (
            <Button 
              onClick={handleBuyTicket}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-8 text-xs"
            >
              <Users className="w-3 h-3 mr-1" />
              Comprar Ingresso
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="bg-gray-900 border-purple-500 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Recurso PRO - Detalhes do Evento
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Ver detalhes completos do evento é exclusivo para membros PRO.
              <br />
              <br />
              <strong className="text-white">Mas você pode:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>✅ Curtir eventos</li>
                <li>✅ Comentar em eventos</li>
                <li>✅ Solicitar acesso</li>
                <li>✅ Compartilhar com amigos</li>
              </ul>
              <br />
              Faça upgrade para desbloquear tudo!
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowUpgradePrompt(false)} className="flex-1">
              Continuar Grátis
            </Button>
            <Button
              onClick={() => {
                setShowUpgradePrompt(false);
                navigate(createPageUrl("Planos"));
              }}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Ver Planos PRO
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="bg-gray-900 border-cyan-500 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Comentários ({comments.length})
              {isEventOrganizer && (
                <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Moderador
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={comment.id || index} className="flex gap-3 p-3 bg-gray-800/50 rounded-lg relative group">
                <img
                  src={`https://i.pravatar.cc/40?u=${comment.user_id}`}
                  alt={comment.user_name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{comment.user_name}</p>
                  <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                </div>
                
                {isEventOrganizer && comment.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                    title="Remover comentário (moderador)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-400 py-8">Nenhum comentário ainda. Seja o primeiro!</p>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Button onClick={handleSubmitComment} disabled={!newComment.trim() || commentMutation.isPending}>
              {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showApprovedModal && (
        <EventApprovedModal
          event={event}
          onClose={() => setShowApprovedModal(false)}
        />
      )}

      {showRequestModal && (
        <EventRequestModal
          event={event}
          user={user}
          onClose={() => setShowRequestModal(false)}
          onSuccess={(status) => {
            setRequestStatus(status);
            queryClient.invalidateQueries(['feedInteractions']);
          }}
        />
      )}

      {showShareModal && (
        <ShareModal
          event={event}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
