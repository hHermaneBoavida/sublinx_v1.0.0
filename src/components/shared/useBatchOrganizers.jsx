import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMemo } from "react";

export function useBatchOrganizers(events) {
  const organizerIds = useMemo(() => {
    if (!events || events.length === 0) return [];
    return [...new Set(events.map(e => e.organizer_id).filter(Boolean))];
  }, [events]);

  const { data: organizers = [] } = useQuery({
    queryKey: ['batchOrganizers', organizerIds.length],
    queryFn: async () => {
      if (organizerIds.length === 0) return [];
      
      // Batch fetch all organizers
      return await base44.entities.User.filter({ 
        id: { $in: organizerIds } 
      });
    },
    enabled: organizerIds.length > 0,
    staleTime: Infinity, // Organizers data rarely changes
    gcTime: Infinity,
  });

  // Create lookup map
  const organizersMap = useMemo(() => {
    return new Map(organizers.map(o => [o.id, o]));
  }, [organizers]);

  return {
    organizersMap,
    getOrganizer: (id) => organizersMap.get(id),
  };
}