import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReelCard from './ReelCard';
import { ChevronDown, AlertCircle } from 'lucide-react';

/**
 * Preloads video URLs into browser cache via <link rel="preload">.
 * Removes links when URLs change or component unmounts.
 */
function useVideoPreload(reels, currentIndex) {
  useEffect(() => {
    // Skip preload on slow connections or data saver
    if (navigator.connection && (navigator.connection.effectiveType === '2g' || navigator.connection.saveData)) {
      return;
    }

    // Preload current + next 3 videos into browser cache
    const toPreload = [];
    for (let i = currentIndex; i <= currentIndex + 3 && i < reels.length; i++) {
      if (reels[i]?.video_url) toPreload.push(reels[i].video_url);
    }

    const links = toPreload.map(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = url;
      document.head.appendChild(link);
      return link;
    });

    return () => {
      links.forEach(link => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, [reels, currentIndex]);
}

export default function ReelsView({ reels, events, initialEventId, onClose }) {
  const containerRef = useRef(null);
  const [sortedReels, setSortedReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Preload current + 2 ahead + 1 behind for smooth scrolling
  const [loadedVideos, setLoadedVideos] = useState(new Set([0, 1, 2]));

  useEffect(() => {
    const eventMap = new Map((events || []).map(e => [e.id, e]));

    const reelsWithEventData = reels
      .filter(r => r?.id && r?.video_url && r.video_url.trim() !== '')
      .map(reel => ({
        ...reel,
        event: reel.event_id ? (eventMap.get(reel.event_id) || null) : null,
      }))
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

    if (initialEventId) {
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
      // Preload current ± 2 for smooth preloading like TikTok
      setLoadedVideos(prev => {
        const newSet = new Set(prev);
        for (let i = newIndex - 1; i <= newIndex + 2; i++) {
          if (i >= 0) newSet.add(i);
        }
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

  // Memoize reel items to prevent unnecessary re-renders
  const reelItems = useMemo(() => 
    sortedReels.map((reel, index) => (
      <div key={reel.id || index} className="w-full h-full snap-center snap-always relative">
        <ReelCard
          reel={reel}
          isActive={index === currentIndex}
          shouldLoad={loadedVideos.has(index)}
        />
      </div>
    )),
    [sortedReels, currentIndex, loadedVideos]
  );

  // Preload upcoming video URLs into browser cache
  useVideoPreload(sortedReels, currentIndex);

  if (!sortedReels || sortedReels.length === 0) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-400 text-center mb-1">Nenhum reel disponível</p>
        <p className="text-gray-500 text-sm text-center mb-6">Seja o primeiro a compartilhar!</p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-medium text-sm"
        >
          Voltar ao Mapa
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <div
        ref={containerRef}
        className="w-full h-full snap-y snap-mandatory overflow-y-scroll"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {reelItems}
      </div>

      {/* Close button - minimal */}
      <button
        onClick={onClose}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1"
      >
        <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform">
          <ChevronDown className="w-5 h-5 text-white" />
        </div>
      </button>

      {/* Side progress indicator - minimal */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1">
        {sortedReels.map((_, index) => (
          <div
            key={index}
            className={`w-0.5 rounded-full transition-all ${index === currentIndex ? 'h-6 bg-white' : 'h-1.5 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
}