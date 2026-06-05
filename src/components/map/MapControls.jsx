import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Navigation, Layers, Zap } from "lucide-react";
import { motion } from "framer-motion";

/**
 * CONTROLES DE NAVEGAÇÃO DO MAPA
 * - Zoom in/out
 * - Recentralizar
 * - Camadas
 * - Contador de eventos
 */
export default function MapControls({ 
  zoomLevel, 
  onZoomIn, 
  onZoomOut, 
  onRecenter,
  eventCount,
  clusterCount,
  onToggleLayers
}) {
  return (
    <div className="absolute bottom-32 right-3 z-30 flex flex-col gap-2">
      {/* Event Counter */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-black/80 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl px-3 py-2 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <div className="text-xs text-white">
            <div className="font-bold">{eventCount}</div>
            <div className="text-gray-400 text-[10px]">eventos</div>
          </div>
        </div>
        {clusterCount > 0 && (
          <Badge className="mt-1 bg-purple-600/20 border-purple-500/30 text-purple-300 text-[9px] w-full justify-center">
            {clusterCount} grupos
          </Badge>
        )}
      </motion.div>

      {/* Zoom Controls */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/80 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl overflow-hidden shadow-xl"
      >
        <Button
          onClick={onZoomIn}
          disabled={zoomLevel >= 18}
          size="icon"
          className="w-12 h-12 bg-transparent hover:bg-cyan-600/30 active:bg-cyan-600/50 border-0 border-b border-gray-700 rounded-none disabled:opacity-30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          style={{ boxShadow: 'inset 0 0 10px rgba(6, 182, 212, 0.2)' }}
        >
          <Plus className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
        </Button>
        
        <div className="px-3 py-2 text-center border-b border-gray-700">
          <div className="text-xs font-bold text-cyan-400">{zoomLevel}</div>
          <div className="text-[9px] text-gray-400">zoom</div>
        </div>
        
        <Button
          onClick={onZoomOut}
          disabled={zoomLevel <= 10}
          size="icon"
          className="w-12 h-12 bg-transparent hover:bg-cyan-600/30 active:bg-cyan-600/50 border-0 rounded-none disabled:opacity-30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          style={{ boxShadow: 'inset 0 0 10px rgba(6, 182, 212, 0.2)' }}
        >
          <Minus className="w-5 h-5 text-cyan-400" />
        </Button>
      </motion.div>

      {/* Recenter Button */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={onRecenter}
          size="icon"
          className="w-12 h-12 bg-black/80 backdrop-blur-xl border-2 border-purple-500/50 rounded-xl shadow-xl relative overflow-hidden group hover:border-purple-400 active:border-purple-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-purple-500/30"
            animate={{
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Navigation className="w-5 h-5 text-purple-300 relative z-10 group-hover:text-purple-200 transition-colors" />
        </Button>
      </motion.div>

      {/* Layers Toggle */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={onToggleLayers}
          size="icon"
          className="w-12 h-12 bg-black/80 backdrop-blur-xl border-2 border-green-500/50 rounded-xl shadow-xl hover:border-green-400 active:border-green-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50"
          style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}
        >
          <Layers className="w-5 h-5 text-green-300 hover:text-green-200 transition-colors" />
        </Button>
      </motion.div>
    </div>
  );
}