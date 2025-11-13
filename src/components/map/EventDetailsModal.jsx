import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, Users, Clock, Tag, Heart, Share2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EventDetailsModal({ event, onClose }) {
  if (!event || !event.location) return null;

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
            src={event.image_url || `https://picsum.photos/800/400?random=${event.id}`}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* Botão Fechar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Título e Local */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <img 
                src={`https://i.pravatar.cc/48?u=${event.organizer_id}`} 
                alt={event.organizer}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-cyan-500/50"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1 truncate">{event.title}</h2>
                <p className="text-gray-300 text-xs sm:text-sm truncate">{event.organizer}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Scrollável */}
        <div className="overflow-y-auto max-h-[calc(90vh-12rem)] sm:max-h-[calc(90vh-14rem)] md:max-h-96 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-xs">
              {event.genre}
            </Badge>
            <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
              {event.type}
            </Badge>
            {event.is_secret && (
              <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-xs">
                🔒 Secreto
              </Badge>
            )}
          </div>

          {/* Info Rápida */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Data</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  {format(new Date(event.date), "dd MMM", { locale: ptBR })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Horário</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  {format(new Date(event.date), "HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Pessoas</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  {event.current_attendees}/{event.max_capacity}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-400">Preço</div>
                <div className="text-xs sm:text-sm text-white font-medium truncate">
                  R$ {event.price?.toFixed(2) || '0.00'}
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
                  {event.location.venue_name}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">
                  {event.location.address}
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs flex-shrink-0 h-8 px-2 sm:px-3">
                <Navigation className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Rota</span>
              </Button>
            </div>
          </div>

          {/* Descrição */}
          {event.description && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2">Sobre o Evento</h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Vibes */}
          {event.vibe_tags && event.vibe_tags.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2">Vibes</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {event.vibe_tags.map((tag, index) => (
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
        </div>

        {/* Footer com Ações */}
        <div className="p-3 sm:p-4 border-t border-gray-800 bg-black/50 backdrop-blur-md flex gap-2 sm:gap-3">
          <Button variant="outline" className="flex-1 border-gray-700 text-gray-300 text-xs sm:text-sm h-9 sm:h-10">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Salvar</span>
          </Button>
          <Button variant="outline" className="flex-1 border-gray-700 text-gray-300 text-xs sm:text-sm h-9 sm:h-10">
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Compartilhar</span>
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-xs sm:text-sm h-9 sm:h-10">
            Ver Reels
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}