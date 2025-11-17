/**
 * Sanitiza input do usuário para prevenir XSS e outros ataques
 */
export function sanitizeInput(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    // Remove scripts
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (except images)
    .replace(/data:(?!image)/gi, '');
}

/**
 * Sanitiza HTML permitindo apenas tags seguras
 */
export function sanitizeHTML(html, maxLength = 2000) {
  if (typeof html !== 'string') return '';
  
  const allowedTags = ['b', 'i', 'u', 'em', 'strong', 'a', 'p', 'br'];
  
  let sanitized = html
    .trim()
    .slice(0, maxLength);
  
  // Remove todas tags exceto as permitidas
  sanitized = sanitized.replace(/<(?!\/?(?:b|i|u|em|strong|a|p|br)\b)[^>]*>/gi, '');
  
  // Sanitiza atributos de links
  sanitized = sanitized.replace(
    /<a\s+([^>]*)>/gi,
    (match, attrs) => {
      const href = attrs.match(/href\s*=\s*["']([^"']*)["']/i);
      if (href && href[1] && (href[1].startsWith('http://') || href[1].startsWith('https://'))) {
        return `<a href="${href[1]}" target="_blank" rel="noopener noreferrer">`;
      }
      return '';
    }
  );
  
  return sanitized;
}

/**
 * Valida email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida URL
 */
export function isValidURL(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Limita taxa de chamadas (debounce)
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Valida e sanitiza dados de formulário
 */
export function sanitizeFormData(data, schema) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    const fieldSchema = schema[key];
    
    if (!fieldSchema) continue;
    
    if (fieldSchema.type === 'string') {
      sanitized[key] = sanitizeInput(value, fieldSchema.maxLength || 500);
    } else if (fieldSchema.type === 'email') {
      const cleaned = sanitizeInput(value, 254);
      sanitized[key] = isValidEmail(cleaned) ? cleaned : '';
    } else if (fieldSchema.type === 'url') {
      const cleaned = sanitizeInput(value, 2048);
      sanitized[key] = isValidURL(cleaned) ? cleaned : '';
    } else if (fieldSchema.type === 'number') {
      const num = Number(value);
      sanitized[key] = !isNaN(num) ? num : 0;
    } else if (fieldSchema.type === 'boolean') {
      sanitized[key] = Boolean(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export default {
  sanitizeInput,
  sanitizeHTML,
  isValidEmail,
  isValidURL,
  debounce,
  sanitizeFormData
};