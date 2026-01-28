import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LoadingSpinner unificado para todo o app
 * Usa cores do tema SUBLINX
 */
export default function LoadingSpinner({ 
  size = 'md', 
  fullScreen = false,
  message = null,
  className = ''
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const spinner = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('flex flex-col items-center justify-center gap-3', className)}
    >
      <Loader2 
        className={cn(
          sizes[size],
          'animate-spin text-cyan-400',
          'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
        )}
      />
      {message && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-400 animate-pulse"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Skeleton loading para cards
 */
export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div 
          key={i} 
          className="bg-gray-900/50 rounded-xl border border-gray-700 p-4 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-800 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
          </div>
          <div className="h-32 bg-gray-800 rounded-lg mb-3" />
          <div className="h-3 bg-gray-800 rounded w-full mb-2" />
          <div className="h-3 bg-gray-800 rounded w-2/3" />
        </div>
      ))}
    </>
  );
}

/**
 * Skeleton para lista
 */
export function SkeletonList({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-800 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}