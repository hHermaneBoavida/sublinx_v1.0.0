import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AttendeeCounter({ 
  currentAttendees, 
  maxCapacity, 
  previousCount,
  isRealtime = false,
  compact = false 
}) {
  const [showChange, setShowChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState(0);
  const prevCountRef = useRef(previousCount || currentAttendees);

  useEffect(() => {
    if (previousCount !== undefined && currentAttendees !== prevCountRef.current) {
      const diff = currentAttendees - prevCountRef.current;
      setChangeAmount(diff);
      setShowChange(true);

      const timer = setTimeout(() => {
        setShowChange(false);
        prevCountRef.current = currentAttendees;
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentAttendees, previousCount]);

  const percentage = maxCapacity > 0 ? (currentAttendees / maxCapacity) * 100 : 0;
  
  const getStatusColor = () => {
    if (percentage >= 100) return { bg: 'bg-red-600', text: 'text-red-300', glow: 'rgba(220, 38, 38, 0.6)' };
    if (percentage >= 90) return { bg: 'bg-orange-600', text: 'text-orange-300', glow: 'rgba(234, 88, 12, 0.6)' };
    if (percentage >= 70) return { bg: 'bg-yellow-600', text: 'text-yellow-300', glow: 'rgba(234, 179, 8, 0.6)' };
    return { bg: 'bg-green-600', text: 'text-green-300', glow: 'rgba(34, 197, 94, 0.6)' };
  };

  const status = getStatusColor();

  const getStatusLabel = () => {
    if (percentage >= 100) return 'LOTADO';
    if (percentage >= 90) return 'QUASE LOTADO';
    if (percentage >= 70) return 'ENCHENDO';
    return 'DISPONÍVEL';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Users className={`w-4 h-4 ${status.text}`} />
          <span className="text-sm font-semibold text-white">
            {currentAttendees}
            {maxCapacity > 0 && <span className="text-gray-400">/{maxCapacity}</span>}
          </span>
        </div>
        
        <AnimatePresence>
          {showChange && changeAmount !== 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 10 }}
              className={`flex items-center gap-0.5 ${changeAmount > 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              <TrendingUp className={`w-3 h-3 ${changeAmount < 0 ? 'rotate-180' : ''}`} />
              <span className="text-xs font-bold">
                {changeAmount > 0 ? '+' : ''}{changeAmount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {isRealtime && (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-green-500"
            animate={{
              boxShadow: [
                '0 0 5px rgba(34, 197, 94, 0.8)',
                '0 0 10px rgba(34, 197, 94, 1)',
                '0 0 5px rgba(34, 197, 94, 0.8)'
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header com contador */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className={`w-12 h-12 rounded-full ${status.bg} flex items-center justify-center relative overflow-hidden`}
            style={{
              boxShadow: `0 0 20px ${status.glow}`
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 70%)'
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Users className="w-6 h-6 text-white relative z-10" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {currentAttendees}
              </span>
              {maxCapacity > 0 && (
                <span className="text-lg text-gray-400">/ {maxCapacity}</span>
              )}
              
              <AnimatePresence>
                {showChange && changeAmount !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, x: 10 }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      changeAmount > 0 
                        ? 'bg-green-600/20 border border-green-500/50' 
                        : 'bg-red-600/20 border border-red-500/50'
                    }`}
                  >
                    <TrendingUp 
                      className={`w-4 h-4 ${changeAmount > 0 ? 'text-green-400' : 'text-red-400 rotate-180'}`} 
                    />
                    <span className={`text-sm font-bold ${changeAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {changeAmount > 0 ? '+' : ''}{changeAmount}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">participantes</span>
              {isRealtime && (
                <Badge className="bg-green-600/20 border-green-500/50 text-green-300 text-[9px] px-1.5 py-0">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"
                    animate={{
                      boxShadow: [
                        '0 0 5px rgba(34, 197, 94, 0.8)',
                        '0 0 10px rgba(34, 197, 94, 1)',
                        '0 0 5px rgba(34, 197, 94, 0.8)'
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Badge 
          className={`${
            percentage >= 100 ? 'bg-red-600 border-red-500' :
            percentage >= 90 ? 'bg-orange-600 border-orange-500' :
            percentage >= 70 ? 'bg-yellow-600 border-yellow-500' :
            'bg-green-600 border-green-500'
          } text-white font-bold px-3 py-1`}
        >
          {getStatusLabel()}
        </Badge>
      </div>

      {/* Barra de progresso */}
      <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 ${status.bg} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            boxShadow: `0 0 15px ${status.glow}`
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            }}
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white drop-shadow-lg">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Avisos de capacidade */}
      <AnimatePresence>
        {percentage >= 90 && percentage < 100 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-2 bg-orange-900/20 border border-orange-500/30 rounded-lg"
          >
            <Zap className="w-4 h-4 text-orange-400" />
            <p className="text-xs text-orange-300 font-semibold">
              Últimas vagas! Garanta seu lugar agora
            </p>
          </motion.div>
        )}

        {percentage >= 100 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-xs text-red-300 font-semibold">
              Evento lotado • Entre na lista de espera
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}