import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function LikeProfileButton({ targetUserId, currentUserId, size = "default", className = "", style }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);

  const { data: likeData, isLoading: checkingLike } = useQuery({
    queryKey: ['profileLikeStatus', currentUserId, targetUserId],
    queryFn: async () => {
      if (!currentUserId || !targetUserId) return null;
      const likes = await base44.entities.Like.filter({
        user_id: currentUserId,
        target_user_id: targetUserId
      });
      return likes?.[0] || null;
    },
    enabled: !!currentUserId && !!targetUserId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    setIsLiked(!!likeData);
  }, [likeData]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await base44.entities.Like.delete(likeData.id);
        return 'unliked';
      } else {
        await base44.entities.Like.create({
          user_id: currentUserId,
          target_user_id: targetUserId
        });
        return 'liked';
      }
    },
    onMutate: () => {
      setIsLiked(!isLiked);
    },
    onError: (error) => {
      setIsLiked(!isLiked);
      toast({ title: 'Erro', description: 'Nao foi possivel processar. Tente novamente.', variant: 'destructive' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profileLikeStatus']);
      queryClient.invalidateQueries(['profileLikes']);
    }
  });

  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return null;
  }

  if (checkingLike) {
    return (
      <Button disabled size={size} variant="outline" className="border-gray-600 bg-black">
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={() => likeMutation.mutate()}
        disabled={likeMutation.isPending}
        size={size}
        style={style}
        className={
          isLiked
            ? `bg-red-600 hover:bg-red-700 border border-red-400/60 text-white ${className}`
            : `bg-black border border-red-500/40 text-red-400 hover:bg-red-900/20 hover:border-red-400 ${className}`
        }
      >
        {likeMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-white' : ''}`} />
        )}
        {isLiked ? 'Curtido' : 'Curtir'}
      </Button>
    </motion.div>
  );
}