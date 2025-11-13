import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Calendar, User, Users, Music, TrendingUp, 
  ExternalLink, Navigation, Sparkles, X 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SearchResults({ 
  searchData, 
  onClose, 
  onEventClick,
  isLoading 
}) {
  if (!searchData || (!isLoading && !searchData.results)) return null;

  const { query, detected_type, search_intent, results, suggestions, total_results } = searchData;

  const getTypeIcon = (type) => {
    switch(type) {
      case 'event': return Calendar;
      case 'artist': return User;
      case 'community': return Users;
      case 'venue': return MapPin;
      default: return Sparkles;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'event': return 'from-cyan-500 to-blue-500';
      case 'artist': return 'from-purple-500 to-pink-500';
      case 'community': return 'from-green-500 to-emerald-500';
      case 'venue': return 'from-orange-500 to-yellow-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'event': return { label: 'Evento', color: 'bg-cyan-600/20 border-cyan-500/30 text-cyan-300' };
      case 'artist': return { label: 'Artista', color: 'bg-purple-600/20 border-purple-500/30 text-purple-300' };
      case 'community': return { label: 'Comunidade', color: 'bg-green-600/20 border-green-500/30 text-green-300' };
      case 'venue': return { label: 'Local', color: 'bg-orange-600/20 border-orange-500/30 text-orange-300' };
      default: return { label: 'Resultado', color: 'bg-gray-600/20 border-gray-500/30 text-gray-300' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/95 backdrop-blur-xl z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="max-w-4xl mx-auto px-4 py-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">
                Resultados para: <span className="text-cyan-400">"{query}"</span>
              </h2>
            </div>
            {search_intent && (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                {search_intent}
              </p>
            )}
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

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 mx-auto mb-4 border-4 border-cyan-500 border-t-transparent rounded-full"
            />
            <p className="text-gray-400">Buscando eventos, artistas e locais...</p>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && total_results > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
              {total_results} resultado{total_results > 1 ? 's' : ''} encontrado{total_results > 1 ? 's' : ''}
            </Badge>
            {detected_type && (
              <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300">
                Tipo: {detected_type}
              </Badge>
            )}
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && results && results.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {results.map((result, index) => {
                const Icon = getTypeIcon(result.type);
                const badge = getTypeBadge(result.type);
                
                return (
                  <motion.div
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="bg-gray-900/80 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden"
                      onClick={() => onEventClick && result.type === 'event' && onEventClick(result)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Image/Icon */}
                          {result.image_url || result.avatar ? (
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                              <img 
                                src={result.image_url || result.avatar} 
                                alt={result.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br ${getTypeColor(result.type)} flex items-center justify-center`}>
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
                                  {result.name}
                                </h3>
                                <Badge className={`${badge.color} text-[10px]`}>
                                  {badge.label}
                                </Badge>
                              </div>
                            </div>

                            {/* Type-specific Info */}
                            {result.type === 'event' && (
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Calendar className="w-4 h-4 text-cyan-400" />
                                  <span>{format(new Date(result.date), "PPP 'às' HH:mm", { locale: ptBR })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <MapPin className="w-4 h-4 text-purple-400" />
                                  <span className="truncate">{result.location}</span>
                                </div>
                                {result.distance && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Navigation className="w-4 h-4 text-green-400" />
                                    <span>{result.distance}</span>
                                  </div>
                                )}
                                {result.genre && (
                                  <Badge className="bg-pink-600/20 border-pink-500/30 text-pink-300 text-[10px]">
                                    {result.genre}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {result.type === 'artist' && (
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Music className="w-4 h-4 text-purple-400" />
                                  <span>{result.genre}</span>
                                </div>
                                {result.next_show && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-4 h-4 text-cyan-400" />
                                    <span>Próximo show: {format(new Date(result.next_show), "dd/MM", { locale: ptBR })}</span>
                                  </div>
                                )}
                                {result.next_show_name && (
                                  <p className="text-xs text-gray-500 italic">
                                    "{result.next_show_name}"
                                  </p>
                                )}
                              </div>
                            )}

                            {result.type === 'community' && (
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Users className="w-4 h-4 text-green-400" />
                                  <span>{result.member_count} membros</span>
                                </div>
                                {result.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                                {result.type_label && (
                                  <Badge className="bg-green-600/20 border-green-500/30 text-green-300 text-[10px]">
                                    {result.type_label}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <TrendingUp className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Não encontramos nada para "{query}"
            </p>

            {suggestions && suggestions.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4 max-w-md mx-auto">
                <p className="text-sm font-semibold text-cyan-400 mb-3">
                  💡 Dicas de busca:
                </p>
                <ul className="text-left text-xs text-gray-400 space-y-2">
                  {suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={onClose}
              variant="outline"
              className="mt-6 border-gray-600 text-gray-300"
            >
              Voltar ao Mapa
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}