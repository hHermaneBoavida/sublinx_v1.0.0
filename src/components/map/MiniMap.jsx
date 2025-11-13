import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * MINI MAPA DE ORIENTAÇÃO
 * Mostra overview da área e densidade
 */
export default function MiniMap({ events, userLocation, mapBounds, currentZoom }) {
  // Calcular grid de densidade
  const densityGrid = useMemo(() => {
    if (!events || events.length === 0) return [];

    const gridSize = 5; // 5x5 grid
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));

    events.forEach(event => {
      if (!event?.location?.lat || !event?.location?.lng) return;

      const x = Math.floor(
        ((event.location.lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * gridSize
      );
      const y = Math.floor(
        ((mapBounds.maxLat - event.location.lat) / (mapBounds.maxLat - mapBounds.minLat)) * gridSize
      );

      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        grid[y][x]++;
      }
    });

    return grid;
  }, [events, mapBounds]);

  const maxDensity = useMemo(() => {
    return Math.max(...densityGrid.flat(), 1);
  }, [densityGrid]);

  const userGridPos = useMemo(() => {
    const x = ((userLocation.lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    const y = ((mapBounds.maxLat - userLocation.lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    return { x, y };
  }, [userLocation, mapBounds]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-3 right-3 z-20 bg-black/80 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl p-3 shadow-xl"
      style={{ width: '120px', height: '120px' }}
    >
      <div className="text-[9px] text-gray-400 mb-2 flex items-center justify-between">
        <span>Área</span>
        <span className="text-cyan-400">Z{currentZoom}</span>
      </div>

      {/* Grid de densidade */}
      <div className="grid grid-cols-5 gap-0.5 mb-2">
        {densityGrid.map((row, y) => 
          row.map((count, x) => {
            const intensity = count / maxDensity;
            const color = intensity > 0.7 ? 'rgba(239, 68, 68, 0.8)' :
                         intensity > 0.4 ? 'rgba(251, 191, 36, 0.8)' :
                         intensity > 0 ? 'rgba(6, 182, 212, 0.6)' :
                         'rgba(75, 85, 99, 0.3)';

            return (
              <motion.div
                key={`${y}-${x}`}
                className="aspect-square rounded-sm"
                style={{ background: color }}
                animate={{
                  opacity: count > 0 ? [0.6, 1, 0.6] : 1
                }}
                transition={{
                  duration: 2,
                  repeat: count > 0 ? Infinity : 0,
                  delay: (y + x) * 0.1
                }}
              />
            );
          })
        )}
      </div>

      {/* User indicator */}
      <div className="relative w-full h-6 bg-gray-800/50 rounded border border-gray-700">
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-white border-2 border-cyan-400 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${userGridPos.x}%`,
            top: `${userGridPos.y}%`,
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)'
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] text-gray-400">
          Você
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between text-[8px] text-gray-500">
        <span>Baixa</span>
        <div className="flex gap-0.5">
          <div className="w-2 h-2 rounded-sm bg-cyan-600/60" />
          <div className="w-2 h-2 rounded-sm bg-yellow-600/80" />
          <div className="w-2 h-2 rounded-sm bg-red-600/80" />
        </div>
        <span>Alta</span>
      </div>
    </motion.div>
  );
}