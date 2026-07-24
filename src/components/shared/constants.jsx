// ====================================
// CONSTANTES CENTRALIZADAS DO SUBLINX
// Elimina magic numbers espalhados
// ====================================

// POLLING E TIMERS
export const POLLING_INTERVALS = {
  EVENTS_REALTIME: 5000,        // 5s - Atualização de eventos em tempo real
  NOTIFICATIONS: 30000,          // 30s - Verificação de notificações
  EVENT_FALLBACK: 15000,         // 15s - Refetch fallback de eventos
  PROXIMITY_CHECK: 60000,        // 60s - Verificação de eventos próximos
};

// LIMITES DE PAGINAÇÃO
export const QUERY_LIMITS = {
  EVENTS_PER_PAGE: 10,
  EVENTS_TOTAL: 100,
  REELS_PER_PAGE: 30,
  USERS_SEARCH: 50,
  COMMUNITIES: 50,
  NOTIFICATIONS: 50,
};

// UPLOADS
export const UPLOAD_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024,      // 5MB
  VIDEO_MAX_SIZE: 100 * 1024 * 1024,    // 100MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
};

// GEOLOCALIZAÇÃO
export const GEO_CONFIG = {
  PROXIMITY_RADIUS_KM: 10,               // 10km para notificações
  HIGH_ACCURACY: true,
  TIMEOUT: 10000,                        // 10s
  MAX_AGE: 300000,                       // 5min cache
};

// USUÁRIO
export const USER_LIMITS = {
  NAME_CHANGES_MAX: 3,
  BIO_MAX_LENGTH: 200,
  MAX_MUSIC_PREFERENCES: 10,
};

// DEMO ACCOUNTS
export const DEMO_ACCOUNTS = {
  ORGANIZER: {
    email: 'organizador@sublynx.com',
    type: 'organizer'
  },
  USER: {
    email: 'alex@example.com',
    type: 'user'
  }
};

// MÚSICA - Gêneros
export const MUSIC_GENRES = [
  "techno", "house", "trance", "drum_bass", "dubstep", "ambient",
  "experimental", "acid", "minimal", "hardcore", "funk", "trap",
  "kuduro", "kizomba", "samba", "pagode", "rap", "hip_hop", "reggae"
];

// EVENTOS - Tipos
export const EVENT_TYPES = [
  "rave", "warehouse", "rooftop", "underground", "club", "secret", "festival"
];

// VIBES
export const VIBES = {
  all: { label: 'Todas', emoji: '🌟' },
  dançar: { label: 'Dançar', emoji: '💃', genres: ['techno', 'house', 'trance', 'funk'] },
  relaxar: { label: 'Relaxar', emoji: '🧘', genres: ['ambient', 'minimal'] },
  socializar: { label: 'Socializar', emoji: '🎭', genres: ['hip_hop', 'reggae', 'samba'] },
  adrenalina: { label: 'Adrenalina', emoji: '⚡', genres: ['hardcore', 'drum_bass', 'dubstep'] }
};

// CORES POR TIPO DE EVENTO (para consistência visual)
export const EVENT_TYPE_COLORS = {
  'rave': 'rgba(236, 72, 153, 0.9)',        // rosa
  'warehouse': 'rgba(168, 85, 247, 0.9)',   // roxo
  'rooftop': 'rgba(6, 182, 212, 0.9)',      // cyan
  'underground': 'rgba(139, 92, 246, 0.9)', // violeta
  'club': 'rgba(20, 184, 166, 0.9)',        // teal
  'secret': 'rgba(251, 191, 36, 0.9)',      // amarelo/ouro
  'festival': 'rgba(249, 115, 22, 0.9)',    // laranja
};

// CORES POR GÊNERO MUSICAL
export const GENRE_COLORS = {
  'techno': 'bg-blue-600/20 border-blue-500/30 text-blue-300',
  'house': 'bg-purple-600/20 border-purple-500/30 text-purple-300',
  'trance': 'bg-pink-600/20 border-pink-500/30 text-pink-300',
  'drum_bass': 'bg-red-600/20 border-red-500/30 text-red-300',
  'funk': 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300',
  'trap': 'bg-orange-600/20 border-orange-500/30 text-orange-300',
  'samba': 'bg-green-600/20 border-green-500/30 text-green-300',
  'default': 'bg-gray-600/20 border-gray-500/30 text-gray-300'
};

// STATUS DE DISPONIBILIDADE
export const AVAILABILITY_STATUS = {
  AVAILABLE: { threshold: 0, label: 'DISPONÍVEL', color: 'green' },
  FILLING_FAST: { threshold: 70, label: 'ENCHENDO RÁPIDO', color: 'yellow' },
  ALMOST_FULL: { threshold: 90, label: 'QUASE LOTANDO', color: 'orange' },
  SOLD_OUT: { threshold: 100, label: 'ESGOTADO', color: 'red' },
};

// CACHE CONFIG (React Query)
export const CACHE_CONFIG = {
  SHORT: { staleTime: 30000, cacheTime: 60000 },      // 30s / 1min
  MEDIUM: { staleTime: 60000, cacheTime: 300000 },    // 1min / 5min
  LONG: { staleTime: 300000, cacheTime: 600000 },     // 5min / 10min
  STATIC: { staleTime: Infinity, cacheTime: Infinity } // Nunca expira
};

// AVATARS DEFAULT
export const DEFAULT_AVATAR = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png";

// Z-INDEX LAYERS (evitar conflitos)
export const Z_INDEX = {
  BASE: 0,
  MAP_OVERLAY: 10,
  HEADER: 20,
  FAB: 30,
  MODAL_BACKDROP: 40,
  MODAL_CONTENT: 50,
  TOAST: 60,
  DROPDOWN: 70,
};