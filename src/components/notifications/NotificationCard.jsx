import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle, Trash2, MapPin, Music2, Zap, X } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const NOTIFICATION_ICONS = {
  event_alert: Bell,
  surprise_event: Zap,
  level_up: CheckCircle,
  request_approved: CheckCircle,
  request_denied: X,
  new_message: MessageCircle,
  new_follower: UserPlus,
  new_like: Heart,
  new_comment: MessageCircle,
};

const NOTIFICATION_COLORS = {
  event_alert: { 
    bg: 'bg-cyan-500/10', 
    border: 'border-cyan-500/30', 
    text: 'text-cyan-400', 
    icon: 'text-cyan-400',
    glow: 'rgba(6, 182, 212, 0.3)'
  },
  surprise_event: { 
    bg: 'bg-yellow-500/10', 
    border: 'border-yellow-500/30', 
    text: 'text-yellow-400', 
    icon: 'text-yellow-400',
    glow: 'rgba(251, 191, 36, 0.3)'
  },
  level_up: { 
    bg: 'bg-green-500/10', 
    border: 'border-green-500/30', 
    text: 'text-green-400', 
    icon: 'text-green-400',
    glow: 'rgba(16, 185, 129, 0.3)'
  },
  request_approved: { 
    bg: 'bg-green-500/10', 
    border: 'border-green-500/30', 
    text: 'text-green-400', 
    icon: 'text-green-400',
    glow: 'rgba(16, 185, 129, 0.3)'
  },
  request_denied: { 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/30', 
    text: 'text-red-400', 
    icon: 'text-red-400',
    glow: 'rgba(239, 68, 68, 0.3)'
  },
  new_message: { 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/30', 
    text: 'text-purple-400', 
    icon: 'text-purple-400',
    glow: 'rgba(168, 85, 247, 0.3)'
  },
  new_follower: { 
    bg: 'bg-pink-500/10', 
    border: 'border-pink-500/30', 
    text: 'text-pink-400', 
    icon: 'text-pink-400',
    glow: 'rgba(236, 72, 153, 0.3)'
  },
  new_like: { 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/30', 
    text: 'text-red-400', 
    icon: 'text-red-400',
    glow: 'rgba(239, 68, 68, 0.3)'
  },
  new_comment: { 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30', 
    text: 'text-blue-400', 
    icon: 'text-blue-400',
    glow: 'rgba(59, 130, 246, 0.3)'
  },
};

export default function NotificationCard({ notification, onClick, onDelete, isDeleting }) {
  // Validação
  if (!notification || !notification.id) {
    console.warn('NotificationCard recebeu notificação inválida:', notification);
    return null;
  }

  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const colors = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.event_alert;

  // Safe date formatting
  let timeAgo = '';
  try {
    if (notification.created_date) {
      timeAgo = formatDistanceToNow(new Date(notification.created_date), { 
        addSuffix: true, 
        locale: ptBR 
      });
    }
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    timeAgo = 'agora';
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="group"
    >
      <Card
        className={`cursor-pointer transition-all duration-300 overflow-hidden ${
          notification.is_read
            ? 'bg-gray-900/50 border-gray-700 opacity-70'
            : `${colors.bg} ${colors.border} border-2 shadow-lg`
        }`}
        onClick={onClick}
        style={{
          boxShadow: !notification.is_read 
            ? `0 0 25px ${colors.glow}, 0 0 50px ${colors.glow}` 
            : 'none'
        }}
      >
        <CardContent className="p-4 relative overflow-hidden">
          {/* Background Glow for Unread */}
          {!notification.is_read && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 10% 20%, ${colors.glow} 0%, transparent 60%)`,
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}

          {/* Scan Line for Unread */}
          {!notification.is_read && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(to bottom, transparent 0%, ${colors.glow} 48%, ${colors.glow.replace('0.3', '0.6')} 50%, ${colors.glow} 52%, transparent 100%)`,
              }}
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          )}

          <div className="relative z-10 flex items-start gap-3">
            {/* Icon with Glow */}
            <motion.div 
              className={`flex-shrink-0 p-2.5 rounded-full ${colors.bg} border ${colors.border} relative overflow-hidden`}
              style={{
                boxShadow: !notification.is_read 
                  ? `0 0 20px ${colors.glow}, inset 0 2px 0 rgba(255,255,255,0.2)` 
                  : 'none'
              }}
              animate={!notification.is_read ? {
                boxShadow: [
                  `0 0 20px ${colors.glow}`,
                  `0 0 30px ${colors.glow.replace('0.3', '0.6')}`,
                  `0 0 20px ${colors.glow}`
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Icon Inner Glow */}
              {!notification.is_read && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)'
                  }}
                />
              )}
              <Icon className={`w-5 h-5 ${colors.icon} relative z-10`} />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className={`font-semibold text-sm line-clamp-1 ${
                  notification.is_read ? 'text-gray-400' : 'text-white'
                }`}>
                  {notification.title || 'Notificação'}
                </h4>
                {!notification.is_read && (
                  <motion.div
                    className="flex-shrink-0 w-2 h-2 rounded-full"
                    style={{
                      background: colors.icon.replace('text-', ''),
                      boxShadow: `0 0 8px ${colors.glow}`
                    }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              <p className={`text-xs mb-2 line-clamp-2 ${
                notification.is_read ? 'text-gray-500' : 'text-gray-300'
              }`}>
                {notification.message || 'Sem descrição'}
              </p>

              {/* Tags and Meta */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-[10px] text-gray-500">
                  {timeAgo}
                </span>

                {notification.location_match && (
                  <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-[9px] px-1 py-0">
                    <MapPin className="w-2.5 h-2.5 mr-0.5" />
                    Próximo
                  </Badge>
                )}

                {notification.genre_match && Array.isArray(notification.genre_match) && notification.genre_match.length > 0 && (
                  <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-[9px] px-1 py-0">
                    <Music2 className="w-2.5 h-2.5 mr-0.5" />
                    {notification.genre_match[0]}
                  </Badge>
                )}

                {notification.is_surprise && (
                  <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-[9px] px-1 py-0 animate-pulse">
                    <Zap className="w-2.5 h-2.5 mr-0.5" />
                    Surpresa
                  </Badge>
                )}
              </div>
            </div>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Deseja deletar esta notificação?')) {
                  onDelete();
                }
              }}
              disabled={isDeleting}
              className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              {isDeleting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Trash2 className="w-4 h-4" />
                </motion.div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}