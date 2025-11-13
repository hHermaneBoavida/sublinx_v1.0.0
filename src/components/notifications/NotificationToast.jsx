import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Calendar, Heart, TrendingUp, Bell, CheckCircle, XCircle, MessageCircle, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const NOTIFICATION_ICONS = {
  event_alert: Calendar,
  surprise_event: Zap,
  level_up: TrendingUp,
  request_approved: CheckCircle,
  request_denied: XCircle,
  new_message: MessageCircle,
  new_follower: UserPlus,
};

const NOTIFICATION_COLORS = {
  event_alert: { bg: 'from-cyan-600 to-blue-600', icon: 'text-cyan-400' },
  surprise_event: { bg: 'from-purple-600 to-pink-600', icon: 'text-purple-400' },
  level_up: { bg: 'from-yellow-600 to-orange-600', icon: 'text-yellow-400' },
  request_approved: { bg: 'from-green-600 to-emerald-600', icon: 'text-green-400' },
  request_denied: { bg: 'from-red-600 to-rose-600', icon: 'text-red-400' },
  new_message: { bg: 'from-indigo-600 to-purple-600', icon: 'text-indigo-400' },
  new_follower: { bg: 'from-pink-600 to-rose-600', icon: 'text-pink-400' },
};

export default function NotificationToast({ notification, onClose, onClick }) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const colors = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.event_alert;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative cursor-pointer"
      onClick={onClick}
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl blur-xl"
        style={{
          background: `linear-gradient(135deg, ${colors.bg.split(' ')[1].replace('to-', 'rgba(')}50, ${colors.bg.split(' ')[2].replace('to-', 'rgba(')}30)`,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Card */}
      <div 
        className={`relative bg-gradient-to-r ${colors.bg} p-4 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-xl max-w-sm`}
        style={{
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.4), 0 10px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3 pr-6">
          {/* Icon */}
          <motion.div
            className={`flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm`}
            animate={notification.is_surprise ? {
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{
              duration: 0.5,
              repeat: notification.is_surprise ? Infinity : 0,
              repeatDelay: 2
            }}
          >
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </motion.div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
              {notification.title}
            </h4>
            <p className="text-white/90 text-xs line-clamp-2 mb-2">
              {notification.message}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {notification.location_match && (
                <Badge className="bg-white/20 text-white border-0 text-[9px] px-1.5 py-0.5">
                  📍 Perto de você
                </Badge>
              )}
              {notification.genre_match && notification.genre_match.length > 0 && (
                <Badge className="bg-white/20 text-white border-0 text-[9px] px-1.5 py-0.5">
                  🎵 {notification.genre_match[0]}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Reflexo superior */}
        <div 
          className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.15), transparent)'
          }}
        />

        {/* Partículas */}
        {notification.is_surprise && [...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{
              left: `${30 + i * 20}%`,
              top: `${40 + i * 10}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}