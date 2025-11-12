import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Music2, Home, Sparkles, Star } from 'lucide-react';

const VENUE_ICONS = {
  club: Music2,
  bar: Home,
  warehouse: Home,
  rooftop: Sparkles,
  studio: Music2,
  gallery: Sparkles,
  underground_space: Star,
  cultural_center: Home
};

const VENUE_COLORS = {
  club: 'rgba(236, 72, 153, 0.8)',
  bar: 'rgba(251, 191, 36, 0.8)',
  warehouse: 'rgba(139, 92, 246, 0.8)',
  rooftop: 'rgba(59, 130, 246, 0.8)',
  studio: 'rgba(168, 85, 247, 0.8)',
  gallery: 'rgba(249, 115, 22, 0.8)',
  underground_space: 'rgba(6, 182, 212, 0.8)',
  cultural_center: 'rgba(34, 197, 94, 0.8)'
};

export default function VenuePin({ venue, position, onClick }) {
  const Icon = VENUE_ICONS[venue.type] || MapPin;
  const color = VENUE_COLORS[venue.type] || 'rgba(156, 163, 175, 0.8)';
  
  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto z-[5]"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
      }}
      whileHover={{ scale: 1.15, zIndex: 15 }}
      onClick={() => onClick(venue)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute bottom-full mb-2 px-3 py-2 bg-black/95 backdrop-blur-xl rounded-xl text-white text-[11px] whitespace-nowrap border-2 shadow-2xl pointer-events-none"
        style={{
          borderColor: color,
          boxShadow: `0 0 20px ${color}`
        }}
      >
        <div className="font-bold text-yellow-300 mb-1 flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {venue.name}
        </div>
        <div className="text-[10px] text-gray-400">
          {venue.type === 'club' && '🎵 Club'}
          {venue.type === 'bar' && '🍺 Bar'}
          {venue.type === 'warehouse' && '🏭 Warehouse'}
          {venue.type === 'rooftop' && '🌆 Rooftop'}
          {venue.type === 'studio' && '🎙️ Studio'}
          {venue.type === 'gallery' && '🎨 Galeria'}
          {venue.type === 'underground_space' && '🔥 Underground'}
          {venue.type === 'cultural_center' && '🏛️ Centro Cultural'}
        </div>
        {venue.upcoming_events_count > 0 && (
          <div className="text-[9px] text-cyan-300 mt-1">
            {venue.upcoming_events_count} evento(s) próximo(s)
          </div>
        )}
      </motion.div>

      {/* Pin Visual */}
      <motion.div 
        className="relative"
        animate={{
          boxShadow: [
            `0 0 15px ${color}`,
            `0 0 25px ${color}`,
            `0 0 15px ${color}`
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          filter: `drop-shadow(0 0 6px ${color})`
        }}
      >
        {/* Pin Principal - Menor que eventos */}
        <div 
          className="w-7 h-7 rounded-full border-2 border-white/80 bg-gradient-to-br flex items-center justify-center relative opacity-70 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${color}, rgba(0,0,0,0.6))`
          }}
        >
          <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          
          {/* Badge de eventos */}
          {venue.upcoming_events_count > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border border-white flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">
                {venue.upcoming_events_count > 9 ? '9+' : venue.upcoming_events_count}
              </span>
            </div>
          )}
        </div>

        {/* Glow Sutil */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </motion.div>
    </motion.div>
  );
}