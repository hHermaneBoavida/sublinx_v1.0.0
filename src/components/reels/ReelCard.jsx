import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, MapPin, Calendar, Users, MoreVertical, Bookmark, Sparkles, AlertCircle } from 'lucide-react';
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
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    const handleLoadStart = () => setVideoLoading(true);
    const handleCanPlay = () => setVideoLoading(false);
    const handleError = () => {
      setVideoError(true);
      setVideoLoading(false);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [shouldLoad]);

  useEffect(() => {
    if (!videoRef.current || !shouldLoad || videoLoading) return;

    if (isActive) {
      videoRef.current.play().catch(err => console.log("Autoplay prevented:", err));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, shouldLoad, videoLoading]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (!video) return; // Added null check for video
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    };

    video.addEventListener('timeupdate', updateProgress);
    
    return () => {
      if (video) { // Added null check for video before removing listener
        video.removeEventListener('timeupdate', updateProgress);
      }
    };
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
    
    if (!isLiked) {
      // NOVO: Confetti neon aprimorado
      confetti({
        particleCount: 20,
        spread: 60,
        origin: { x: 0.9, y: 0.5 },
        colors: ['#06B6D4', '#A855F7', '#EC4899', '#F59E0B'],
        shapes: ['circle', 'square'],
        gravity: 0.8,
        scalar: 1.2,
        drift: 0.2
      });

      // NOVO: Segundo confetti com delay
      setTimeout(() => {
        confetti({
          particleCount: 15,
          spread: 40,
          origin: { x: 0.9, y: 0.5 },
          colors: ['#ffffff', '#06B6D4'],
          shapes: ['star'],
          gravity: 1.2,
          scalar: 0.8
        });
      }, 100);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Progress Bar - Neon com Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-900/80 z-40">
        <motion.div 
          className="h-full relative"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(to right, rgba(6, 182, 212, 1), rgba(168, 85, 247, 1), rgba(236, 72, 153, 1))',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.8), 0 0 30px rgba(168, 85, 247, 0.6)'
          }}
          transition={{ duration: 0.1 }}
        >
          {/* Brilho na ponta */}
          <motion.div
            className="absolute right-0 top-0 w-4 h-full"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6))',
            }}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* Vídeo */}
      {shouldLoad ? (
        <>
          <video
            ref={videoRef}
            src={reel.video_url}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
            onClick={() => setShowInfo(!showInfo)}
            style={{ opacity: videoLoading ? 0 : 1, transition: 'opacity 0.3s' }}
          />
          
          {/* Skeleton Loader */}
          <AnimatePresence>
            {videoLoading && !videoError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900/20"
              >
                {/* Skeleton Content */}
                <div className="absolute inset-0 flex flex-col justify-between p-4">
                  {/* Top Skeleton - Event Info */}
                  <div className="space-y-3 animate-pulse">
                    <div className="w-32 h-6 bg-gray-800/60 rounded-full" />
                    <div className="flex gap-2">
                      <div className="w-24 h-4 bg-gray-800/40 rounded" />
                      <div className="w-20 h-4 bg-gray-800/40 rounded" />
                    </div>
                  </div>

                  {/* Center Spinner */}
                  <div className="flex items-center justify-center">
                    <motion.div 
                      className="relative"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-16 h-16 border-3 border-cyan-500 border-t-transparent rounded-full" />
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          boxShadow: '0 0 25px rgba(6, 182, 212, 0.8)'
                        }}
                        animate={{
                          opacity: [0.5, 1, 0.5],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </motion.div>
                    <motion.p 
                      className="absolute mt-32 text-cyan-400 text-sm font-semibold"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Carregando vídeo...
                    </motion.p>
                  </div>

                  {/* Bottom Skeleton - Description */}
                  <div className="space-y-2 animate-pulse">
                    <div className="w-3/4 h-5 bg-gray-800/60 rounded" />
                    <div className="w-full h-4 bg-gray-800/40 rounded" />
                    <div className="w-2/3 h-4 bg-gray-800/40 rounded" />
                    <div className="flex gap-2 mt-2">
                      <div className="w-20 h-6 bg-gray-800/40 rounded-full" />
                      <div className="w-16 h-6 bg-gray-800/40 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Loading Progress Shimmer */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.1), transparent)',
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
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {videoError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-gray-900 flex items-center justify-center"
              >
                <div className="text-center space-y-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                  </motion.div>
                  <p className="text-red-400 font-semibold">Erro ao carregar vídeo</p>
                  <p className="text-gray-400 text-sm">Deslize para o próximo</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-purple-900/20">
          <motion.div 
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full" />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)'
              }}
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </div>
      )}

      {/* Gradiente Superior - Neon */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
        }}
      />
      
      {/* Gradiente Inferior - Neon Cyberpunk */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(6, 182, 212, 0.08) 40%, transparent 100%)',
          boxShadow: 'inset 0 -50px 80px rgba(6, 182, 212, 0.12)'
        }}
      />

      {/* Overlay de Play/Pause - Centro */}
      <AnimatePresence>
        {!isPlaying && shouldLoad && !videoLoading && !videoError && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className="pointer-events-auto relative"
            >
              {/* Glow ao Redor */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  width: '120px',
                  height: '120px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <Button
                size="icon"
                onClick={togglePlay}
                className="w-20 h-20 rounded-full border-4 border-white/60 transition-all relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(168, 85, 247, 0.3))',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 0 40px rgba(255, 255, 255, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Reflexo dinâmico */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), transparent 65%)'
                  }}
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Play className="w-10 h-10 ml-1.5 text-white relative z-10" fill="white" />
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
            <div 
              className="backdrop-blur-xl rounded-2xl p-4 border-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(17,24,39,0.6))',
                borderColor: 'rgba(6, 182, 212, 0.4)',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)'
              }}
            >
              {/* Brilho superior */}
              <div 
                className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)'
                }}
              />

              <Badge className="bg-gradient-to-r from-cyan-600 to-purple-600 border-0 px-3 py-1 text-xs mb-3 shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                {reel.event.title}
              </Badge>
              
              <div className="flex items-center gap-3 text-xs text-gray-200">
                {reel.event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.8))' }} />
                    <span className="truncate max-w-[130px]">{reel.event.location.venue_name}</span>
                  </div>
                )}
                {reel.event.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" style={{ filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.8))' }} />
                    <span>{format(new Date(reel.event.date), "dd MMM", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles Laterais - Direita - REDESENHADOS */}
      <div className="absolute right-3 bottom-28 z-30 flex flex-col gap-3">
        {/* Like Button - Neon */}
        <motion.div 
          whileTap={{ scale: 0.8 }} 
          className="flex flex-col items-center"
        >
          <motion.div className="relative">
            {/* Glow ao redor do botão */}
            <AnimatePresence>
              {isLiked && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.6 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, transparent 70%)',
                    filter: 'blur(15px)',
                  }}
                />
              )}
            </AnimatePresence>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleLike}
              className="w-14 h-14 rounded-full backdrop-blur-xl border-2 relative overflow-hidden"
              style={{
                background: isLiked 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(236, 72, 153, 0.2))'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(17,24,39,0.4))',
                borderColor: isLiked ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.15)',
                boxShadow: isLiked 
                  ? '0 0 25px rgba(239, 68, 68, 0.8), inset 0 0 15px rgba(239, 68, 68, 0.3)'
                  : '0 0 15px rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Reflexo interno */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)'
                }}
                animate={{
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <Heart 
                className={`w-7 h-7 transition-all relative z-10 ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`} 
                style={{
                  filter: isLiked ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 1))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                }}
              />
            </Button>
          </motion.div>
          
          <motion.span 
            className="text-white text-sm font-bold mt-1.5"
            style={{
              textShadow: isLiked 
                ? '0 0 10px rgba(239, 68, 68, 0.8)'
                : '0 2px 4px rgba(0,0,0,0.8)'
            }}
            animate={isLiked ? {
              scale: [1, 1.2, 1]
            } : {}}
            transition={{ duration: 0.3 }}
          >
            {(reel.likes_count || 0) + (isLiked ? 1 : 0)}
          </motion.span>
        </motion.div>

        {/* Comment Button */}
        <motion.div whileTap={{ scale: 0.8 }} className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className="w-14 h-14 rounded-full backdrop-blur-xl border-2 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(17,24,39,0.4))',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 60%)'
              }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <MessageCircle className="w-7 h-7 text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
          </Button>
          <span className="text-white text-sm font-bold mt-1.5" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {reel.comments_count || 0}
          </span>
        </motion.div>

        {/* Share Button */}
        <motion.div whileTap={{ scale: 0.8 }}>
          <Button
            size="icon"
            variant="ghost"
            className="w-14 h-14 rounded-full backdrop-blur-xl border-2 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(17,24,39,0.4))',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)'
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 60%)'
              }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Share2 className="w-7 h-7 text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
          </Button>
        </motion.div>

        {/* Save Button */}
        <motion.div whileTap={{ scale: 0.8 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            className="w-14 h-14 rounded-full backdrop-blur-xl border-2 relative overflow-hidden"
            style={{
              background: isSaved
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2))'
                : 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(17,24,39,0.4))',
              borderColor: isSaved ? 'rgba(251, 191, 36, 0.6)' : 'rgba(255, 255, 255, 0.15)',
              boxShadow: isSaved 
                ? '0 0 25px rgba(251, 191, 36, 0.8), inset 0 0 15px rgba(251, 191, 36, 0.3)'
                : '0 0 15px rgba(255, 255, 255, 0.1)'
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)'
              }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Bookmark 
              className={`w-7 h-7 transition-all relative z-10 ${isSaved ? 'fill-yellow-500 text-yellow-500' : 'text-white'}`} 
              style={{
                filter: isSaved 
                  ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 1))'
                  : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}
            />
          </Button>
        </motion.div>

        {/* Mute Button */}
        <motion.div whileTap={{ scale: 0.8 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className="w-14 h-14 rounded-full backdrop-blur-xl border-2 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(17,24,39,0.4))',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)'
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 60%)'
              }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {isMuted ? (
              <VolumeX className="w-7 h-7 text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
            ) : (
              <Volume2 className="w-7 h-7 text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
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
              {/* Título com Glow */}
              {reel.event && (
                <motion.h3 
                  className="text-white font-bold text-xl line-clamp-1"
                  style={{
                    textShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 2px 8px rgba(0,0,0,0.9)'
                  }}
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(6, 182, 212, 0.6)',
                      '0 0 30px rgba(6, 182, 212, 0.8)',
                      '0 0 20px rgba(6, 182, 212, 0.6)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {reel.event.title}
                </motion.h3>
              )}
              
              {/* Descrição */}
              {reel.description && (
                <p 
                  className="text-gray-200 text-sm line-clamp-2"
                  style={{
                    textShadow: '0 2px 6px rgba(0,0,0,0.8)'
                  }}
                >
                  {reel.description}
                </p>
              )}
              
              {/* Tags com Neon */}
              {reel.event?.genre && (
                <div className="flex gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className="backdrop-blur-xl border-2 text-xs relative overflow-hidden"
                    style={{
                      background: 'rgba(6, 182, 212, 0.15)',
                      borderColor: 'rgba(6, 182, 212, 0.5)',
                      color: '#06B6D4',
                      boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
                      textShadow: '0 0 8px rgba(6, 182, 212, 0.8)'
                    }}
                  >
                    <div 
                      className="absolute top-0 left-0 right-0 h-1/2 rounded-t"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)'
                      }}
                    />
                    🎵 {reel.event.genre}
                  </Badge>
                  
                  {reel.event?.type && (
                    <Badge 
                      variant="outline" 
                      className="backdrop-blur-xl border-2 text-xs relative overflow-hidden"
                      style={{
                        background: 'rgba(168, 85, 247, 0.15)',
                        borderColor: 'rgba(168, 85, 247, 0.5)',
                        color: '#A855F7',
                        boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
                        textShadow: '0 0 8px rgba(168, 85, 247, 0.8)'
                      }}
                    >
                      <div 
                        className="absolute top-0 left-0 right-0 h-1/2 rounded-t"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)'
                        }}
                      />
                      🎭 {reel.event.type}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOVO: Partículas Flutuantes Ambientais */}
      <div className="absolute inset-0 pointer-events-none z-5 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 3 === 0 ? 'rgba(6, 182, 212, 0.6)' : i % 3 === 1 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(236, 72, 153, 0.6)',
              boxShadow: `0 0 8px ${i % 3 === 0 ? 'rgba(6, 182, 212, 1)' : i % 3 === 1 ? 'rgba(168, 85, 247, 1)' : 'rgba(236, 72, 153, 1)'}`,
              left: `${10 + (i * 15)}%`,
              filter: 'blur(1px)',
            }}
            animate={{
              y: ['100vh', '-10vh'],
              x: [0, Math.sin(i) * 30, 0],
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}