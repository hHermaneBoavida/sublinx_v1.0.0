import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  aspectRatio = '16/9',
  fallback = null,
  onLoad = () => {}
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        root: null,
        rootMargin: '200px', // Carregar antes de aparecer na tela
        threshold: 0.01
      }
    );

    const currentImg = imgRef.current;
    if (currentImg) {
      observer.observe(currentImg);
    }

    return () => {
      if (currentImg) {
        observer.unobserve(currentImg);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef}
      className={`relative w-full bg-gray-800 overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {/* Skeleton Placeholder */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-600" />
          </div>
        </div>
      )}

      {/* Actual Image - Only load when in view */}
      {isInView && !error && (
        <motion.img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* Error Fallback */}
      {error && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          {fallback || (
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Imagem não disponível</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}