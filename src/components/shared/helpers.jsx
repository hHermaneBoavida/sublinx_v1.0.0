/**
 * SUBLINX - Funções Utilitárias Compartilhadas
 */

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isValidEvent = (event) => {
  return event?.id && event?.title && event?.location?.lat && event?.location?.lng && event?.date;
};

export const filterFutureEvents = (events) => {
  const now = new Date();
  return (events || []).filter(event => {
    if (!isValidEvent(event)) return false;
    return new Date(event.date) >= now;
  });
};

export const filterPastEvents = (events) => {
  const now = new Date();
  return (events || []).filter(event => {
    if (!isValidEvent(event)) return false;
    return new Date(event.date) < now;
  });
};

export const sortEventsByDistance = (events, userLocation) => {
  if (!userLocation?.lat || !userLocation?.lng) {
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  return [...events].sort((a, b) => {
    const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
    const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
    return distA - distB;
  });
};

export const VIBE_GENRE_MAP = {
  'dançar': ['techno', 'house', 'trance', 'drum_bass', 'dubstep', 'funk', 'trap'],
  'relaxar': ['ambient', 'experimental', 'minimal'],
  'socializar': ['samba', 'pagode', 'kizomba', 'kuduro', 'reggae', 'rap', 'hip_hop'],
  'adrenalina': ['hardcore', 'acid', 'experimental']
};

export const matchesVibe = (event, vibe) => {
  if (vibe === 'all') return true;
  
  const vibeGenres = VIBE_GENRE_MAP[vibe] || [];
  const eventGenre = event.genre?.toLowerCase();
  const eventVibeTags = event.vibe_tags?.map(tag => tag.toLowerCase()) || [];
  
  return vibeGenres.includes(eventGenre) || eventVibeTags.includes(vibe.toLowerCase());
};

export const DEFAULT_AVATAR = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png";

export const validateImageSize = (file, maxSizeMB = 5) => {
  if (!file) return { valid: false, error: "Nenhum arquivo selecionado" };
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: "Selecione uma imagem válida" };
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Imagem deve ter no máximo ${maxSizeMB}MB` };
  }
  return { valid: true };
};

export const CACHE_CONFIG = {
  SHORT: { staleTime: 30 * 1000, cacheTime: 60 * 1000 },
  MEDIUM: { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 },
  LONG: { staleTime: 30 * 60 * 1000, cacheTime: 60 * 60 * 1000 },
  STATIC: { staleTime: Infinity, cacheTime: Infinity }
};

export const MUSIC_GENRES = [
  "Techno", "House", "Trance", "Drum & Bass", "Dubstep", "Ambient",
  "Experimental", "Funk", "Trap", "Kuduro", "Kizomba", "Samba",
  "Pagode", "Rap", "Hip Hop", "Reggae"
];