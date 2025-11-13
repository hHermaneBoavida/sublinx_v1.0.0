/**
 * FUZZY SEARCH SERVICE
 * Implementa busca com tolerância a erros de digitação
 * Usa Levenshtein Distance para scoring
 */

/**
 * Calcula Levenshtein Distance entre duas strings
 * Mede quantas edições são necessárias para transformar s1 em s2
 */
function levenshteinDistance(s1, s2) {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = [];

  // Inicializar matriz
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calcular distâncias
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deletion
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcula similaridade entre query e target (0-1)
 * 1 = match perfeito, 0 = totalmente diferente
 */
function calculateSimilarity(query, target) {
  if (!query || !target) return 0;
  
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  
  // Match exato
  if (q === t) return 1;
  
  // Contains
  if (t.includes(q) || q.includes(t)) {
    return 0.9;
  }

  // Levenshtein
  const maxLen = Math.max(q.length, t.length);
  const distance = levenshteinDistance(q, t);
  
  // Converter distância em similaridade (0-1)
  const similarity = 1 - (distance / maxLen);
  
  return similarity;
}

/**
 * Fuzzy search em array de objetos
 * @param {Array} items - Array de objetos para buscar
 * @param {string} query - Termo de busca
 * @param {string[]} searchFields - Campos para buscar
 * @param {number} threshold - Similaridade mínima (0-1), default 0.3
 * @returns {Array} Items com score, ordenados por relevância
 */
export function fuzzySearch(items, query, searchFields, threshold = 0.3) {
  if (!query || query.trim().length === 0) return items;
  if (!items || items.length === 0) return [];

  const queryTokens = query.toLowerCase().trim().split(/\s+/);

  const scored = items.map(item => {
    let maxScore = 0;
    let matchedField = '';

    searchFields.forEach(field => {
      const value = getNestedValue(item, field);
      if (!value) return;

      const valueStr = String(value);
      
      // Score para cada token
      const tokenScores = queryTokens.map(token => 
        calculateSimilarity(token, valueStr)
      );
      
      // Score final: média dos tokens
      const fieldScore = tokenScores.reduce((a, b) => a + b, 0) / tokenScores.length;
      
      if (fieldScore > maxScore) {
        maxScore = fieldScore;
        matchedField = field;
      }
    });

    return {
      ...item,
      _fuzzyScore: maxScore,
      _matchedField: matchedField
    };
  });

  // Filtrar por threshold e ordenar por score
  return scored
    .filter(item => item._fuzzyScore >= threshold)
    .sort((a, b) => b._fuzzyScore - a._fuzzyScore);
}

/**
 * Correção de typos comuns em português
 */
const TYPO_CORRECTIONS = {
  // Cidades
  'sp': 'são paulo',
  'sampa': 'são paulo',
  'rj': 'rio de janeiro',
  'rio': 'rio de janeiro',
  'bh': 'belo horizonte',
  'poa': 'porto alegre',
  'cwb': 'curitiba',
  
  // Gêneros
  'tekno': 'techno',
  'eletronica': 'electronic',
  'eletronico': 'electronic',
  'piseiro': 'funk',
  
  // Gírias
  'rolê': 'evento',
  'role': 'evento',
  'balada': 'evento',
  'festa': 'evento',
  'after': 'evento tarde',
  'rave': 'rave',
  
  // Artistas comuns (exemplos)
  'anita': 'anitta',
  'alok': 'alok',
};

/**
 * Normaliza query corrigindo typos conhecidos
 */
export function normalizeQuery(query) {
  if (!query) return '';
  
  let normalized = query.toLowerCase().trim();
  
  // Aplicar correções conhecidas
  Object.entries(TYPO_CORRECTIONS).forEach(([typo, correct]) => {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    normalized = normalized.replace(regex, correct);
  });
  
  return normalized;
}

/**
 * Extrai valor aninhado de objeto (ex: "location.city")
 */
function getNestedValue(obj, path) {
  if (!path.includes('.')) return obj[path];
  
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

/**
 * Destaca match na string para UI
 */
export function highlightMatch(text, query) {
  if (!text || !query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-cyan-600/30 text-cyan-300">$1</mark>');
}

/**
 * Gera sugestões de busca baseado em typos
 */
export function getSuggestions(query, allItems) {
  const normalized = normalizeQuery(query);
  
  if (normalized === query.toLowerCase()) {
    return []; // Sem sugestões se não houve correção
  }
  
  return [`Você quis dizer: "${normalized}"?`];
}