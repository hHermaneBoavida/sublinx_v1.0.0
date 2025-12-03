import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AIRecommendationCard from "./AIRecommendationCard";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { CACHE_CONFIG } from "../shared/helpers";

export default function FeedAIRecommendations({ user }) {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['aiRecommendations', user?.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('getPersonalizedRecommendations', {});
      return response.data;
    },
    enabled: !!user?.id,
    ...CACHE_CONFIG.MEDIUM,
    retry: 1,
  });

  if (!user || isLoading || !recommendations?.personalized?.length) return null;

  const topRecommendations = recommendations.personalized.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3 px-4">
        <h3 className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Recomendados por IA
        </h3>
      </div>

      <div className="px-4 grid grid-cols-1 gap-4">
        {topRecommendations.map((event) => (
          <AIRecommendationCard 
            key={event.id} 
            event={event} 
            showReasons={true}
          />
        ))}
      </div>
    </motion.div>
  );
}