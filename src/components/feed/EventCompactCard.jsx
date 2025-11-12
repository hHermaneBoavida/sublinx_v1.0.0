import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Heart, MessageCircle, Crown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EventCompactCard({ event, onClick, onMouseEnter }) {
  if (!event) return null;

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onMouseEnter={onMouseEnter}
    >
      <Card
        onClick={onClick}
        className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden"
      >
        <div className="flex gap-3 p-3">
          {/* Thumbnail Pequena */}
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden relative">
            <img
              src={event.image_url || `https://picsum.photos/200/200?random=${event.id}`}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {event.is_secret && (
              <div className="absolute top-1 right-1">
                <Crown className="w-3 h-3 text-yellow-400" />
              </div>
            )}
          </div>

          {/* Info Compacta */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">
              {event.title}
            </h3>

            {/* Badges */}
            <div className="flex gap-1 mb-2">
              <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-[9px] px-1.5 py-0">
                {event.genre}
              </Badge>
              <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-[9px] px-1.5 py-0">
                {event.type}
              </Badge>
            </div>

            {/* Data e Local */}
            <div className="space-y-0.5 text-[10px] text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span className="truncate">
                  {format(new Date(event.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-purple-400" />
                <span className="truncate">
                  {event.location?.venue_name || event.location?.city}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Rápidas */}
          <div className="flex flex-col justify-center gap-2 text-[10px] text-gray-400">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{event.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{event.comments_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{event.current_attendees || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}