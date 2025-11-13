// ====================================
// HELPERS COMPARTILHADOS - OTIMIZADOS
// ====================================

import { VIBES, DEFAULT_AVATAR as DEFAULT_AVATAR_CONST, MUSIC_GENRES as MUSIC_GENRES_LIST } from "./constants";

// OTIMIZAÇÃO: Cache de cálculos
const distanceCache = new Map();

export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  // Cache key
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
  if (distanceCache.size > 100) {
    const firstKey = distanceCache.keys().next().value;
    distanceCache.delete(firstKey);
  }
  
  distanceCache.set(key, distance);
  return distance;
}

export function isValidEvent(event) {
  return event && 
         event.id && 
         event.title && 
         event.location && 
         event.location.lat && 
         event.location.lng &&
         event.date;
}

export function filterFutureEvents(events) {
  if (!Array.isArray(events)) return [];
  const now = new Date();
  return events.filter(e => isValidEvent(e) && new Date(e.date) > now);
}

export function filterPastEvents(events) {
  if (!Array.isArray(events)) return [];
  const now = new Date();
  return events.filter(e => isValidEvent(e) && new Date(e.date) <= now);
}

export function sortEventsByDistance(events, userLocation) {
  if (!userLocation || !events || events.length === 0) {
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
  
  if (vibeConfig.genres && event.genre) {
    if (vibeConfig.genres.includes(event.genre)) return true;
  }
  
  if (event.vibe_tags && Array.isArray(event.vibe_tags)) {
    if (event.vibe_tags.some(tag => tag.toLowerCase() === vibe.toLowerCase())) {
      return true;
    }
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
  const maxSize = 100 * 1024 * 1024;
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato inválido' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Vídeo muito grande (máx 100MB)' };
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

// CACHE CONFIG
export const CACHE_CONFIG = {
  SHORT: { staleTime: 30000, cacheTime: 60000 },
  MEDIUM: { staleTime: 60000, cacheTime: 300000 },
  LONG: { staleTime: 300000, cacheTime: 600000 },
  STATIC: { staleTime: Infinity, cacheTime: Infinity }
};

export const DEFAULT_AVATAR = DEFAULT_AVATAR_CONST;
export const MUSIC_GENRES = MUSIC_GENRES_LIST;