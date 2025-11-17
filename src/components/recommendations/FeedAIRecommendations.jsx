import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Calendar, MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { CACHE_CONFIG } from "../shared/helpers";

export default function FeedAIRecommendations({ user }) {
  const navigate = useNavigate();

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

  if (!user || isLoading || !recommendations?.events?.length) return null;

  const topRecommendation = recommendations.events[0];

  return (
    <div className="px-3 sm:px-4 py-3 border-b border-gray-800/30">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-purple-400">Perfeito para Você</h3>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate(createPageUrl("Feed"))}
        className="cursor-pointer"
      >
        <Card className="bg-gradient-to-br from-purple-900/30 via-gray-900/80 to-cyan-900/30 border-purple-500/40 overflow-hidden hover:border-purple-500/70 transition-all">
          <div className="relative h-32">
            <img
              src={topRecommendation.image_url || `https://picsum.photos/600/300?random=${topRecommendation.id}`}
              alt={topRecommendation.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <Badge className="absolute top-2 right-2 bg-purple-600/90 border-purple-400 text-white text-[9px]">
              <Sparkles className="w-2 h-2 mr-1" />
              IA
            </Badge>
            <div className="absolute bottom-2 left-2 right-2">
              <h4 className="font-bold text-white text-sm line-clamp-1">{topRecommendation.title}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(topRecommendation.date), "dd/MM HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          </div>
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Badge className="text-[9px] px-1 py-0 h-4 bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
                  {topRecommendation.genre}
                </Badge>
                <Badge className="text-[9px] px-1 py-0 h-4 bg-purple-600/20 border-purple-500/30 text-purple-300">
                  {topRecommendation.type}
                </Badge>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {recommendations.events.length > 1 && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          +{recommendations.events.length - 1} recomendações no seu perfil
        </p>
      )}
    </div>
  );
}