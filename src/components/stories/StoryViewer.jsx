import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ProgressBar = ({ duration, onComplete, isPaused }) => {
  return (
    <div className="h-1 bg-white/30 rounded-full overflow-hidden">
      {!isPaused && (
         <motion.div
            className="h-full bg-white"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration, ease: 'linear' }}
            onAnimationComplete={onComplete}
        />
      )}
      {isPaused && (
        <div className="h-full bg-white" style={{ animationPlayState: 'paused' }} />
      )}
    </div>
  );
};

export default function StoryViewer({ storyGroup, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentStory = storyGroup.stories[currentIndex];

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev < storyGroup.stories.length - 1 ? prev + 1 : prev));
    if (currentIndex >= storyGroup.stories.length - 1) {
      onClose();
    }
  }, [currentIndex, storyGroup.stories.length, onClose]);

  const goToPrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full h-full max-w-sm max-h-screen bg-black rounded-lg overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10">
          <div className="flex items-center gap-x-2 mb-2">
            {storyGroup.stories.map((_, index) => (
              <div key={index} className="flex-1">
                {index === currentIndex ? (
                  <ProgressBar duration={currentStory.duration} onComplete={goToNext} isPaused={isPaused} />
                ) : (
                  <div className={`h-1 rounded-full ${index < currentIndex ? 'bg-white' : 'bg-white/30'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <img src={storyGroup.userAvatarUrl} alt={storyGroup.userName} className="w-8 h-8 rounded-full object-cover" />
                <p className="text-white font-semibold text-sm">{storyGroup.userName}</p>
             </div>
             <button onClick={onClose} className="text-white/80 hover:text-white">
                <X size={24} />
             </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence initial={false}>
            <motion.div
                key={currentIndex}
                className="absolute inset-0"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: '0%', opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
             {currentStory.media_type === 'video' ? (
                <video
                    src={currentStory.media_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted={isPaused}
                    onEnded={goToNext}
                 />
             ) : (
                <img src={currentStory.media_url} alt="Story" className="w-full h-full object-cover" />
             )}
            </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={goToPrev} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={goToNext} />
      </div>
    </motion.div>
  );
}