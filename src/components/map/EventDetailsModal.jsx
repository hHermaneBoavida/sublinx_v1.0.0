import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, Users, Clock, Tag, Heart, Share2, Navigation, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useRealtimeEvent from '../events/useRealtimeEvent';

export default function EventDetailsModal({ event: initialEvent, onClose }) {
  const queryClient = useQueryClient();
  const [hasLiked, setHasLiked] = useState(false);
  
  // NOVO: Hook de dados em tempo real
  const { 
    event, 
    isLoading, 
    isConnected, 
    occupancyPercentage, 
    availabilityStatus,
    isRealtime 
  } = useRealtimeEvent(initialEvent?.id);

  // Usar evento inicial como fallback se realtime ainda não carregou
  const displayEvent = event || initialEvent;

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const user = await base44.auth.me();
        const likes = await base44.entities.Like.filter({ 
          event_id: displayEvent.id, 
          user_id: user.id 
        });
        setHasLiked(likes.length > 0);
      } catch {
        setHasLiked(false);
      }
    };

    if (displayEvent?.id) {
      checkLikeStatus();
    }
  }, [displayEvent?.id]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      if (hasLiked) {
        const likes = await base44.entities.Like.filter({ 
          event_id: displayEvent.id, 
          user_id: user.id 
        });
        if (likes[0]) {
          await base44.entities.Like.delete(likes[0].id);
        }
      } else {
        await base44.entities.Like.create({ 
          user_id: user.id, 
          event_id: displayEvent.id 
        });
      }
    },
    onMutate: () => {
      setHasLiked(!hasLiked);
    },
    onError: () => {
      setHasLiked(!hasLiked);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feedInteractions']);
      queryClient.invalidateQueries(['eventDetails']);
    }
  });

  if (!displayEvent || !displayEvent.location) return null;

  // Status visual da disponibilidade
  const getAvailabilityConfig = () => {
    switch(availabilityStatus) {
      case 'sold_out':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-600/20',
          borderColor: 'border-red-500/30',
          icon: AlertCircle,
          label: 'ESGOTADO',
          pulse: true
        };
      case 'almost_full':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-orange-600/20',
          borderColor: 'border-orange-500/30',
          icon: TrendingUp,
          label: 'QUASE LOTANDO',
          pulse: true
        };
      case 'filling_fast':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-600/20',
          borderColor: 'border-yellow-500/30',
          icon: Zap,
          label: 'ENCHENDO RÁPIDO',
          pulse: false
        };
      default:
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-600/20',
          borderColor: 'border-green-500/30',
          icon: Users,
          label: 'DISPONÍVEL',
          pulse: false
        };
    }
  };

  const availabilityConfig = getAvailabilityConfig();
  const StatusIcon = availabilityConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-gradient-to-b from-gray-900 to-black border-t md:border md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border-cyan-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com Imagem */}
        <div className="relative h-40 sm:h-48 md:h-64 overflow-hidden">
          <img
            src={displayEvent.image_url || `https://picsum.photos/800/400?random=${displayEvent.id}`}
            alt={displayEvent.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* NOVO: Indicador de Tempo Real */}
          {isConnected && isRealtime && (
            <motion.div
              className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-1 bg-green-600/90 backdrop-blur-md rounded-full flex items-center gap-1"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-[10px] font-bold">AO VIVO</span>
            </motion.div>
          )}

          {/* Botão Fechar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Título e Organizador */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <img 
                src={displayEvent.organizer_avatar || `https://i.pravatar.cc/48?u=${displayEvent.organizer_id}`} 
                alt={displayEvent.organizer}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-cyan-500/50"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1 truncate">
                  {displayEvent.title}
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm truncate">{displayEvent.organizer}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Scrollável */}
        <div className="overflow-y-auto max-h-[calc(90vh-12rem)] sm:max-h-[calc(90vh-14rem)] md:max-h-96 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-xs">
              {displayEvent.genre}
            </Badge>
            <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
              {displayEvent.type}
            </Badge>
            {displayEvent.is_secret && (
              <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-xs">
                🔒 Secreto
              </Badge>
            )}
          </div>

          {/* NOVO: Status de Disponibilidade com Tempo Real */}
          <motion.div 
            className={`p-3 rounded-lg border-2 ${availabilityConfig.bgColor} ${availabilityConfig.borderColor}`}
            animate={availabilityConfig.pulse ? {
              borderColor: [
                availabilityConfig.borderColor,
                availabilityConfig.borderColor.replace('30', '60'),
                availabilityConfig.borderColor
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 ${availabilityConfig.color}`} />
                <span className={`font-bold text-sm ${availabilityConfig.color}`}>
                  {availabilityConfig.label}
                </span>
              </div>
              <Badge className={`${availabilityConfig.bgColor} ${availabilityConfig.borderColor} ${availabilityConfig.color} text-xs`}>
                {occupancyPercentage}% cheio
              </Badge>
            </div>

            {/* Barra de Progresso Animada */}
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(to right, ${
                    availabilityStatus === 'sold_out' ? '#ef4444' :
                    availabilityStatus === 'almost_full' ? '#f97316' :
                    availabilityStatus === 'filling_fast' ? '#eab308' :
                    '#10b981'
                  }, ${
                    availabilityStatus === 'sold_out' ? '#dc2626' :
                    availabilityStatus === 'almost_full' ? '#ea580c' :
                    availabilityStatus === 'filling_fast' ? '#ca8a04' :
                    '#059669'
                  })`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-400">
                {displayEvent.current_attendees} / {displayEvent.max_capacity} pessoas
              </span>
              {isRealtime && (
                <motion.span 
                  className="text-green-400 flex items-center gap-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Atualizado agora
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* Info Rápida */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Data</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  {format(new Date(displayEvent.date), "dd MMM", { locale: ptBR })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Horário</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  {format(new Date(displayEvent.date), "HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Preço</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  R$ {displayEvent.price?.toFixed(2) || displayEvent.ticket_types?.[0]?.price?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Popularidade</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  {displayEvent.current_attendees > 50 ? 'Alta 🔥' : displayEvent.current_attendees > 20 ? 'Média ⚡' : 'Normal 📍'}
                </div>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="flex items-start gap-2 sm:gap-3">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1 truncate">
                  {displayEvent.location.venue_name}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">
                  {displayEvent.location.address || displayEvent.location.city}
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs flex-shrink-0 h-8 px-2 sm:px-3"
                onClick={() => {
                  const { lat, lng } = displayEvent.location;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                }}
              >
                <Navigation className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Rota</span>
              </Button>
            </div>
          </div>

          {/* Descrição */}
          {displayEvent.description && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2">Sobre o Evento</h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                {displayEvent.description}
              </p>
            </div>
          )}

          {/* Vibes */}
          {displayEvent.vibe_tags && displayEvent.vibe_tags.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2">Vibes</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {displayEvent.vibe_tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-[10px] sm:text-xs text-purple-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* NOVO: Estatísticas em Tempo Real */}
          {isRealtime && (
            <div className="p-3 bg-cyan-900/10 border border-cyan-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-300">Estatísticas em Tempo Real</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Participantes:</span>
                  <motion.span 
                    className="text-white font-bold"
                    key={displayEvent.current_attendees}
                    initial={{ scale: 1.3, color: '#06B6D4' }}
                    animate={{ scale: 1, color: '#FFFFFF' }}
                    transition={{ duration: 0.3 }}
                  >
                    {displayEvent.current_attendees}
                  </motion.span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Disponíveis:</span>
                  <span className="text-white font-bold">
                    {displayEvent.max_capacity - displayEvent.current_attendees}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="p-3 sm:p-4 border-t border-gray-800 bg-black/50 backdrop-blur-md flex gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex-1 text-xs sm:text-sm h-9 sm:h-10 ${
              hasLiked 
                ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' 
                : 'border-gray-700 text-gray-300'
            }`}
          >
            <Heart className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${hasLiked ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline">{hasLiked ? 'Salvo' : 'Salvar'}</span>
          </Button>
          <Button variant="outline" className="flex-1 border-gray-700 text-gray-300 text-xs sm:text-sm h-9 sm:h-10">
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Compartilhar</span>
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-xs sm:text-sm h-9 sm:h-10"
            disabled={availabilityStatus === 'sold_out'}
          >
            {availabilityStatus === 'sold_out' ? 'Esgotado' : 'Ver Reels'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}