import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * COMPONENTE DE IMAGEM OTIMIZADO
 * - Lazy loading nativo
 * - Placeholder durante carregamento
 * - Intersection Observer para performance
 * - Suporte a WebP
 */
export default function LazyImage({ 
  src, 
  alt = '', 
  className = '',
  placeholderClassName = '',
  aspectRatio = '1/1',
  priority = false,
  onLoad,
  fallback = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png'
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${placeholderClassName}`}
      style={{ aspectRatio }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}

      {(isInView || priority) && (
        <motion.img
          src={error ? fallback : src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.3s ease-in-out' }}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
        />
      )}
    </div>
  );
}

/**
 * AVATAR OTIMIZADO
 */
export function OptimizedAvatar({ 
  src, 
  alt = 'Avatar', 
  size = 'md',
  className = '',
  fallback
}) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`${sizes[size]} ${className} rounded-full object-cover`}
      placeholderClassName={`${sizes[size]} rounded-full`}
      aspectRatio="1/1"
      fallback={fallback}
    />
  );
}

/**
 * BACKGROUND OTIMIZADO COM BLUR
 */
export function OptimizedBackground({ 
  src, 
  alt = '', 
  className = '',
  overlay = true 
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <LazyImage
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${className}`}
        priority={false}
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      )}
    </div>
  );
}