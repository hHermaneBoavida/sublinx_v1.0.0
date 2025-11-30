import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { offlineQueue } from "./OfflineQueue";
import { toast } from "sonner";

export function useOfflineAction(entity, mutationKey, options = {}) {
  return useMutation({
    mutationFn: async ({ type, data, id }) => {
      if (!navigator.onLine) {
        offlineQueue.add({ type, entity, data, id });
        throw new Error('OFFLINE');
      }

      switch (type) {
        case 'create':
          return await base44.entities[entity].create(data);
        case 'update':
          return await base44.entities[entity].update(id, data);
        case 'delete':
          return await base44.entities[entity].delete(id);
        default:
          throw new Error('Invalid action type');
      }
    },
    onError: (error) => {
      if (error.message === 'OFFLINE') {
        toast.info('⚡ Ação salva! Será sincronizada quando voltar online.', {
          duration: 3000,
        });
      } else {
        toast.error('❌ Erro ao executar ação');
      }
    },
    onSuccess: () => {
      if (options.onSuccess) {
        options.onSuccess();
      }
    },
    ...options
  });
}

// Hook para likes
export function useOfflineLike(eventId, queryClient) {
  const mutation = useOfflineAction('Like', ['likes', eventId], {
    onSuccess: () => {
      queryClient.invalidateQueries(['likes', eventId]);
      queryClient.invalidateQueries(['feedInteractions']);
    }
  });

  const toggleLike = async (userId, isLiked) => {
    if (isLiked) {
      const likes = await base44.entities.Like.filter({ event_id: eventId, user_id: userId });
      const likeId = likes[0]?.id;
      if (likeId) {
        mutation.mutate({ type: 'delete', id: likeId });
      }
    } else {
      mutation.mutate({ type: 'create', data: { event_id: eventId, user_id: userId } });
    }
  };

  return { toggleLike, isLoading: mutation.isPending };
}

// Hook para saves
export function useOfflineSave(eventId, queryClient) {
  const mutation = useOfflineAction('SavedEvent', ['savedEvents', eventId], {
    onSuccess: () => {
      queryClient.invalidateQueries(['savedEvents']);
    }
  });

  const toggleSave = async (userId, isSaved) => {
    if (isSaved) {
      const saved = await base44.entities.SavedEvent.filter({ event_id: eventId, user_id: userId });
      const savedId = saved[0]?.id;
      if (savedId) {
        mutation.mutate({ type: 'delete', id: savedId });
      }
    } else {
      mutation.mutate({ type: 'create', data: { event_id: eventId, user_id: userId } });
    }
  };

  return { toggleSave, isLoading: mutation.isPending };
}