import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Users, Clock, Tag, Heart, Share2, Navigation, Zap, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import useRealtimeEvent from '../events/useRealtimeEvent';
import LiveIndicator from '../events/LiveIndicator';
import AttendeeCounter from '../events/AttendeeCounter';

export default function EventDetailsModal({ event, onClose }) {
  const navigate = useNavigate();
  const [previousCount, setPreviousCount] = useState(event?.current_attendees || 0);
  const prevCountRef = useRef(event?.current_attendees || 0);

  // NOVO: Hook de dados em tempo real
  const { 
    event: realtimeEvent, 
    isLoading, 
    isConnected,
    occupancyPercentage,
    availabilityStatus,
    isRealtime 
  } = useRealtimeEvent(event?.id);

  // Detectar mudanças no número de participantes
  useEffect(() => {
    if (realtimeEvent?.current_attendees !== prevCountRef.current) {
      setPreviousCount(prevCountRef.current);
      prevCountRef.current = realtimeEvent?.current_attendees || 0;
    }
  }, [realtimeEvent?.current_attendees]);

  // Usar dados em tempo real se disponível, senão usar dados originais
  const displayEvent = realtimeEvent || event;

  if (!displayEvent || !displayEvent.location) return null;

  const handleViewReels = () => {
    onClose();
    // Navegar para reels deste evento seria implementado aqui
  };

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
          
          {/* NOVO: Live Indicator */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
            <LiveIndicator isConnected={isConnected} variant="badge" />
          </div>

          {/* Status Badge */}
          {availabilityStatus === 'sold_out' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 sm:top-4 right-12 sm:right-16"
            >
              <Badge className="bg-red-600 border-red-500 text-white font-bold px-3 py-1">
                LOTADO
              </Badge>
            </motion.div>
          )}

          {availabilityStatus === 'almost_full' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 sm:top-4 right-12 sm:right-16"
            >
              <Badge className="bg-orange-600 border-orange-500 text-white font-bold px-3 py-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                QUASE LOTADO
              </Badge>
            </motion.div>
          )}

          {/* Botão Fechar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10 z-10"
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
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1 line-clamp-2">
                  {displayEvent.title}
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm truncate">
                  {displayEvent.organizer}
                </p>
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
            {displayEvent.requires_approval && (
              <Badge className="bg-orange-600/20 border-orange-500/30 text-orange-300 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Requer Aprovação
              </Badge>
            )}
          </div>

          {/* NOVO: Contador de participantes em tempo real */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <AttendeeCounter
              currentAttendees={displayEvent.current_attendees || 0}
              maxCapacity={displayEvent.max_capacity || 0}
              previousCount={previousCount}
              isRealtime={isRealtime}
              compact={false}
            />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Data</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  {format(new Date(displayEvent.date), "dd MMM yyyy", { locale: ptBR })}
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
                  {displayEvent.ticket_types && displayEvent.ticket_types.length > 0 ? (
                    `A partir de R$ ${Math.min(...displayEvent.ticket_types.map(t => t.price)).toFixed(2)}`
                  ) : (
                    `R$ ${displayEvent.price?.toFixed(2) || '0.00'}`
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Duração</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  {displayEvent.duration_hours ? `${displayEvent.duration_hours}h` : '—'}
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
                  {displayEvent.location.address || `${displayEvent.location.city || 'Local'}`}
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs flex-shrink-0 h-8 px-2 sm:px-3"
                onClick={() => {
                  const { lat, lng } = displayEvent.location;
                  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
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

          {/* NOVO: Indicador de atualização em tempo real */}
          {isRealtime && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-500/30 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1">
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-500"
                  animate={{
                    boxShadow: [
                      '0 0 5px rgba(34, 197, 94, 0.8)',
                      '0 0 15px rgba(34, 197, 94, 1)',
                      '0 0 5px rgba(34, 197, 94, 0.8)'
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="text-[10px] sm:text-xs text-green-300 font-semibold">
                  Dados atualizados há poucos segundos
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="p-3 sm:p-4 border-t border-gray-800 bg-black/50 backdrop-blur-md space-y-2">
          <div className="flex gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-700 text-gray-300 text-xs sm:text-sm h-9 sm:h-10"
              onClick={(e) => {
                e.stopPropagation();
                alert('💚 Salvo nos favoritos!');
              }}
            >
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Salvar</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-gray-700 text-gray-300 text-xs sm:text-sm h-9 sm:h-10"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share) {
                  navigator.share({
                    title: displayEvent.title,
                    text: `Confira este evento: ${displayEvent.title}`,
                    url: window.location.href
                  });
                }
              }}
            >
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Compartilhar</span>
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-xs sm:text-sm h-9 sm:h-10"
              onClick={handleViewReels}
            >
              Ver Reels
            </Button>
          </div>

          {/* Botão principal de ação */}
          {displayEvent.requires_approval ? (
            <Button
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-sm h-11"
              onClick={() => {
                onClose();
                navigate(createPageUrl("Feed"));
              }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Solicitar Acesso ao Evento
            </Button>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-sm h-11"
              disabled={availabilityStatus === 'sold_out'}
              onClick={() => {
                onClose();
                navigate(createPageUrl("ComprarIngresso") + `?eventId=${displayEvent.id}`);
              }}
            >
              {availabilityStatus === 'sold_out' ? (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Evento Lotado
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Garantir Meu Lugar
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}