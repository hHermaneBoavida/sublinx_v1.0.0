import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Calendar, Users, DollarSign, Navigation } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GenreBadge } from "../shared/EventBadge";

/**
 * EXPANSÃO DE CLUSTER
 * Mostra eventos dentro de um cluster
 */
export default function ClusterExpansion({ cluster, onClose, onEventClick, userLocation }) {
  if (!cluster || !cluster.events) return null;

  const { events, center, density, dominantGenre, dominantType } = cluster;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/95 backdrop-blur-xl z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="max-w-3xl mx-auto px-4 py-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              🎯 {events.length} Evento{events.length > 1 ? 's' : ''} Próximos
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300">
                {dominantGenre || 'Mixed'}
              </Badge>
              <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
                {dominantType || 'Vários tipos'}
              </Badge>
              {density > 10 && (
                <Badge className="bg-red-600/20 border-red-500/30 text-red-300">
                  🔥 Hotspot ({density.toFixed(1)}/km²)
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid gap-4">
          {events
            .sort((a, b) => {
              // Ordenar por distância se userLocation disponível
              if (userLocation) {
                const distA = Math.hypot(
                  a.location.lat - userLocation.lat,
                  a.location.lng - userLocation.lng
                );
                const distB = Math.hypot(
                  b.location.lat - userLocation.lat,
                  b.location.lng - userLocation.lng
                );
                return distA - distB;
              }
              return new Date(a.date) - new Date(b.date);
            })
            .map((event, index) => {
              const distance = userLocation ? (
                Math.hypot(
                  event.location.lat - userLocation.lat,
                  event.location.lng - userLocation.lng
                ) * 111 // Aprox km
              ) : null;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="bg-gray-900/80 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden group"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-28 h-28 flex-shrink-0 relative overflow-hidden">
                        <img
                          src={event.image_url || `https://picsum.photos/300/300?random=${event.id}`}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {distance && distance < 1 && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-green-600 text-white text-[9px]">
                              <Navigation className="w-2.5 h-2.5 mr-1" />
                              Muito perto!
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <CardContent className="flex-1 p-4">
                        <h3 className="font-bold text-white text-base mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                          {event.title}
                        </h3>

                        <div className="space-y-1.5 text-sm mb-3">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs">
                              {format(new Date(event.date), "EEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-400">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            <span className="text-xs truncate">
                              {event.location?.venue_name || 'Local secreto'}
                            </span>
                          </div>

                          {distance !== null && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Navigation className="w-4 h-4 text-green-400" />
                              <span className="text-xs">
                                {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <GenreBadge genre={event.genre} size="xs" />
                          
                          {event.price > 0 && (
                            <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-[9px]">
                              <DollarSign className="w-3 h-3 mr-1" />
                              R$ {parseFloat(event.price).toFixed(0)}
                            </Badge>
                          )}

                          {event.current_attendees > 0 && (
                            <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-300 text-[9px]">
                              <Users className="w-3 h-3 mr-1" />
                              {event.current_attendees}/{event.max_capacity}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Voltar ao Mapa
          </Button>
        </div>
      </div>
    </motion.div>
  );
}