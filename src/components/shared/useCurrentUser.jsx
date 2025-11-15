import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { queryKeys, CACHE_CONFIG } from "./optimizations";

/**
 * Hook otimizado para obter usuário atual
 * Usa cache agressivo e não recarrega desnecessariamente
 */
export default function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return user;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    ...CACHE_CONFIG.STATIC,
    // Manter dados do usuário em cache por mais tempo
    staleTime: Infinity,
    cacheTime: Infinity,
    // Não refetch automaticamente
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

/**
 * Hook para forçar revalidação do usuário
 */
export function useRevalidateUser() {
  const queryClient = useQueryClient();
  
  return React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
  }, [queryClient]);
}