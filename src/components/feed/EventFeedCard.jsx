
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
  Trash2
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
import { motion, AnimatePresence } from "framer-motion";

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

        // NOVO: Notificar organizador sobre nova curtida
        if (event.organizer_id && event.organizer_id !== user.id) {
          try {
            await base44.entities.Notification.create({
              user_id: event.organizer_id,
              type: 'event_alert',
              title: '❤️ Nova curtida no seu evento!',
              message: `${user.full_name || user.email} curtiu "${event.title}"`,
              event_id: event.id,
              is_read: false,
              location_match: [],
              genre_match: []
            });
          } catch (notifError) {
            console.log("Erro ao notificar organizador:", notifError);
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

      // NOVO: Notificar organizador sobre novo comentário
      if (event.organizer_id && event.organizer_id !== user.id) {
        try {
          await base44.entities.Notification.create({
            user_id: event.organizer_id,
            type: 'new_message',
            title: '💬 Novo comentário no seu evento!',
            message: `${user.full_name || user.email} comentou em "${event.title}"`,
            event_id: event.id,
            is_read: false,
            location_match: [],
            genre_match: []
          });
        } catch (notifError) {
          console.log("Erro ao notificar organizador:", notifError);
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

    setShowRequestModal(true);
  };

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
  };

  if (!event || !event.location) {
    return null;
  }

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
          mass: 0.8
        }}
      >
        <Card className="bg-gray-900/95 border-0 text-white overflow-hidden shadow-none rounded-none relative">
          {/* NOVO: Glow sutil no hover */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.08) 0%, transparent 60%)',
            }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Header Ultra Compacto */}
          <CardHeader className="p-2.5 pb-1.5 relative z-10">
            <div className="flex items-center gap-2">
              <motion.img
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                src={organizerAvatar}
                alt={organizerName}
                className="w-8 h-8 rounded-full object-cover border-2 cursor-pointer transition-all"
                style={{
                  borderColor: 'rgba(6, 182, 212, 0.5)',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
                }}
                onClick={handleNavigateToOrganizer}
                key={organizerAvatar}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <motion.p
                    whileHover={{ x: 2 }}
                    className="font-semibold text-xs cursor-pointer hover:text-cyan-400 transition-colors truncate"
                    style={{
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                    }}
                    onClick={handleNavigateToOrganizer}
                  >
                    {organizerName}
                  </motion.p>
                  {organizerData?.is_organizer && (
                    <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-[8px] px-0.5 py-0 h-3.5">
                      <Shield className="w-2 h-2 mr-0.5" />
                      ORG
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 truncate">{event.location?.city || "Local Desconhecido"}</p>
              </div>
              {event.is_secret && (
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 15px rgba(168, 85, 247, 0.5)',
                      '0 0 25px rgba(168, 85, 247, 0.8)',
                      '0 0 15px rgba(168, 85, 247, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge className="bg-purple-600/90 border border-purple-400 text-white font-bold px-1.5 py-0 text-[9px] h-4">
                    🔒
                  </Badge>
                </motion.div>
              )}
            </div>
          </CardHeader>

          {/* BANNER com Hover Effect */}
          <motion.div
            className="relative w-full bg-gray-800 cursor-pointer overflow-hidden group"
            style={{ aspectRatio: '16/9' }}
            onClick={handleOpenEventDetails}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <motion.img
              src={event.image_url || `https://picsum.photos/800/450?random=${event.id}`}
              alt={event.title}
              className="w-full h-full object-cover object-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* NOVO: Overlay Neon ao Hover */}
            <motion.div
              className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
              style={{
                background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
              }}
              transition={{ duration: 0.3 }}
            />

            {!user?.is_pro_member && !isGuest && (
              <motion.div
                className="absolute top-1.5 right-1.5 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border"
                style={{
                  background: 'linear-gradient(to right, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.7)'
                }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(251, 191, 36, 0.7)',
                    '0 0 30px rgba(251, 191, 36, 0.9)',
                    '0 0 20px rgba(251, 191, 36, 0.7)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Lock className="w-2 h-2 text-white" />
                <span className="text-white text-[9px] font-bold">PRO</span>
              </motion.div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

            {event.audio_preview_url && (
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  size="icon"
                  className="absolute bottom-1.5 right-1.5 rounded-full backdrop-blur-sm border border-white/20 z-10 h-7 w-7 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(17,24,39,0.6))',
                    boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAudio();
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)'
                    }}
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {isPlaying ? <Pause className="w-3 h-3 relative z-10" /> : <Play className="w-3 h-3 relative z-10" />}
                </Button>
              </motion.div>
            )}

            {event.vibe_tags && event.vibe_tags.length > 0 && (
              <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1 z-10">
                {event.vibe_tags.slice(0, 2).map((tag, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Badge
                      className="backdrop-blur-md border shadow-lg text-[9px] px-1 py-0 relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(to right, rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.9))',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 0 15px rgba(168, 85, 247, 0.6)'
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1/2"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)'
                        }}
                      />
                      <span className="relative z-10">#{tag}</span>
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Content Ultra Compacto */}
          <CardContent className="p-2.5 pt-1.5 space-y-1.5 relative z-10">
            {/* Actions Minimalistas com Micro-interações */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:text-red-500 transition-colors h-7 px-1.5 min-w-0 relative"
                    onClick={handleLike}
                  >
                    {/* Glow ao redor quando liked */}
                    <AnimatePresence>
                      {isLiked && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 0.6 }}
                          exit={{ scale: 2, opacity: 0 }}
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, transparent 70%)',
                            filter: 'blur(8px)',
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <Heart
                      className={`w-3.5 h-3.5 transition-all ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                      style={{
                        filter: isLiked ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.9))' : 'none'
                      }}
                    />
                    <span className="ml-1 text-xs">{likes}</span>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:text-cyan-400 transition-colors h-7 px-1.5 min-w-0"
                    onClick={handleComment}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="ml-1 text-xs">{comments.length}</span>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:text-green-400 transition-colors h-7 px-1.5 min-w-0"
                    onClick={handleShare}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              </div>

              <motion.div
                whileHover={{ scale: 1.08, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-cyan-500/30 h-6 text-[10px] px-2 relative overflow-hidden ${
                    user?.is_pro_member
                      ? 'text-cyan-300 hover:bg-cyan-500/10'
                      : 'text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={handleOpenEventDetails}
                  style={{
                    borderColor: user?.is_pro_member ? 'rgba(6, 182, 212, 0.5)' : 'rgba(107, 114, 128, 0.3)',
                    boxShadow: user?.is_pro_member ? '0 0 10px rgba(6, 182, 212, 0.3)' : 'none'
                  }}
                >
                  {/* Reflexo superior */}
                  {user?.is_pro_member && (
                    <div
                      className="absolute top-0 left-0 right-0 h-1/2 rounded-t"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)'
                      }}
                    />
                  )}

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
              </motion.div>
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

              {/* Badges com Micro-animações */}
              <div className="flex flex-wrap gap-1 mt-1">
                <motion.div
                  whileHover={{ scale: 1.08, y: -1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Badge
                    className="border text-[9px] px-1 py-0 h-4 relative overflow-hidden"
                    style={{
                      background: 'rgba(6, 182, 212, 0.2)',
                      borderColor: 'rgba(6, 182, 212, 0.4)',
                      color: '#06B6D4',
                      boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
                      textShadow: '0 0 5px rgba(6, 182, 212, 0.8)'
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1/2"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)'
                      }}
                    />
                    <span className="relative z-10">{event.genre}</span>
                  </Badge>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.08, y: -1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Badge
                    className="border text-[9px] px-1 py-0 h-4 relative overflow-hidden"
                    style={{
                      background: 'rgba(168, 85, 247, 0.2)',
                      borderColor: 'rgba(168, 85, 247, 0.4)',
                      color: '#A855F7',
                      boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)',
                      textShadow: '0 0 5px rgba(168, 85, 247, 0.8)'
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1/2"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)'
                      }}
                    />
                    <span className="relative z-10">{event.type}</span>
                  </Badge>
                </motion.div>

                {event.minimum_level > 1 && (
                  <motion.div
                    whileHover={{ scale: 1.08, y: -1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Badge
                      className="border text-[9px] px-1 py-0 h-4 relative overflow-hidden"
                      style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        borderColor: 'rgba(245, 158, 11, 0.4)',
                        color: '#F59E0B',
                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)',
                        textShadow: '0 0 5px rgba(245, 158, 11, 0.8)'
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1/2"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)'
                        }}
                      />
                      <Crown className="w-2 h-2 mr-0.5 relative z-10" />
                      <span className="relative z-10">Nv{event.minimum_level}+</span>
                    </Badge>
                  </motion.div>
                )}
              </div>

              {/* Descrição Compacta */}
              {event.description && (
                <p className="mt-1 text-[10px] text-gray-300 line-clamp-1">
                  {event.description}
                </p>
              )}
            </div>

            {/* CTA com Micro-interações Aprimoradas */}
            {requestStatus ? (
              <motion.div
                className="flex items-center justify-between p-1.5 rounded-lg border relative overflow-hidden"
                style={{
                  background: requestStatus === 'approved'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : requestStatus === 'pending'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  borderColor: requestStatus === 'approved'
                    ? 'rgba(16, 185, 129, 0.4)'
                    : requestStatus === 'pending'
                      ? 'rgba(245, 158, 11, 0.4)'
                      : 'rgba(239, 68, 68, 0.4)',
                  boxShadow: requestStatus === 'approved'
                    ? '0 0 15px rgba(16, 185, 129, 0.3)'
                    : requestStatus === 'pending'
                      ? '0 0 15px rgba(245, 158, 11, 0.3)'
                      : 'none'
                }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Reflexo */}
                <div
                  className="absolute top-0 left-0 right-0 h-1/2 rounded-t-lg"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)'
                  }}
                />

                {requestStatus === 'approved' ? (
                  <>
                    <div className="flex items-center gap-1 text-green-400">
                      <Check className="w-3 h-3" />
                      <span className="font-semibold text-[10px]">Aprovado!</span>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => setShowApprovedModal(true)}
                        className="h-6 text-[10px] px-2 relative overflow-hidden"
                        style={{
                          background: 'linear-gradient(to right, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.8))',
                          boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)'
                        }}
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-1/2"
                          style={{
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)'
                          }}
                        />
                        <span className="relative z-10">Ingresso</span>
                      </Button>
                    </motion.div>
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
              </motion.div>
            ) : event.requires_approval ? (
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleRequestAccess}
                  className="w-full h-8 text-xs relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(to right, rgba(6, 182, 212, 0.9), rgba(168, 85, 247, 0.9))',
                    boxShadow: '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(168, 85, 247, 0.4)'
                  }}
                >
                  {/* Reflexo superior animado */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-1/2 rounded-t"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)'
                    }}
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <Zap className="w-3 h-3 mr-1 relative z-10" />
                  <span className="relative z-10">Solicitar Acesso</span>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => navigate(createPageUrl("ComprarIngresso") + `?eventId=${event.id}`)}
                  className="w-full h-8 text-xs relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(to right, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9))',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                  }}
                >
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-1/2 rounded-t"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)'
                    }}
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <Users className="w-3 h-3 mr-1 relative z-10" />
                  <span className="relative z-10">Comprar Ingresso</span>
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
