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
        className="bg-gray-950/80 backdrop-blur-md border border-gray-700 rounded-xl px-3 py-2 shadow-md"
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
        className="bg-gray-950/80 backdrop-blur-md border border-gray-700 rounded-xl overflow-hidden shadow-md"
      >
        <Button
          onClick={onZoomIn}
          disabled={zoomLevel >= 18}
          size="icon"
          className="w-12 h-12 bg-transparent hover:bg-gray-800 active:bg-gray-700 border-0 border-b border-gray-700 rounded-none disabled:opacity-30 transition-all duration-200 focus:outline-none"
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
          className="w-12 h-12 bg-transparent hover:bg-gray-800 active:bg-gray-700 border-0 rounded-none disabled:opacity-30 transition-all duration-200 focus:outline-none"
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
          className="w-12 h-12 bg-gray-950/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-md relative overflow-hidden group hover:border-gray-600 active:border-gray-500 transition-all duration-200 focus:outline-none"
        >
          <Navigation className="w-5 h-5 text-gray-300 relative z-10 group-hover:text-white transition-colors" />
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
          className="w-12 h-12 bg-gray-950/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-md hover:border-gray-600 active:border-gray-500 transition-all duration-200 focus:outline-none"
        >
          <Layers className="w-5 h-5 text-green-300 hover:text-green-200 transition-colors" />
        </Button>
      </motion.div>
    </div>
  );
}