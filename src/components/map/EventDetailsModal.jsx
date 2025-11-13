import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  X, MapPin, Calendar, Users, DollarSign, Clock,
  Navigation, Share2, Heart, MessageCircle, Zap,
  Music, TrendingUp, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GenreBadge } from "../shared/EventBadge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "../shared/useCurrentUser";

/**
 * MODAL DE DETALHES DO EVENTO - MELHORADO
 * Visual imersivo com todas as informações
 */
export default function EventDetailsModal({ event, onClose }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.Like.filter({
        user_id: user.id,
        event_id: event.id
      });

      if (existing && existing.length > 0) {
        await base44.entities.Like.delete(existing[0].id);
        return 'unliked';
      } else {
        await base44.entities.Like.create({
          user_id: user.id,
          event_id: event.id
        });
        return 'liked';
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feedInteractions']);
    }
  });

  const handleGetDirections = () => {
    if (!event.location?.lat || !event.location?.lng) return;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${event.location.lat},${event.location.lng}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Confira esse evento: ${event.title}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  const occupancy = event.max_capacity > 0 
    ? (event.current_attendees / event.max_capacity) * 100 
    : 0;

  const occupancyColor = 
    occupancy >= 90 ? 'text-red-400' :
    occupancy >= 70 ? 'text-yellow-400' :
    'text-green-400';

  const ticketPrice = event.price || event.ticket_types?.[0]?.price || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="max-w-2xl mx-auto min-h-screen flex items-center p-4" onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full"
        >
          <Card className="bg-gray-900 border-2 border-cyan-500/30 overflow-hidden shadow-2xl">
            {/* Image Header */}
            <div className="relative h-64 sm:h-80 overflow-hidden">
              <img
                src={event.image_url || `https://picsum.photos/800/600?random=${event.id}`}
                alt={event.title}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  imageLoaded ? 'scale-100 blur-0' : 'scale-110 blur-sm'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-xl border border-white/20 text-white hover:bg-black/80 h-10 w-10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                  {event.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <GenreBadge genre={event.genre} />
                  <Badge className="bg-purple-600/80 border-purple-500/50 text-white backdrop-blur-sm">
                    {event.type}
                  </Badge>
                  {event.is_secret && (
                    <Badge className="bg-yellow-600/80 border-yellow-500/50 text-white backdrop-blur-sm">
                      🔒 Secreto
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-cyan-600/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Data</div>
                      <div className="text-sm font-semibold text-white">
                        {format(new Date(event.date), "dd/MM", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300">
                    {format(new Date(event.date), "EEEE 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400">Local</div>
                      <div className="text-sm font-semibold text-white truncate">
                        {event.location?.venue_name || 'Secreto'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 truncate">
                    {event.location?.city || 'São Paulo'}
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-semibold text-white">Presença</span>
                  </div>
                  <span className={`text-sm font-bold ${occupancyColor}`}>
                    {occupancy.toFixed(0)}%
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancy}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 relative"
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/30"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </div>
                
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{event.current_attendees || 0} confirmados</span>
                  <span>{event.max_capacity || 0} max</span>
                </div>
              </div>

              {/* Price */}
              {ticketPrice > 0 && (
                <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-600/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-xs text-yellow-300">Entrada</div>
                        <div className="text-2xl font-bold text-yellow-400">
                          R$ {parseFloat(ticketPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {event.ticket_types && event.ticket_types.length > 1 && (
                      <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-xs">
                        +{event.ticket_types.length - 1} tipo{event.ticket_types.length > 2 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Sobre o Evento
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Organizer */}
              <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <img
                  src={event.organizer_avatar || "https://i.pravatar.cc/80?u=organizer"}
                  alt={event.organizer}
                  className="w-12 h-12 rounded-full border-2 border-cyan-500/30"
                />
                <div className="flex-1">
                  <div className="text-xs text-gray-400">Organizado por</div>
                  <div className="text-sm font-semibold text-white">{event.organizer}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/10"
                >
                  Ver Perfil
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleGetDirections}
                  variant="outline"
                  className="border-green-500/30 text-green-400 hover:bg-green-600/10"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Rota
                </Button>

                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-600/10"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              {/* Main CTA */}
              <Button
                onClick={() => {
                  navigate(createPageUrl("Feed"));
                  onClose();
                }}
                className="w-full h-14 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-base shadow-xl relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <Zap className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">
                  {event.requires_approval ? 'Solicitar Acesso' : 'Comprar Ingresso'}
                </span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}