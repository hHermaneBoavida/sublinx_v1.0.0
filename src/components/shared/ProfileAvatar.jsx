import React from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { DEFAULT_AVATAR } from "./constants";

export default function ProfileAvatar({ user, stats, size = "md", onClick }) {
  const sizes = {
    sm: { avatar: "w-16 h-16", level: "w-8 h-8", crown: "w-5 h-5", levelText: "text-xs" },
    md: { avatar: "w-24 h-24", level: "w-10 h-10", crown: "w-6 h-6", levelText: "text-sm" },
    lg: { avatar: "w-32 h-32", level: "w-12 h-12", crown: "w-8 h-8", levelText: "text-sm" }
  };

  const config = sizes[size] || sizes.md;
  const isPremium = user?.is_pro_member || user?.is_organizer;

  return (
    <div className="relative" onClick={onClick}>
      {/* Glow animado */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${
            user?.is_organizer 
              ? 'rgba(251, 191, 36, 0.4)' 
              : 'rgba(6, 182, 212, 0.4)'
          } 0%, transparent 70%)`,
          filter: 'blur(20px)',
          width: '180px',
          height: '180px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Avatar */}
      <motion.img
        src={user?.avatar_url || DEFAULT_AVATAR}
        alt={user?.full_name || 'User'}
        className={`${config.avatar} rounded-full object-cover relative z-10 border-4 ${onClick ? 'cursor-pointer' : ''}`}
        style={{
          borderColor: user?.is_organizer ? '#FBBF24' : '#06B6D4',
          boxShadow: `0 0 40px ${user?.is_organizer ? '#FBBF24' : '#06B6D4'}`
        }}
        whileHover={onClick ? { scale: 1.05, rotate: 5 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      />

      {/* Level Badge */}
      {stats?.level && (
        <motion.div
          className={`absolute -bottom-2 -right-2 ${config.level} rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 border-4 border-black flex items-center justify-center z-20`}
          whileHover={{ scale: 1.1, rotate: -10 }}
          style={{ boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)' }}
        >
          <span className={`${config.levelText} font-bold text-white`}>{stats.level}</span>
        </motion.div>
      )}

      {/* Crown para Premium */}
      {isPremium && (
        <motion.div
          className="absolute -top-2 -right-2 z-20"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Crown className={config.crown + " text-yellow-400"} style={{ filter: 'drop-shadow(0 0 10px #FBBF24)' }} />
        </motion.div>
      )}
    </div>
  );
}