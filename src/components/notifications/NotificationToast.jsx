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
  new_comment: MessageCircle,
};

const NOTIFICATION_COLORS = {
  event_alert: { 
    primary: 'rgba(6, 182, 212, 1)', 
    secondary: 'rgba(139, 92, 246, 1)', 
    bg: 'from-cyan-900/95 to-purple-900/90',
    shadow: '0 0 40px rgba(6, 182, 212, 0.6), 0 0 80px rgba(139, 92, 246, 0.4)'
  },
  surprise_event: { 
    primary: 'rgba(251, 191, 36, 1)', 
    secondary: 'rgba(245, 158, 11, 1)', 
    bg: 'from-yellow-900/95 to-orange-900/90',
    shadow: '0 0 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(245, 158, 11, 0.4)'
  },
  level_up: { 
    primary: 'rgba(16, 185, 129, 1)', 
    secondary: 'rgba(5, 150, 105, 1)', 
    bg: 'from-green-900/95 to-emerald-900/90',
    shadow: '0 0 40px rgba(16, 185, 129, 0.6), 0 0 80px rgba(5, 150, 105, 0.4)'
  },
  request_approved: { 
    primary: 'rgba(16, 185, 129, 1)', 
    secondary: 'rgba(5, 150, 105, 1)', 
    bg: 'from-green-900/95 to-emerald-900/90',
    shadow: '0 0 40px rgba(16, 185, 129, 0.6), 0 0 80px rgba(5, 150, 105, 0.4)'
  },
  request_denied: { 
    primary: 'rgba(239, 68, 68, 1)', 
    secondary: 'rgba(220, 38, 38, 1)', 
    bg: 'from-red-900/95 to-rose-900/90',
    shadow: '0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(220, 38, 38, 0.4)'
  },
  new_message: { 
    primary: 'rgba(168, 85, 247, 1)', 
    secondary: 'rgba(236, 72, 153, 1)', 
    bg: 'from-purple-900/95 to-pink-900/90',
    shadow: '0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(236, 72, 153, 0.4)'
  },
  new_follower: { 
    primary: 'rgba(236, 72, 153, 1)', 
    secondary: 'rgba(168, 85, 247, 1)', 
    bg: 'from-pink-900/95 to-purple-900/90',
    shadow: '0 0 40px rgba(236, 72, 153, 0.6), 0 0 80px rgba(168, 85, 247, 0.4)'
  },
  new_like: { 
    primary: 'rgba(239, 68, 68, 1)', 
    secondary: 'rgba(220, 38, 38, 1)', 
    bg: 'from-red-900/95 to-rose-900/90',
    shadow: '0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(220, 38, 38, 0.4)'
  },
  new_comment: { 
    primary: 'rgba(59, 130, 246, 1)', 
    secondary: 'rgba(37, 99, 235, 1)', 
    bg: 'from-blue-900/95 to-indigo-900/90',
    shadow: '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(37, 99, 235, 0.4)'
  },
};

export default function NotificationToast({ notification, onClose, onClick }) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const colors = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.event_alert;

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.3 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.8
      }}
      whileHover={{ scale: 1.02, x: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full max-w-sm cursor-pointer group"
      onClick={onClick}
    >
      {/* Outer Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.primary}40 0%, transparent 70%)`,
          filter: 'blur(25px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Card */}
      <div
        className={`relative bg-gradient-to-r ${colors.bg} backdrop-blur-xl rounded-2xl border-2 p-4 overflow-hidden`}
        style={{
          borderColor: colors.primary,
          boxShadow: colors.shadow
        }}
      >
        {/* Animated Background Gradients */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 30%, ${colors.primary}20 0%, transparent 50%)`
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Top Gloss */}
        <div
          className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)'
          }}
        />

        {/* Scan Line Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${colors.primary}40 48%, ${colors.primary}70 50%, ${colors.primary}40 52%, transparent 100%)`,
            height: '100%',
          }}
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10 flex items-start gap-3">
          {/* Animated Icon */}
          <motion.div
            className="flex-shrink-0 rounded-full p-2.5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 0 25px ${colors.primary}90, inset 0 2px 0 rgba(255,255,255,0.3)`
            }}
            animate={{
              boxShadow: [
                `0 0 25px ${colors.primary}90`,
                `0 0 35px ${colors.primary}`,
                `0 0 25px ${colors.primary}90`
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {/* Icon Inner Glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 60%)'
              }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            
            <motion.div
              animate={notification.is_surprise ? { 
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ duration: 0.5, repeat: notification.is_surprise ? Infinity : 0, repeatDelay: 2 }}
            >
              <Icon className="w-5 h-5 text-white relative z-10" />
            </motion.div>
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.h4 
              className="font-bold text-white text-sm mb-1 line-clamp-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {notification.title}
            </motion.h4>
            
            <motion.p 
              className="text-xs text-gray-100 line-clamp-2 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {notification.message}
            </motion.p>

            {/* Tags */}
            <motion.div 
              className="flex flex-wrap gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {notification.location_match && (
                <Badge 
                  className="text-[9px] px-1.5 py-0 h-4 border-0"
                  style={{
                    background: 'rgba(6, 182, 212, 0.3)',
                    color: '#06B6D4',
                    boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
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
                    color: '#A855F7',
                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                  }}
                >
                  <Music2 className="w-2.5 h-2.5 mr-0.5" />
                  {notification.genre_match[0]}
                </Badge>
              )}
            </motion.div>
          </div>

          {/* Close Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4 text-white/90" />
          </motion.button>
        </div>

        {/* Surprise Event Particles */}
        {notification.is_surprise && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full pointer-events-none"
                style={{
                  background: i % 2 === 0 ? colors.primary : colors.secondary,
                  left: `${15 + (i * 10)}%`,
                  top: `${20 + Math.random() * 60}%`,
                  boxShadow: `0 0 10px ${i % 2 === 0 ? colors.primary : colors.secondary}`
                }}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
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
            boxShadow: `0 0 20px ${colors.primary}90`
          }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 6, ease: "linear" }}
        />

        {/* Corner Accent Lights */}
        <motion.div
          className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.secondary}30 0%, transparent 70%)`,
            filter: 'blur(10px)'
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
}