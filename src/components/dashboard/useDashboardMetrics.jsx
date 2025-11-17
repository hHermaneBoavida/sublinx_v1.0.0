import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function useDashboardMetrics(userId, enabled = true) {
  return useQuery({
    queryKey: ['dashboardMetrics', userId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDashboardMetrics');
      return response.data;
    },
    enabled: enabled && !!userId,
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}