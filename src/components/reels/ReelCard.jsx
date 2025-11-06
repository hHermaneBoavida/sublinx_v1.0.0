
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, MapPin, Calendar, Users, MoreVertical, Bookmark } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import confetti from 'canvas-confetti';

export default function ReelCard({ reel, isActive, shouldLoad }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const videoRef = useRef(null);

  // Auto play/pause baseado em visibilidade
  useEffect(() => {
    if (!videoRef.current || !shouldLoad) return;

    if (isActive) {
      videoRef.current.play().catch(err => console.log("Autoplay prevented:", err));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, shouldLoad]);

  // Progresso do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    // Animação de coração
    if (!isLiked) {
      confetti({
        particleCount: 10,
        spread: 40,
        origin: { x: 0.9, y: 0.5 },
        colors: ['#ff0000', '#ff69b4']
      });
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Progress Bar - Fino e Elegante */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-800/50 z-40">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Vídeo */}
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={reel.video_url}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
          onClick={() => setShowInfo(!showInfo)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
        </div>
      )}

      {/* Gradiente Superior */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10" />
      
      {/* Gradiente Inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />

      {/* Overlay de Play/Pause - Centro */}
      <AnimatePresence>
        {!isPlaying && shouldLoad && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="pointer-events-auto"
            >
              <Button
                size="icon"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 border-2 border-white/40 transition-all"
              >
                <Play className="w-8 h-8 ml-1" fill="white" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Info do Evento */}
      <AnimatePresence>
        {showInfo && reel.event && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-20 z-30"
          >
            <div className="bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <Badge className="bg-gradient-to-r from-cyan-600 to-purple-600 border-0 px-2 py-0.5 text-xs mb-2">
                🎪 {reel.event.title}
              </Badge>
              <div className="flex items-center gap-2 text-xs text-gray-200">
                {reel.event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span className="truncate max-w-[120px]">{reel.event.location.venue_name}</span>
                  </div>
                )}
                {reel.event.date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    <span>{format(new Date(reel.event.date), "dd MMM", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles Laterais - Direita */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-4">
        {/* Like Button */}
        <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleLike}
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
          >
            <Heart 
              className={`w-6 h-6 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`} 
            />
          </Button>
          <span className="text-white text-xs font-bold mt-1 drop-shadow-lg">
            {(reel.likes_count || 0) + (isLiked ? 1 : 0)}
          </span>
        </motion.div>

        {/* Comment Button */}
        <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </Button>
          <span className="text-white text-xs font-bold mt-1 drop-shadow-lg">
            {reel.comments_count || 0}
          </span>
        </motion.div>

        {/* Share Button */}
        <motion.div whileTap={{ scale: 0.85 }}>
          <Button
            size="icon"
            variant="ghost"
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
          >
            <Share2 className="w-6 h-6 text-white" />
          </Button>
        </motion.div>

        {/* Save Button */}
        <motion.div whileTap={{ scale: 0.85 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
          >
            <Bookmark 
              className={`w-6 h-6 transition-all ${isSaved ? 'fill-yellow-500 text-yellow-500' : 'text-white'}`} 
            />
          </Button>
        </motion.div>

        {/* Mute Button */}
        <motion.div whileTap={{ scale: 0.85 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </Button>
        </motion.div>
      </div>

      {/* Info do Reel - Parte Inferior */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-20 z-20"
          >
            <div className="space-y-2">
              {/* Título */}
              {reel.event && (
                <h3 className="text-white font-bold text-lg drop-shadow-lg line-clamp-1">
                  {reel.event.title}
                </h3>
              )}
              
              {/* Descrição */}
              {reel.description && (
                <p className="text-gray-200 text-sm drop-shadow line-clamp-2">
                  {reel.description}
                </p>
              )}
              
              {/* Tags */}
              {reel.event?.genre && (
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-black/40 backdrop-blur-sm border-cyan-500/30 text-cyan-300 text-xs">
                    🎵 {reel.event.genre}
                  </Badge>
                  {reel.event?.type && (
                    <Badge variant="outline" className="bg-black/40 backdrop-blur-sm border-purple-500/30 text-purple-300 text-xs">
                      🎭 {reel.event.type}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
