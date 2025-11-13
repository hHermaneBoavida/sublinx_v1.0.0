import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, MapPin, Navigation, Users, DollarSign,
  Clock, Music, TrendingUp, ExternalLink, Zap
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GenreBadge } from "../shared/EventBadge";
import { motion } from "framer-motion";

/**
 * CARD DE RESULTADO OTIMIZADO
 * Reutilizável para eventos, artistas, comunidades
 */
export default function SearchResultCard({ 
  result, 
  index, 
  onClick,
  highlightTerm 
}) {
  const renderEventCard = () => (
    <div className="flex gap-4">
      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden relative">
        <img 
          src={result.image_url || `https://picsum.photos/300/300?random=${result.id}`} 
          alt={result.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {result._fuzzyScore && result._fuzzyScore < 0.9 && (
          <div className="absolute top-1 right-1">
            <Badge className="bg-yellow-600/90 text-white text-[8px] px-1 py-0">
              {Math.round(result._fuzzyScore * 100)}%
            </Badge>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
          {result.name}
        </h3>

        <div className="space-y-1.5 text-sm mb-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="truncate">
              {format(new Date(result.date), "EEE, dd/MM 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="truncate">{result.location}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {result.distance && (
              <Badge className="bg-green-600/20 border-green-500/30 text-green-300 text-[10px]">
                <Navigation className="w-3 h-3 mr-1" />
                {result.distance}
              </Badge>
            )}
            
            {result.genre && <GenreBadge genre={result.genre} size="xs" />}
            
            {result.price > 0 && (
              <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-[10px]">
                <DollarSign className="w-3 h-3 mr-1" />
                R$ {parseFloat(result.price).toFixed(2)}
              </Badge>
            )}

            {result.current_attendees > 0 && (
              <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-300 text-[10px]">
                <Users className="w-3 h-3 mr-1" />
                {result.current_attendees}/{result.max_capacity}
              </Badge>
            )}
          </div>
        </div>

        {result._score && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>Score de relevância: {Math.round(result._score)}/115</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderArtistCard = () => (
    <div className="flex gap-4">
      <div className="w-20 h-20 flex-shrink-0 rounded-full overflow-hidden">
        <img 
          src={result.avatar || `https://i.pravatar.cc/80?u=${result.id}`} 
          alt={result.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">
          {result.name}
        </h3>
        
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Music className="w-4 h-4 text-purple-400" />
            <span>{result.genre}</span>
          </div>
          
          {result.next_show && (
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Próximo: {format(new Date(result.next_show), "dd/MM", { locale: ptBR })}</span>
            </div>
          )}
          
          {result.next_show_name && (
            <p className="text-xs text-gray-500 italic line-clamp-1">
              "{result.next_show_name}"
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCommunityCard = () => (
    <div className="flex gap-4">
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
        {result.image ? (
          <img 
            src={result.image} 
            alt={result.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <Users className="w-10 h-10 text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-green-400 transition-colors">
          {result.name}
        </h3>
        
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
            <Badge className="bg-green-600/20 border-green-500/30 text-green-300 text-[10px] capitalize">
              {result.type_label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className="bg-gray-900/80 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden group relative"
        onClick={onClick}
      >
        {/* Glow effect on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.1) 0%, transparent 70%)'
          }}
        />

        <CardContent className="p-4 relative z-10">
          {result.type === 'event' && renderEventCard()}
          {result.type === 'artist' && renderArtistCard()}
          {result.type === 'community' && renderCommunityCard()}
        </CardContent>
      </Card>
    </motion.div>
  );
}