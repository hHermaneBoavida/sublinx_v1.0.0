// ====================================
// HELPERS COMPARTILHADOS - OTIMIZADOS
// ====================================

import { VIBES, DEFAULT_AVATAR as DEFAULT_AVATAR_CONST, MUSIC_GENRES as MUSIC_GENRES_LIST } from "./constants";

// CACHE DE DISTÂNCIAS COM MAP
const distanceCache = new Map();
const CACHE_SIZE_LIMIT = 200;

/**
 * Validação centralizada de coordenadas geográficas.
 * Aceita números e strings numéricas (com espaços).
 * Rejeita null, undefined, NaN, Infinity, fora de range e (0,0).
 * A rejeição de (0,0) é específica do SUBLINX para evitar registros sem geolocalização útil.
 */
export function isValidCoord(lat, lng) {
  if (lat == null || lng == null) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    Number.isFinite(nLat) &&
    Number.isFinite(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180 &&
    !(nLat === 0 && nLng === 0)
  );
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!isValidCoord(lat1, lon1) || !isValidCoord(lat2, lon2)) return Infinity;
  
  const key = `${lat1.toFixed(4)},${lon1.toFixed(4)},${lat2.toFixed(4)},${lon2.toFixed(4)}`;
  
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
  
  if (distanceCache.size > CACHE_SIZE_LIMIT) {
    const firstKey = distanceCache.keys().next().value;
    distanceCache.delete(firstKey);
  }
  
  distanceCache.set(key, distance);
  return distance;
}

export function isValidEvent(event) {
  return Boolean(
    event?.id && 
    event?.title && 
    event?.location?.lat && 
    event?.location?.lng && 
    event?.date
  );
}

export function filterFutureEvents(events) {
  if (!Array.isArray(events)) return [];
  // Incluir eventos em andamento (até 24h após o início)
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return events.filter(e => isValidEvent(e) && new Date(e.date).getTime() > cutoff);
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
  const maxSize = 50 * 1024 * 1024;
  
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
const MEMO_CACHE_LIMIT = 100;

export function memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
  return function (...args) {
    const key = keyFn(...args);
    
    if (memoCache.has(key)) {
      return memoCache.get(key);
    }
    
    const result = fn(...args);
    
    if (memoCache.size > MEMO_CACHE_LIMIT) {
      const firstKey = memoCache.keys().next().value;
      memoCache.delete(firstKey);
    }
    
    memoCache.set(key, result);
    return result;
  };
}

// DEBOUNCED SEARCH
export function createDebouncedSearch(searchFn, delay = 300) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        const result = await searchFn(...args);
        resolve(result);
      }, delay);
    });
  };
}

// OPTIMIZED ARRAY OPERATIONS
export function uniqueById(array) {
  const seen = new Set();
  return array.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
}

// CLEAR CACHE HELPER
export function clearDistanceCache() {
  distanceCache.clear();
}

export function clearMemoCache() {
  memoCache.clear();
}