import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function FollowButton({ targetUserId, currentUserId, size = "default" }) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  // Verificar se já está seguindo
  const { data: followData } = useQuery({
    queryKey: ['followStatus', currentUserId, targetUserId],
    queryFn: async () => {
      const follows = await base44.entities.Follow.filter({
        follower_id: currentUserId,
        following_id: targetUserId
      });
      return follows && follows.length > 0 ? follows[0] : null;
    },
    enabled: !!currentUserId && !!targetUserId && currentUserId !== targetUserId,
  });

  const isFollowing = !!followData;

  // Mutation para seguir
  const followMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.Follow.create({
        follower_id: currentUserId,
        following_id: targetUserId,
        followed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['followStatus']);
      queryClient.invalidateQueries(['followers', targetUserId]);
      queryClient.invalidateQueries(['following', currentUserId]);
      queryClient.invalidateQueries(['followersUsers']);
      queryClient.invalidateQueries(['followingUsers']);
      
      // Animação de sucesso
      setShowSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#8b5cf6', '#ec4899']
      });
      
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

  // Mutation para deixar de seguir
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (followData) {
        await base44.entities.Follow.delete(followData.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['followStatus']);
      queryClient.invalidateQueries(['followers', targetUserId]);
      queryClient.invalidateQueries(['following', currentUserId]);
      queryClient.invalidateQueries(['followersUsers']);
      queryClient.invalidateQueries(['followingUsers']);
    },
  });

  const handleToggleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync();
      } else {
        await followMutation.mutateAsync();
      }
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
    }
  };

  // Não mostrar botão para o próprio usuário
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return null;
  }

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Button
        onClick={handleToggleFollow}
        disabled={isLoading}
        size={size}
        className={`relative overflow-hidden transition-all duration-300 font-semibold ${
          isFollowing
            ? "bg-gray-800 hover:bg-red-900/20 text-gray-300 hover:text-red-400 border-2 border-gray-700 hover:border-red-500"
            : "bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-purple-500/50"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isFollowing ? "Deixando..." : "Seguindo..."}
          </>
        ) : showSuccess ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Seguindo!
          </motion.div>
        ) : isFollowing ? (
          <>
            <UserMinus className="w-4 h-4 mr-2" />
            Seguindo
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Seguir
          </>
        )}
      </Button>
      
      {/* Efeito de onda ao seguir */}
      {showSuccess && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-md"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.div>
  );
}