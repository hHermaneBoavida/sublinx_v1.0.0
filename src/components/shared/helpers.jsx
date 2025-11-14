// ====================================
// HELPERS COMPARTILHADOS - OTIMIZADOS
// ====================================

import { VIBES, DEFAULT_AVATAR as DEFAULT_AVATAR_CONST, MUSIC_GENRES as MUSIC_GENRES_LIST } from "./constants";

// OTIMIZAÇÃO: Cache de cálculos com WeakMap para melhor GC
const distanceCache = new Map();
const CACHE_SIZE_LIMIT = 100;

export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const key = `${lat1.toFixed(3)},${lon1.toFixed(3)},${lat2.toFixed(3)},${lon2.toFixed(3)}`;
  
  if (distanceCache.has(key)) {
    return distanceCache.get(key);
  }
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Limitar cache
  if (distanceCache.size > CACHE_SIZE_LIMIT) {
    const firstKey = distanceCache.keys().next().value;
    distanceCache.delete(firstKey);
  }
  
  distanceCache.set(key, distance);
  return distance;
}

export function isValidEvent(event) {
  return event?.id && event?.title && event?.location?.lat && event?.location?.lng && event?.date;
}

export function filterFutureEvents(events) {
  if (!Array.isArray(events)) return [];
  const now = Date.now();
  return events.filter(e => isValidEvent(e) && new Date(e.date).getTime() > now);
}

export function filterPastEvents(events) {
  if (!Array.isArray(events)) return [];
  const now = Date.now();
  return events.filter(e => isValidEvent(e) && new Date(e.date).getTime() <= now);
}

export function sortEventsByDistance(events, userLocation) {
  if (!userLocation || !events?.length) {
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  return events
    .map(event => ({
      ...event,
      _distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        event.location.lat,
        event.location.lng
      )
    }))
    .sort((a, b) => a._distance - b._distance);
}

export function matchesVibe(event, vibe) {
  if (!vibe || vibe === 'all') return true;
  
  const vibeConfig = VIBES[vibe];
  if (!vibeConfig) return true;
  
  if (vibeConfig.genres?.includes(event.genre)) return true;
  
  if (event.vibe_tags?.some(tag => tag.toLowerCase() === vibe.toLowerCase())) {
    return true;
  }
  
  return false;
}

export function validateImage(file) {
  if (!file) return { valid: false, error: 'Nenhum arquivo' };
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024;
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato inválido' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Imagem muito grande (máx 5MB)' };
  }
  
  return { valid: true, error: null };
}

export function validateVideo(file) {
  if (!file) return { valid: false, error: 'Nenhum arquivo' };
  
  const allowedTypes = ['video/mp4', 'video/quicktime'];
  const maxSize = 50 * 1024 * 1024; // Reduzido para 50MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato inválido' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Vídeo muito grande (máx 50MB)' };
  }
  
  return { valid: true, error: null };
}

export function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// CACHE CONFIG ATUALIZADO
export { CACHE_CONFIG } from './optimizations';

export const DEFAULT_AVATAR = DEFAULT_AVATAR_CONST;
export const MUSIC_GENRES = MUSIC_GENRES_LIST;

// BATCH QUERY HELPER
export function batchQueries(queries, delay = 50) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const results = await Promise.allSettled(queries);
      resolve(results.map(r => r.status === 'fulfilled' ? r.value : []));
    }, delay);
  });
}

// MEMOIZE HELPER
const memoCache = new Map();
export function memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
  return function (...args) {
    const key = keyFn(...args);
    
    if (memoCache.has(key)) {
      return memoCache.get(key);
    }
    
    const result = fn(...args);
    
    if (memoCache.size > 50) {
      const firstKey = memoCache.keys().next().value;
      memoCache.delete(firstKey);
    }
    
    memoCache.set(key, result);
    return result;
  };
}