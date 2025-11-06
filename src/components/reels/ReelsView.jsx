import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from "framer-motion";
import ReelCard from './ReelCard';
import { ChevronDown, AlertCircle } from 'lucide-react';

export default function ReelsView({ reels, events, initialEventId, onClose }) {
  const containerRef = useRef(null);
  const [sortedReels, setSortedReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedVideos, setLoadedVideos] = useState(new Set([0, 1]));

  useEffect(() => {
    const eventMap = new Map(events.map(e => [e.id, e]));

    const reelsWithEventData = reels.map(reel => ({
      ...reel,
      event: eventMap.get(reel.event_id),
    })).filter(reel => reel.event);
    
    if (initialEventId) {
      const initialReelIndex = reelsWithEventData.findIndex(r => r.event_id === initialEventId);
      if (initialReelIndex > -1) {
        const initialReel = reelsWithEventData.splice(initialReelIndex, 1)[0];
        setSortedReels([initialReel, ...reelsWithEventData]);
        
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      } else {
        setSortedReels(reelsWithEventData);
      }
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
      
      // Precarregar vídeos próximos
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
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
        <p className="text-gray-400 text-center mb-2">Nenhum reel disponível ainda</p>
        <p className="text-gray-500 text-sm text-center mb-6">Seja o primeiro a compartilhar a vibe!</p>
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-semibold"
        >
          Voltar ao Mapa
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="relative w-full h-full bg-black"
      onDragEnd={(event, info) => {
        if (info.offset.y > 50 && Math.abs(info.offset.x) < 50) {
          onClose();
        }
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.1 }}
    >
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
      
      <motion.button 
        onClick={onClose}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronDown className="w-8 h-8" />
        <span className="text-xs font-semibold">Voltar</span>
      </motion.button>
    </motion.div>
  );
}