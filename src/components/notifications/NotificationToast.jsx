import React from "react";
import { motion } from "framer-motion";
import { X, Bell, Heart, MessageCircle, UserPlus, CheckCircle, Calendar, MapPin, Music2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const NOTIFICATION_ICONS = {
  event_alert: Bell,
  surprise_event: Zap,
  level_up: CheckCircle,
  request_approved: CheckCircle,
  request_denied: X,
  new_message: MessageCircle,
  new_follower: UserPlus,
  new_like: Heart,
};

const NOTIFICATION_COLORS = {
  event_alert: { primary: 'rgba(6, 182, 212, 0.9)', secondary: 'rgba(139, 92, 246, 0.7)', bg: 'from-cyan-900/90 to-purple-900/80' },
  surprise_event: { primary: 'rgba(251, 191, 36, 0.9)', secondary: 'rgba(245, 158, 11, 0.7)', bg: 'from-yellow-900/90 to-orange-900/80' },
  level_up: { primary: 'rgba(16, 185, 129, 0.9)', secondary: 'rgba(5, 150, 105, 0.7)', bg: 'from-green-900/90 to-emerald-900/80' },
  request_approved: { primary: 'rgba(16, 185, 129, 0.9)', secondary: 'rgba(5, 150, 105, 0.7)', bg: 'from-green-900/90 to-emerald-900/80' },
  request_denied: { primary: 'rgba(239, 68, 68, 0.9)', secondary: 'rgba(220, 38, 38, 0.7)', bg: 'from-red-900/90 to-rose-900/80' },
  new_message: { primary: 'rgba(168, 85, 247, 0.9)', secondary: 'rgba(236, 72, 153, 0.7)', bg: 'from-purple-900/90 to-pink-900/80' },
  new_follower: { primary: 'rgba(236, 72, 153, 0.9)', secondary: 'rgba(168, 85, 247, 0.7)', bg: 'from-pink-900/90 to-purple-900/80' },
  new_like: { primary: 'rgba(239, 68, 68, 0.9)', secondary: 'rgba(220, 38, 38, 0.7)', bg: 'from-red-900/90 to-rose-900/80' },
};

export default function NotificationToast({ notification, onClose, onClick }) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const colors = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.event_alert;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative w-full max-w-sm cursor-pointer group"
      onClick={onClick}
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${colors.primary}40 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Main Card */}
      <div
        className={`relative bg-gradient-to-r ${colors.bg} backdrop-blur-xl rounded-2xl border-2 p-4 shadow-2xl overflow-hidden`}
        style={{
          borderColor: colors.primary,
          boxShadow: `0 0 30px ${colors.primary}60, 0 0 60px ${colors.secondary}40`
        }}
      >
        {/* Top Gloss */}
        <div
          className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)'
          }}
        />

        {/* Animated Scan Line */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${colors.primary}30 48%, ${colors.primary}50 50%, ${colors.primary}30 52%, transparent 100%)`,
            height: '100%',
          }}
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10 flex items-start gap-3">
          {/* Icon */}
          <motion.div
            className="flex-shrink-0 rounded-full p-2 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 0 20px ${colors.primary}80`
            }}
            animate={{
              boxShadow: [
                `0 0 20px ${colors.primary}80`,
                `0 0 30px ${colors.primary}`,
                `0 0 20px ${colors.primary}80`
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)'
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <Icon className="w-5 h-5 text-white relative z-10" />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
              {notification.title}
            </h4>
            <p className="text-xs text-gray-200 line-clamp-2 mb-2">
              {notification.message}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {notification.location_match && (
                <Badge 
                  className="text-[9px] px-1.5 py-0 h-4 border-0"
                  style={{
                    background: 'rgba(6, 182, 212, 0.3)',
                    color: '#06B6D4'
                  }}
                >
                  <MapPin className="w-2.5 h-2.5 mr-0.5" />
                  Próximo
                </Badge>
              )}
              {notification.genre_match?.length > 0 && (
                <Badge 
                  className="text-[9px] px-1.5 py-0 h-4 border-0"
                  style={{
                    background: 'rgba(168, 85, 247, 0.3)',
                    color: '#A855F7'
                  }}
                >
                  <Music2 className="w-2.5 h-2.5 mr-0.5" />
                  {notification.genre_match[0]}
                </Badge>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Surprise Event Particles */}
        {notification.is_surprise && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full pointer-events-none"
                style={{
                  background: i % 2 === 0 ? colors.primary : colors.secondary,
                  left: `${20 + i * 15}%`,
                  top: `${30 + Math.random() * 40}%`,
                  boxShadow: `0 0 10px ${i % 2 === 0 ? colors.primary : colors.secondary}`
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </>
        )}

        {/* Progress Bar Auto-dismiss */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 rounded-b-2xl"
          style={{
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
            boxShadow: `0 0 15px ${colors.primary}80`
          }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 6, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}