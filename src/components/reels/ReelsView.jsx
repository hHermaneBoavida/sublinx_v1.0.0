import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import ReelCard from './ReelCard';
import { ChevronDown, AlertCircle, Sparkles } from 'lucide-react';

export default function ReelsView({ reels, events, initialEventId, onClose }) {
  const containerRef = useRef(null);
  const [sortedReels, setSortedReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedVideos, setLoadedVideos] = useState(new Set([0, 1]));
  const [dragProgress, setDragProgress] = useState(0); // NOVO: Progresso do drag

  useEffect(() => {
    const eventMap = new Map((events || []).map(e => [e.id, e]));

    // Feed global: todos os reels, com ou sem evento
    const reelsWithEventData = reels
      .filter(r => r?.id && r?.video_url && r.video_url.trim() !== '')
      .map(reel => ({
        ...reel,
        event: reel.event_id ? (eventMap.get(reel.event_id) || null) : null,
      }))
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    
    if (initialEventId) {
      // Colocar reels do evento selecionado no topo
      const eventReels = reelsWithEventData.filter(r => r.event_id === initialEventId);
      const otherReels = reelsWithEventData.filter(r => r.event_id !== initialEventId);
      setSortedReels([...eventReels, ...otherReels]);
      if (containerRef.current) containerRef.current.scrollTop = 0;
    } else {
      setSortedReels(reelsWithEventData);
    }
  }, [reels, events, initialEventId]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      
      setLoadedVideos(prev => {
        const newSet = new Set(prev);
        newSet.add(newIndex - 1);
        newSet.add(newIndex);
        newSet.add(newIndex + 1);
        return newSet;
      });
    }
  }, [currentIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!sortedReels || sortedReels.length === 0) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Cyberpunk */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10"
        >
          <AlertCircle className="w-16 h-16 text-gray-500 mb-4 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <p className="text-gray-400 text-center mb-2">Nenhum reel disponível ainda</p>
          <p className="text-gray-500 text-sm text-center mb-6">Seja o primeiro a compartilhar a vibe!</p>
        </motion.div>

        <motion.button 
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="relative z-10 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl font-semibold overflow-hidden"
          style={{
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(168, 85, 247, 0.4)'
          }}
        >
          {/* Reflexo superior animado */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)'
            }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="relative z-10">Voltar ao Mapa</span>
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      className="relative w-full h-full bg-black"
      onDrag={(event, info) => {
        // NOVO: Calcular progresso do drag
        const progress = Math.max(0, Math.min(1, info.offset.y / 200));
        setDragProgress(progress);
      }}
      onDragEnd={(event, info) => {
        setDragProgress(0);
        if (info.offset.y > 100 && Math.abs(info.offset.x) < 50) {
          onClose();
        }
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.2, bottom: 0 }}
    >
      {/* NOVO: Indicador Visual de Drag Progress */}
      <AnimatePresence>
        {dragProgress > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
            style={{
              scaleX: dragProgress,
              transformOrigin: 'left',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.8), 0 0 40px rgba(168, 85, 247, 0.6)'
            }}
          />
        )}
      </AnimatePresence>

      {/* NOVO: Overlay de Drag - Blur crescente */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-40 bg-black/50 backdrop-blur-sm"
        style={{
          opacity: dragProgress * 0.6,
        }}
      />

      <div 
        ref={containerRef}
        className="w-full h-full snap-y snap-mandatory overflow-y-scroll"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {sortedReels.map((reel, index) => (
          <div key={reel.id || index} className="w-full h-full snap-center snap-always relative">
            <ReelCard 
              reel={reel} 
              isActive={index === currentIndex}
              shouldLoad={loadedVideos.has(index)}
            />
          </div>
        ))}
      </div>
      
      {/* Botão Voltar - REDESENHADO com Microinteração */}
      <motion.button 
        onClick={onClose}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 group"
        whileHover={{ scale: 1.15, y: -3 }}
        whileTap={{ scale: 0.9 }}
        style={{
          filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.6))'
        }}
      >
        {/* Glow Pulsante ao Redor */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
            filter: 'blur(15px)',
            width: '80px',
            height: '80px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Ícone com Background Neon */}
        <div className="relative">
          <motion.div
            className="w-10 h-10 rounded-full flex items-center justify-center border-2 backdrop-blur-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(168, 85, 247, 0.2))',
              borderColor: 'rgba(6, 182, 212, 0.6)',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.6), inset 0 0 15px rgba(6, 182, 212, 0.2)'
            }}
            animate={{
              boxShadow: [
                '0 0 25px rgba(6, 182, 212, 0.6)',
                '0 0 35px rgba(6, 182, 212, 0.8)',
                '0 0 25px rgba(6, 182, 212, 0.6)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Reflexo interno */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)'
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <ChevronDown className="w-6 h-6 text-white relative z-10" />
          </motion.div>

          {/* Partículas flutuantes */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: i % 2 === 0 ? 'rgba(6, 182, 212, 0.8)' : 'rgba(168, 85, 247, 0.8)',
                boxShadow: `0 0 8px ${i % 2 === 0 ? 'rgba(6, 182, 212, 1)' : 'rgba(168, 85, 247, 1)'}`,
                left: `${20 + i * 25}%`,
                top: `${-10 + i * 15}%`
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <motion.span 
          className="text-xs font-semibold text-white/90 relative z-10"
          style={{
            textShadow: '0 0 10px rgba(6, 182, 212, 0.8), 0 2px 4px rgba(0,0,0,0.8)'
          }}
          animate={{
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Voltar
        </motion.span>

        {/* Seta para baixo animada */}
        <motion.div
          animate={{
            y: [0, 5, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChevronDown 
            className="w-4 h-4 text-cyan-400" 
            style={{
              filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.8))'
            }}
          />
        </motion.div>
      </motion.button>

      {/* NOVO: Indicador de Progresso Lateral Neon */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1">
        {sortedReels.map((_, index) => (
          <motion.div
            key={index}
            className={`w-1 rounded-full transition-all ${
              index === currentIndex ? 'h-8' : 'h-1.5'
            }`}
            style={{
              background: index === currentIndex
                ? 'linear-gradient(to bottom, rgba(6, 182, 212, 1), rgba(168, 85, 247, 1))'
                : 'rgba(156, 163, 175, 0.3)',
              boxShadow: index === currentIndex 
                ? '0 0 15px rgba(6, 182, 212, 0.8), 0 0 30px rgba(168, 85, 247, 0.6)'
                : 'none'
            }}
            animate={index === currentIndex ? {
              boxShadow: [
                '0 0 15px rgba(6, 182, 212, 0.8)',
                '0 0 25px rgba(6, 182, 212, 1)',
                '0 0 15px rgba(6, 182, 212, 0.8)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: index === currentIndex ? Infinity : 0 }}
          />
        ))}
      </div>
    </motion.div>
  );
}