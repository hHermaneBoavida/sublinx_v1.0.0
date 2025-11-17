
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, MessageCircle, Share2, MapPin, Clock, Users, Crown, Zap,
  Check, Eye, AlertCircle, Loader2, Send, Lock, Shield, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import EventApprovedModal from "./EventApprovedModal";
import EventRequestModal from "./EventRequestModal";
import ShareModal from "./ShareModal";
import { motion } from "framer-motion";
import { CACHE_CONFIG } from "../shared/helpers";
import LazyImage from "./LazyImage";
import useRealtimeEvent from "../events/useRealtimeEvent";
import AttendeeCounter from "../events/AttendeeCounter";
import EventRatingDisplay from "../reviews/EventRatingDisplay";

export default function EventFeedCard({
  event,
  user,
  isGuest,
  initialLikes = [],
  initialComments = [],
  initialRequestStatus,
  index = 0
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [previousAttendees, setPreviousAttendees] = useState(event.current_attendees || 0);

  const { event: realtimeEvent, isRealtime } = useRealtimeEvent(event.id);
  const displayEvent = realtimeEvent || event;

  useEffect(() => {
    if (displayEvent.current_attendees !== previousAttendees) {
      setPreviousAttendees(displayEvent.current_attendees);
    }
  }, [displayEvent.current_attendees, previousAttendees]);

  const { data: organizerData } = useQuery({
    queryKey: ['organizer', event.organizer_id],
    queryFn: async () => {
      if (!event.organizer_id) return null;
      try {
        const users = await base44.entities.User.filter({ id: event.organizer_id });
        return users?.[0] || null;
      } catch {
        return null;
      }
    },
    ...CACHE_CONFIG.SHORT,
    initialData: null,
    enabled: !!event.organizer_id,
  });

  const { data: eventReviews = [] } = useQuery({
    queryKey: ['eventReviews', event.id],
    queryFn: () => base44.entities.EventReview.filter({ event_id: event.id }),
    enabled: !!event.id,
    ...CACHE_CONFIG.LONG,
    initialData: [],
  });

  const organizerName = organizerData?.full_name || event.organizer;
  const organizerAvatar = organizerData?.avatar_url || event.organizer_avatar || `https://i.pravatar.cc/40?u=${event.organizer_id}`;
  const isEventOrganizer = user?.id === event.organizer_id;

  const handleNavigateToProfile = (e) => {
    e.stopPropagation();
    if (event.organizer_id) {
      navigate(createPageUrl("PerfilUsuario") + `?id=${event.organizer_id}`);
    }
  };

  useEffect(() => {
    setLikes(initialLikes?.length || 0);
    setComments(initialComments || []);
    setRequestStatus(initialRequestStatus);
    if (user && initialLikes) {
      setIsLiked(!!initialLikes.find(like => like.user_id === user.id));
    }
  }, [initialLikes, initialComments, initialRequestStatus, user]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        const existingLike = initialLikes.find(l => l.user_id === user.id);
        if (existingLike) {
          await base44.entities.Like.delete(existingLike.id);
        }
      } else {
        await base44.entities.Like.create({ user_id: user.id, event_id: event.id });

        if (event.organizer_id && event.organizer_id !== user.id) {
          try {
            await base44.entities.Notification.create({
              user_id: event.organizer_id,
              type: 'event_alert',
              title: '❤️ Nova curtida!',
              message: `${user.full_name || user.email} curtiu "${event.title}"`,
              event_id: event.id,
              is_read: false
            });
          } catch (e) {
            console.log("Erro ao notificar:", e);
          }
        }
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
      const newCommentData = await base44.entities.Comment.create({
        user_id: user.id,
        event_id: event.id,
        content: commentText,
        user_name: user.full_name || user.email?.split('@')[0]
      });

      if (event.organizer_id && event.organizer_id !== user.id) {
        try {
          await base44.entities.Notification.create({
            user_id: event.organizer_id,
            type: 'new_message',
            title: '💬 Novo comentário!',
            message: `${user.full_name || user.email} comentou em "${event.title}"`,
            event_id: event.id,
            is_read: false
          });
        } catch (e) {
          console.log("Erro ao notificar:", e);
        }
      }

      return newCommentData;
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
    if (!likeMutation.isPending) {
      likeMutation.mutate();
    }
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
    if (!isEventOrganizer || !window.confirm('Remover este comentário?')) return;
    deleteCommentMutation.mutate(commentId);
  };

  if (!displayEvent?.location) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
          delay: Math.min(index * 0.05, 0.3)
        }}
      >
        <Card className="bg-gray-900/95 border-0 text-white overflow-hidden shadow-none rounded-none relative">
          <CardHeader className="p-2.5 pb-1.5 relative z-10">
            <div className="flex items-center gap-2">
              <motion.img
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                src={organizerAvatar}
                alt={organizerName}
                className="w-8 h-8 rounded-full object-cover border-2 cursor-pointer"
                style={{
                  borderColor: 'rgba(6, 182, 212, 0.5)',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
                }}
                onClick={handleNavigateToProfile}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p
                    className="font-semibold text-xs cursor-pointer hover:text-cyan-400 transition-colors truncate"
                    onClick={handleNavigateToProfile}
                  >
                    {organizerName}
                  </p>
                  {organizerData?.is_organizer && (
                    <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-[8px] px-0.5 py-0 h-3.5">
                      <Shield className="w-2 h-2 mr-0.5" />
                      ORG
                    </Badge>
                  )}
                  {isRealtime && (
                    <Badge className="bg-green-600/20 border-green-500/50 text-green-300 text-[8px] px-1 py-0 h-3.5">
                      <motion.div
                        className="w-1 h-1 rounded-full bg-green-500 mr-0.5"
                        animate={{
                          boxShadow: [
                            '0 0 3px rgba(34, 197, 94, 0.8)',
                            '0 0 6px rgba(34, 197, 94, 1)',
                            '0 0 3px rgba(34, 197, 94, 0.8)'
                          ]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      LIVE
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 truncate">{displayEvent.location?.city || "Local Desconhecido"}</p>
              </div>
              {displayEvent.is_secret && (
                <Badge className="bg-purple-600/90 border border-purple-400 text-white font-bold px-1.5 py-0 text-[9px] h-4">
                  🔒
                </Badge>
              )}
            </div>
          </CardHeader>

          <LazyImage
            src={displayEvent.image_url || `https://picsum.photos/800/450?random=${displayEvent.id}`}
            alt={displayEvent.title}
            aspectRatio="16/9"
            className="cursor-pointer"
          >
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => {
                if (isGuest) {
                  navigate(createPageUrl("BemVindo"));
                } else if (!user.is_pro_member) {
                  setShowUpgradePrompt(true);
                }
              }}
            >
              {!user?.is_pro_member && !isGuest && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute top-1.5 right-1.5 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border"
                  style={{
                    background: 'linear-gradient(to right, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.7)'
                  }}
                >
                  <Lock className="w-2 h-2 text-white" />
                  <span className="text-white text-[9px] font-bold">PRO</span>
                </motion.div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {displayEvent.vibe_tags?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-1.5 left-1.5 flex flex-wrap gap-1"
                >
                  {displayEvent.vibe_tags.slice(0, 2).map((tag, idx) => (
                    <Badge
                      key={idx}
                      className="backdrop-blur-md border text-[9px] px-1 py-0"
                      style={{
                        background: 'linear-gradient(to right, rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.9))',
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </motion.div>
              )}
            </div>
          </LazyImage>

          <CardContent className="p-2.5 pt-1.5 space-y-1.5 relative z-10">
            {eventReviews.length > 0 && (
              <div className="mb-1.5">
                <EventRatingDisplay reviews={eventReviews} compact={true} />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:text-red-500 h-7 px-1.5" 
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="ml-1 text-xs">{likes}</span>
                </Button>

                <Button variant="ghost" size="sm" className="hover:text-cyan-400 h-7 px-1.5" onClick={handleComment}>
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="ml-1 text-xs">{comments.length}</span>
                </Button>

                <Button variant="ghost" size="sm" className="hover:text-green-400 h-7 px-1.5" onClick={() => setShowShareModal(true)}>
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="border-cyan-500/30 h-6 text-[10px] px-2"
                onClick={() => user?.is_pro_member ? alert("🎉 Detalhes PRO") : setShowUpgradePrompt(true)}
              >
                {user?.is_pro_member ? <><Eye className="w-2.5 h-2.5 mr-0.5" />Ver+</> : <><Lock className="w-2.5 h-2.5 mr-0.5" />PRO</>}
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-0.5 line-clamp-1">{displayEvent.title}</h3>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
                <div className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{format(new Date(displayEvent.date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[120px]">{displayEvent.location?.venue_name || displayEvent.location?.city}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-1">
                <Badge className="border text-[9px] px-1 py-0 h-4" style={{ background: 'rgba(6, 182, 212, 0.2)', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#06B6D4' }}>
                  {displayEvent.genre}
                </Badge>
                <Badge className="border text-[9px] px-1 py-0 h-4" style={{ background: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#A855F7' }}>
                  {displayEvent.type}
                </Badge>
              </div>

              {displayEvent.description && (
                <p className="mt-1 text-[10px] text-gray-300 line-clamp-1">{displayEvent.description}</p>
              )}
            </div>

            <div className="p-2 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <AttendeeCounter
                currentAttendees={displayEvent.current_attendees || 0}
                maxCapacity={displayEvent.max_capacity || 0}
                previousCount={previousAttendees}
                isRealtime={isRealtime}
                compact={true}
              />
            </div>

            {requestStatus ? (
              <div className="flex items-center justify-between p-1.5 rounded-lg border" style={{
                background: requestStatus === 'approved' ? 'rgba(16, 185, 129, 0.15)' : requestStatus === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderColor: requestStatus === 'approved' ? 'rgba(16, 185, 129, 0.4)' : requestStatus === 'pending' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'
              }}>
                {requestStatus === 'approved' ? (
                  <>
                    <div className="flex items-center gap-1 text-green-400">
                      <Check className="w-3 h-3" />
                      <span className="font-semibold text-[10px]">Aprovado!</span>
                    </div>
                    <Button onClick={() => setShowApprovedModal(true)} className="h-6 text-[10px] px-2 bg-green-600">
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
            ) : displayEvent.requires_approval ? (
              <Button
                onClick={() => isGuest ? navigate(createPageUrl("BemVindo")) : setShowRequestModal(true)}
                className="w-full h-8 text-xs bg-gradient-to-r from-cyan-600 to-purple-600"
              >
                <Zap className="w-3 h-3 mr-1" />
                Solicitar Acesso
              </Button>
            ) : (
              <Button
                onClick={() => navigate(createPageUrl("ComprarIngresso") + `?eventId=${displayEvent.id}`)}
                className="w-full h-8 text-xs bg-gradient-to-r from-green-600 to-emerald-600"
              >
                <Users className="w-3 h-3 mr-1" />
                Comprar Ingresso
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="bg-gray-900 border-purple-500 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Recurso PRO
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Ver detalhes completos é exclusivo para membros PRO.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowUpgradePrompt(false)} className="flex-1">
              Continuar Grátis
            </Button>
            <Button onClick={() => { setShowUpgradePrompt(false); navigate(createPageUrl("Planos")); }} className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600">
              <Crown className="w-4 h-4 mr-2" />
              Ver Planos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="bg-gray-900 border-cyan-500 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Comentários ({comments.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-gray-800/50 rounded-lg relative group">
                <img src={`https://i.pravatar.cc/40?u=${comment.user_id}`} alt={comment.user_name} className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{comment.user_name}</p>
                  <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                </div>
                {isEventOrganizer && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {comments.length === 0 && <p className="text-center text-gray-400 py-8">Seja o primeiro a comentar!</p>}
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Comentar..."
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

      {showApprovedModal && <EventApprovedModal event={displayEvent} onClose={() => setShowApprovedModal(false)} />}
      {showRequestModal && (
        <EventRequestModal 
          event={displayEvent} 
          user={user} 
          onClose={() => setShowRequestModal(false)} 
          onSuccess={(status) => { 
            setRequestStatus(status); 
            queryClient.invalidateQueries(['feedInteractions']);
            queryClient.invalidateQueries(['userTickets']);
          }} 
        />
      )}
      {showShareModal && <ShareModal event={displayEvent} onClose={() => setShowShareModal(false)} />}
    </>
  );
}
