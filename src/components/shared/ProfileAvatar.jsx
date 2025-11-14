import React from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";

export default function ProfileAvatar({ user, stats, size = "lg" }) {
  const sizes = {
    sm: { avatar: "w-16 h-16", glow: "120px", level: "w-8 h-8 text-xs", crown: "w-5 h-5" },
    md: { avatar: "w-24 h-24", glow: "150px", level: "w-10 h-10 text-sm", crown: "w-6 h-6" },
    lg: { avatar: "w-32 h-32", glow: "180px", level: "w-12 h-12 text-sm", crown: "w-8 h-8" }
  };

  const config = sizes[size];
  const borderColor = user.is_organizer ? '#FBBF24' : '#06B6D4';

  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)`,
          filter: 'blur(20px)',
          width: config.glow,
          height: config.glow,
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

      <motion.img
        src={user.avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png"}
        alt={user.full_name}
        className={`${config.avatar} rounded-full object-cover relative z-10 border-4`}
        style={{
          borderColor,
          boxShadow: `0 0 40px ${borderColor}`
        }}
        whileHover={{ scale: 1.05, rotate: 5 }}
      />

      {stats?.level && (
        <motion.div
          className={`absolute -bottom-2 -right-2 ${config.level} rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 border-4 border-black flex items-center justify-center z-20`}
          whileHover={{ scale: 1.1, rotate: -10 }}
          style={{ boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)' }}
        >
          <span className={`${config.level.includes('text-xs') ? 'text-xs' : 'text-sm'} font-bold text-white`}>
            {stats.level}
          </span>
        </motion.div>
      )}

      {(user.is_pro_member || user.is_organizer) && (
        <motion.div
          className="absolute -top-2 -right-2 z-20"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Crown className={`${config.crown} text-yellow-400`} style={{ filter: 'drop-shadow(0 0 10px #FBBF24)' }} />
        </motion.div>
      )}
    </div>
  );
}