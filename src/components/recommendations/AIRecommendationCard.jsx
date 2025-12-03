import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Calendar, Users, Heart, Sparkles, 
  ChevronDown, ChevronUp, TrendingUp, Star
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AIRecommendationCard({ event, showReasons = true }) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  if (!event) return null;

  const reasons = event.recommendation_reasons || [];
  const score = event.recommendation_score || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/60 transition-all overflow-hidden group cursor-pointer"
        onClick={() => navigate(createPageUrl("EventoDetalhes") + `?id=${event.id}`)}
      >
        {/* Badge de Recomendação */}
        {score > 50 && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
              <Star className="w-3 h-3 mr-1" />
              Top Match
            </Badge>
          </div>
        )}

        {/* Imagem */}
        {event.image_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
            
            {/* Score Badge */}
            {score > 0 && (
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-purple-600/90 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {score}% Match
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardContent className="p-4">
          <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">
            {event.title}
          </h3>

          <div className="space-y-2 text-sm mb-3">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>{format(new Date(event.date), "dd MMM 'às' HH:mm", { locale: ptBR })}</span>
            </div>

            {event.location?.venue_name && (
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="truncate">{event.location.venue_name}</span>
              </div>
            )}

            {event.distance_km && (
              <div className="flex items-center gap-2 text-gray-300">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>{event.distance_km.toFixed(1)}km de você</span>
              </div>
            )}

            {event.current_attendees > 0 && (
              <div className="flex items-center gap-2 text-gray-300">
                <Users className="w-4 h-4 text-orange-400" />
                <span>{event.current_attendees} confirmados</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
              {event.genre}
            </Badge>
            <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300">
              {event.type}
            </Badge>
          </div>

          {/* Razões da Recomendação */}
          {showReasons && reasons.length > 0 && (
            <div className="border-t border-gray-700 pt-3 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="flex items-center justify-between w-full text-left text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Por que recomendamos
                </span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1"
                  >
                    {reasons.slice(0, 3).map((reason, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-2 text-xs text-gray-400"
                      >
                        <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}