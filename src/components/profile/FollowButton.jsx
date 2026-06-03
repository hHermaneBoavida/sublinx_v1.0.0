import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { CACHE_CONFIG } from "../shared/helpers";
import { useToast } from "@/components/ui/use-toast";

export default function FollowButton({ targetUserId, currentUserId, targetUserName, size = "default" }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: followData, isLoading: checkingFollow } = useQuery({
    queryKey: ['followStatus', currentUserId, targetUserId],
    queryFn: async () => {
      if (!currentUserId || !targetUserId) return null;
      const follows = await base44.entities.Follow.filter({
        follower_id: currentUserId,
        following_id: targetUserId
      });
      return follows?.[0] || null;
    },
    enabled: !!currentUserId && !!targetUserId,
    ...CACHE_CONFIG.SHORT,
  });

  useEffect(() => {
    setIsFollowing(!!followData);
  }, [followData]);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    ...CACHE_CONFIG.STATIC,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        // Unfollow
        await base44.entities.Follow.delete(followData.id);
        return 'unfollowed';
      } else {
        // Follow
        await base44.entities.Follow.create({
          follower_id: currentUserId,
          following_id: targetUserId
        });

        // Criar notificação
        try {
          await base44.entities.Notification.create({
            user_id: targetUserId,
            type: 'new_follower',
            title: '👥 Novo seguidor!',
            message: `${currentUser?.full_name || currentUser?.email || 'Alguém'} começou a seguir você`,
            is_read: false,
            location_match: false,
            genre_match: []
          });
        } catch (error) {
          console.log('Erro ao criar notificação:', error);
        }

        return 'followed';
      }
    },
    onMutate: () => {
      setIsFollowing(!isFollowing);
    },
    onError: (error) => {
      console.error('Erro ao seguir/deixar de seguir:', error);
      setIsFollowing(!isFollowing);
      toast({ title: 'Erro', description: 'Não foi possível processar. Tente novamente.', variant: 'destructive' });
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries(['followStatus']);
      queryClient.invalidateQueries(['followers']);
      queryClient.invalidateQueries(['following']);
      
      if (action === 'followed') {
        console.log(`✅ Você seguiu ${targetUserName || 'o usuário'}!`);
      } else {
        console.log(`✅ Você deixou de seguir ${targetUserName || 'o usuário'}!`);
      }
    }
  });

  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return null;
  }

  if (checkingFollow) {
    return (
      <Button disabled size={size} variant="outline" className="border-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={() => followMutation.mutate()}
        disabled={followMutation.isPending}
        size={size}
        className={
          isFollowing
            ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
            : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700'
        }
      >
        {followMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="w-4 h-4 mr-2" />
        ) : (
          <UserPlus className="w-4 h-4 mr-2" />
        )}
        {isFollowing ? 'Seguindo' : 'Seguir'}
      </Button>
    </motion.div>
  );
}