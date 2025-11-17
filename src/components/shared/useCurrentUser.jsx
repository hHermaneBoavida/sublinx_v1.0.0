import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { queryKeys, CACHE_CONFIG } from "./optimizations";

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
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useRevalidateUser() {
  const queryClient = useQueryClient();
  
  return React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
  }, [queryClient]);
}