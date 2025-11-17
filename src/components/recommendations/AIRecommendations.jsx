import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Calendar, MapPin, TrendingUp, Users, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { CACHE_CONFIG } from "../shared/helpers";

export default function AIRecommendations({ user }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['aiRecommendations', user?.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('getPersonalizedRecommendations', {});
      return response.data;
    },
    enabled: !!user?.id,
    ...CACHE_CONFIG.MEDIUM,
    retry: 1,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="ml-2 text-gray-400">Gerando recomendações...</span>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations?.events?.length && !recommendations?.organizers?.length) {
    return null;
  }

  const displayedEvents = expanded ? recommendations.events : recommendations.events.slice(0, 3);

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 via-gray-900/80 to-cyan-900/20 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Recomendado para Você
          </span>
        </CardTitle>
        {recommendations.reasoning && (
          <p className="text-xs text-gray-400 mt-1">{recommendations.reasoning}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Eventos Recomendados */}
        <div className="space-y-2">
          {displayedEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(createPageUrl("Feed"))}
              className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-purple-500/50 cursor-pointer transition-all"
            >
              <div className="flex gap-3">
                {event.image_url && (
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm line-clamp-1">{event.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(event.date), "dd/MM HH:mm", { locale: ptBR })}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <Badge className="text-[9px] px-1 py-0 h-4 bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
                      {event.genre}
                    </Badge>
                    {event.price !== undefined && (
                      <Badge className="text-[9px] px-1 py-0 h-4 bg-green-600/20 border-green-500/30 text-green-300">
                        R$ {event.price || event.ticket_types?.[0]?.price || 0}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {recommendations.events.length > 3 && (
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="ghost"
            size="sm"
            className="w-full text-purple-400 hover:bg-purple-500/10"
          >
            {expanded ? 'Ver menos' : `Ver mais ${recommendations.events.length - 3} recomendações`}
          </Button>
        )}

        {/* Organizadores Recomendados */}
        {recommendations.organizers?.length > 0 && (
          <div className="pt-3 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Organizadores Sugeridos
            </h4>
            <div className="space-y-2">
              {recommendations.organizers.slice(0, 3).map((organizer) => (
                <div
                  key={organizer.id}
                  onClick={() => navigate(createPageUrl("PerfilUsuario") + `?id=${organizer.id}`)}
                  className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={organizer.avatar_url || `https://i.pravatar.cc/40?u=${organizer.id}`}
                      alt={organizer.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{organizer.full_name}</p>
                      {organizer.bio && (
                        <p className="text-xs text-gray-500 line-clamp-1">{organizer.bio}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 h-7 text-xs">
                    <UserPlus className="w-3 h-3 mr-1" />
                    Seguir
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => refetch()}
          variant="ghost"
          size="sm"
          className="w-full text-xs text-gray-400 hover:text-cyan-400"
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Atualizar Recomendações
        </Button>
      </CardContent>
    </Card>
  );
}