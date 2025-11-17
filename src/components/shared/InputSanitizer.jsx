import React from 'react';

/**
 * Sanitiza input para prevenir XSS
 */
export function sanitizeHTML(text) {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Valida e limita tamanho de string
 */
export function validateString(text, maxLength = 500) {
  if (!text) return { valid: true, value: '' };
  
  const trimmed = text.trim();
  
  if (trimmed.length > maxLength) {
    return { 
      valid: false, 
      error: `Texto muito longo (máx ${maxLength} caracteres)`,
      value: trimmed.substring(0, maxLength)
    };
  }
  
  return { valid: true, value: trimmed };
}

/**
 * Valida número em range
 */
export function validateNumber(value, min, max) {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Número inválido' };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, error: `Mínimo: ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, error: `Máximo: ${max}` };
  }
  
  return { valid: true, value: num };
}

/**
 * Valida email
 */
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!regex.test(email)) {
    return { valid: false, error: 'Email inválido' };
  }
  
  return { valid: true, value: email.toLowerCase().trim() };
}

/**
 * Valida URL
 */
export function validateURL(url) {
  try {
    new URL(url);
    return { valid: true, value: url };
  } catch {
    return { valid: false, error: 'URL inválida' };
  }
}

/**
 * Rate limiter local (client-side)
 */
export class RateLimiter {
  constructor(maxCalls, windowMs) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.calls = [];
  }
  
  canCall() {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < this.windowMs);
    
    if (this.calls.length >= this.maxCalls) {
      return false;
    }
    
    this.calls.push(now);
    return true;
  }
  
  getRemainingTime() {
    if (this.calls.length < this.maxCalls) return 0;
    
    const oldestCall = this.calls[0];
    const timeToWait = this.windowMs - (Date.now() - oldestCall);
    return Math.max(0, timeToWait);
  }
}

/**
 * Hook para rate limiting
 */
export function useRateLimiter(maxCalls = 5, windowMs = 60000) {
  const limiterRef = React.useRef(new RateLimiter(maxCalls, windowMs));
  
  return {
    canCall: () => limiterRef.current.canCall(),
    getRemainingTime: () => limiterRef.current.getRemainingTime()
  };
}