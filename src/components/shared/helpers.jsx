// ====================================
// HELPERS COMPARTILHADOS DO SUBLINX
// Funções utilitárias centralizadas
// ====================================

import { VIBES, UPLOAD_LIMITS, DEFAULT_AVATAR as DEFAULT_AVATAR_CONST, MUSIC_GENRES as MUSIC_GENRES_LIST } from "./constants";

/**
 * Calcula distância entre dois pontos usando Haversine
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distância em km
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Valida se evento tem propriedades obrigatórias
 */
export function isValidEvent(event) {
  return event && 
         event.id && 
         event.title && 
         event.location && 
         event.location.lat && 
         event.location.lng &&
         event.date;
}

/**
 * Filtra apenas eventos futuros
 */
export function filterFutureEvents(events) {
  if (!Array.isArray(events)) return [];
  const now = new Date();
  return events.filter(e => isValidEvent(e) && new Date(e.date) > now);
}

/**
 * Filtra apenas eventos passados
 */
export function filterPastEvents(events) {
  if (!Array.isArray(events)) return [];
  const now = new Date();
  return events.filter(e => isValidEvent(e) && new Date(e.date) <= now);
}

/**
 * Ordena eventos por distância
 */
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

/**
 * Verifica se evento matcha com vibe selecionada
 */
export function matchesVibe(event, vibe) {
  if (!vibe || vibe === 'all') return true;
  
  const vibeConfig = VIBES[vibe];
  if (!vibeConfig) return true;
  
  // Match por gênero
  if (vibeConfig.genres && event.genre) {
    if (vibeConfig.genres.includes(event.genre)) return true;
  }
  
  // Match por vibe_tags
  if (event.vibe_tags && Array.isArray(event.vibe_tags)) {
    if (event.vibe_tags.some(tag => tag.toLowerCase() === vibe.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Valida arquivo de imagem
 */
export function validateImage(file) {
  if (!file) return { valid: false, error: 'Nenhum arquivo selecionado' };
  
  if (!UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato inválido. Use JPG, PNG ou WebP' };
  }
  
  if (file.size > UPLOAD_LIMITS.IMAGE_MAX_SIZE) {
    return { valid: false, error: `Imagem muito grande. Máx ${UPLOAD_LIMITS.IMAGE_MAX_SIZE / 1024 / 1024}MB` };
  }
  
  return { valid: true, error: null };
}

/**
 * Valida arquivo de vídeo
 */
export function validateVideo(file) {
  if (!file) return { valid: false, error: 'Nenhum arquivo selecionado' };
  
  if (!UPLOAD_LIMITS.ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato inválido. Use MP4 ou MOV' };
  }
  
  if (file.size > UPLOAD_LIMITS.VIDEO_MAX_SIZE) {
    return { valid: false, error: `Vídeo muito grande. Máx ${UPLOAD_LIMITS.VIDEO_MAX_SIZE / 1024 / 1024}MB` };
  }
  
  return { valid: true, error: null };
}

/**
 * Formata bytes para MB/KB
 */
export function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

/**
 * Trunca texto com reticências
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// CACHE CONFIG (React Query)
export const CACHE_CONFIG = {
  SHORT: { staleTime: 30000, cacheTime: 60000 },      // 30s / 1min
  MEDIUM: { staleTime: 60000, cacheTime: 300000 },    // 1min / 5min
  LONG: { staleTime: 300000, cacheTime: 600000 },     // 5min / 10min
  STATIC: { staleTime: Infinity, cacheTime: Infinity } // Nunca expira
};

// Exports de constantes para backwards compatibility
export const DEFAULT_AVATAR = DEFAULT_AVATAR_CONST;
export const MUSIC_GENRES = MUSIC_GENRES_LIST;