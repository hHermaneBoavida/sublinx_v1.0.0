import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, queryKeys } from "./optimizations";

/**
 * Hook otimizado para queries com deduplicação automática
 */
export function useOptimizedQuery(key, queryFn, options = {}) {
  const cacheLevel = options.cacheLevel || 'MEDIUM';
  const cacheConfig = CACHE_CONFIG[cacheLevel] || CACHE_CONFIG.MEDIUM;
  
  return useQuery({
    queryKey: key,
    queryFn,
    ...cacheConfig,
    ...options,
    // Prevenir queries duplicadas
    networkMode: 'offlineFirst',
    // Retry apenas em falhas de rede
    retry: (failureCount, error) => {
      if (error?.message?.includes('404')) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook para queries com paginação
 */
export function usePaginatedQuery(key, queryFn, options = {}) {
  return useOptimizedQuery(key, queryFn, {
    ...options,
    keepPreviousData: true,
    cacheLevel: 'SHORT',
  });
}

/**
 * Hook para queries em tempo real
 */
export function useRealtimeQuery(key, queryFn, options = {}) {
  return useOptimizedQuery(key, queryFn, {
    ...options,
    cacheLevel: 'REALTIME',
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook para dados estáticos
 */
export function useStaticQuery(key, queryFn, options = {}) {
  return useOptimizedQuery(key, queryFn, {
    ...options,
    cacheLevel: 'STATIC',
    staleTime: Infinity,
  });
}

export default {
  useOptimizedQuery,
  usePaginatedQuery,
  useRealtimeQuery,
  useStaticQuery,
  queryKeys
};