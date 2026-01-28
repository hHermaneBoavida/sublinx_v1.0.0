// ====================================
// UTILITIES CENTRALIZADAS - SUBLINX
// Elimina código duplicado e inconsistências
// ====================================

import { calculateDistance } from './helpers';

// ====================================
// FORMATAÇÃO
// ====================================

/**
 * Formata valor monetário para BRL
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata data de forma consistente
 */
export function formatDate(date, format = 'short') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const formats = {
    short: { day: '2-digit', month: '2-digit' },
    medium: { day: '2-digit', month: 'short' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    full: { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }
  };

  return d.toLocaleDateString('pt-BR', formats[format] || formats.short);
}

/**
 * Formata distância em km
 */
export function formatDistance(km) {
  if (km === null || km === undefined || isNaN(km)) return '';
  if (km < 1) return `${(km * 1000).toFixed(0)}m`;
  return `${km.toFixed(1)}km`;
}

/**
 * Formata número de forma compacta (1.2k, 3.5M)
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}k`;
  return `${(num / 1000000).toFixed(1)}M`;
}

// ====================================
// VALIDAÇÃO
// ====================================

/**
 * Valida email
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida URL
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitiza string para evitar XSS básico
 */
export function sanitizeString(str) {
  if (!str) return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida se valor é número positivo
 */
export function isPositiveNumber(value) {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

// ====================================
// CÁLCULOS
// ====================================

/**
 * Calcula porcentagem com segurança (evita divisão por zero)
 */
export function safePercentage(part, total, decimals = 1) {
  if (!total || total === 0) return 0;
  return ((part / total) * 100).toFixed(decimals);
}

/**
 * Calcula média com segurança
 */
export function safeAverage(values, decimals = 2) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + (val || 0), 0);
  return (sum / values.length).toFixed(decimals);
}

/**
 * Agrupa array por propriedade
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Agrupa array usando Map (mais performático)
 */
export function groupByMap(array, keyFn) {
  const map = new Map();
  array.forEach(item => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(item);
  });
  return map;
}

// ====================================
// PERFORMANCE
// ====================================

/**
 * Debounce com cleanup
 */
export function createDebounce(delay = 300) {
  let timeoutId;
  return {
    run: (fn) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fn, delay);
    },
    cancel: () => clearTimeout(timeoutId)
  };
}

/**
 * Throttle simples
 */
export function createThrottle(limit = 100) {
  let inThrottle = false;
  return (fn) => {
    if (!inThrottle) {
      fn();
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoização simples para funções puras
 */
export function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// ====================================
// ARRAY/OBJECT UTILITIES
// ====================================

/**
 * Remove duplicatas de array
 */
export function unique(array, keyFn) {
  if (!keyFn) return [...new Set(array)];
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Chunk array em pedaços menores
 */
export function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Deep clone de objeto
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge profundo de objetos
 */
export function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// ====================================
// GEOLOCALIZAÇÃO
// ====================================

/**
 * Calcula distância entre duas coordenadas (wrapper com cache)
 */
const distanceCache = new Map();

export function getDistance(lat1, lng1, lat2, lng2) {
  const key = `${lat1},${lng1},${lat2},${lng2}`;
  if (distanceCache.has(key)) {
    return distanceCache.get(key);
  }
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  distanceCache.set(key, distance);
  return distance;
}

/**
 * Limpa cache de distâncias
 */
export function clearDistanceCache() {
  distanceCache.clear();
}

// ====================================
// FEEDBACK HÁPTICO
// ====================================

/**
 * Feedback de vibração (se disponível)
 */
export function hapticFeedback(type = 'light') {
  if (!navigator.vibrate) return;
  
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    error: [50, 100, 50],
    warning: [30, 70, 30]
  };
  
  navigator.vibrate(patterns[type] || patterns.light);
}

// ====================================
// EXPORTS
// ====================================

export default {
  formatCurrency,
  formatDate,
  formatDistance,
  formatCompactNumber,
  isValidEmail,
  isValidUrl,
  sanitizeString,
  isPositiveNumber,
  safePercentage,
  safeAverage,
  groupBy,
  groupByMap,
  createDebounce,
  createThrottle,
  memoize,
  unique,
  chunk,
  deepClone,
  deepMerge,
  getDistance,
  clearDistanceCache,
  hapticFeedback
};