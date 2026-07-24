import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, MapPin, Calendar, Bookmark, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function ReelCardInner({ reel, isActive, shouldLoad, onSelectEvent }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // Determine preload strategy based on position
  const preloadMode = isActive ? 'auto' : 'metadata';

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    const handleLoadedData = () => setVideoLoading(false);
    const handleError = () => {
      setVideoError(true);
      setVideoLoading(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [shouldLoad]);

  // Play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    if (isActive) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, shouldLoad]);

  // Progress tracking - throttled via rAF
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    let rafId;
    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
      rafId = requestAnimationFrame(updateProgress);
    };
    rafId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(rafId);
  }, [isActive]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-40">
        <div
          className="h-full bg-white transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Video or Placeholder */}
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url || undefined}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
          preload={preloadMode}
          onClick={togglePlay}
          style={{ opacity: videoLoading && !reel.thumbnail_url ? 0 : 1, transition: 'opacity 0.2s' }}
        />
      ) : (
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: reel.thumbnail_url ? `url(${reel.thumbnail_url})` : 'none' }}
        />
      )}

      {/* Loading indicator - minimal */}
      {shouldLoad && videoLoading && !videoError && !reel.thumbnail_url && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {shouldLoad && videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <p className="text-white/60 text-sm">Vídeo indisponível</p>
            <p className="text-white/40 text-xs mt-1">Deslize para o próximo</p>
          </div>
        </div>
      )}

      {/* Play indicator when paused */}
      {shouldLoad && !isPlaying && !videoLoading && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Play className="w-14 h-14 text-white/70 fill-white/70 drop-shadow-lg" />
        </div>
      )}

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }} />

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />

      {/* Event Info - Header (tap to view event details) */}
      {showInfo && reel.event && (
        <div className="absolute top-4 left-4 right-16 z-30">
          <div
            className="bg-black/40 backdrop-blur-md rounded-xl px-3 py-2 cursor-pointer active:scale-95 transition-transform"
            onClick={() => onSelectEvent?.(reel.event)}
          >
            <p className="text-white text-sm font-semibold truncate">{reel.event.title}</p>
            {reel.event.location && (
              <div className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{reel.event.location.venue_name || reel.event.location.city || ''}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right-side action buttons */}
      <div className="absolute right-3 z-30 flex flex-col gap-4" style={{ bottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
        <button onClick={() => setIsLiked(!isLiked)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <Heart className={`w-7 h-7 drop-shadow-lg ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          <span className="text-white text-xs font-semibold drop-shadow-lg">
            {(reel.likes_count || 0) + (isLiked ? 1 : 0)}
          </span>
        </button>

        <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
          <span className="text-white text-xs font-semibold drop-shadow-lg">{reel.comments_count || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
        </button>

        <button onClick={() => setIsSaved(!isSaved)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <Bookmark className={`w-7 h-7 drop-shadow-lg ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
        </button>

        <button onClick={toggleMute} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          {isMuted ? <VolumeX className="w-7 h-7 text-white drop-shadow-lg" /> : <Volume2 className="w-7 h-7 text-white drop-shadow-lg" />}
        </button>
      </div>

      {/* Bottom info */}
      {showInfo && (
        <div className="absolute left-4 right-16 z-20" style={{ bottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
          {reel.event && (
            <h3 className="text-white font-bold text-base mb-1 truncate drop-shadow-lg">{reel.event.title}</h3>
          )}
          {reel.description && (
            <p className="text-white/90 text-sm line-clamp-2 drop-shadow-lg">{reel.description}</p>
          )}
          {reel.event?.genre && (
            <div className="flex gap-2 mt-2">
              <span className="bg-white/15 backdrop-blur-md text-white text-xs px-2 py-0.5 rounded-full">
                {reel.event.genre}
              </span>
              {reel.event?.type && (
                <span className="bg-white/15 backdrop-blur-md text-white text-xs px-2 py-0.5 rounded-full">
                  {reel.event.type}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(ReelCardInner);