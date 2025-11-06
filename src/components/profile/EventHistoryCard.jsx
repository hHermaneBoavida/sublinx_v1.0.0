import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Music } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EventHistoryCard({ event }) {
  return (
    <Card className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-all overflow-hidden">
      <div className="flex">
        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
          <img
            src={event.image_url || `https://picsum.photos/300/300?random=${event.id}`}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="flex-1 p-3 sm:p-4">
          <h3 className="font-semibold text-white text-sm sm:text-base mb-2 line-clamp-1">
            {event.title}
          </h3>
          
          <div className="space-y-1 text-xs sm:text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
              <span>{format(new Date(event.date), "PPP", { locale: ptBR })}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              <span className="truncate">{event.location?.venue_name || "Local"}</span>
            </div>

            {event.genre && (
              <div className="flex items-center gap-2">
                <Music className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                <Badge variant="outline" className="border-green-500/30 text-green-300 text-[10px]">
                  {event.genre}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}