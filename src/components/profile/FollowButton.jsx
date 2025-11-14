import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function FollowButton({ targetUserId, currentUserId, size = "default" }) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

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
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

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

  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return null;
  }

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <Button
        onClick={handleToggleFollow}
        disabled={isLoading}
        size={size}
        className={`relative overflow-hidden transition-all duration-300 font-semibold ${
          isFollowing
            ? "bg-gray-800 hover:bg-red-900/20 text-gray-300 hover:text-red-400 border-2 border-gray-700 hover:border-red-500"
            : "bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 text-white border-0"
        }`}
        style={{
          boxShadow: isFollowing ? 'none' : '0 0 30px rgba(6, 182, 212, 0.5)'
        }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
          animate={!isFollowing ? { x: ['-100%', '100%'] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
            <span className="relative z-10">{isFollowing ? "Deixando..." : "Seguindo..."}</span>
          </>
        ) : showSuccess ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 relative z-10"
          >
            <CheckCircle className="w-4 h-4" />
            Seguindo!
          </motion.div>
        ) : isFollowing ? (
          <>
            <UserMinus className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Seguindo</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Seguir</span>
          </>
        )}
      </Button>
    </motion.div>
  );
}