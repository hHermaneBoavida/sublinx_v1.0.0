/**
 * SUBLINX — Seed de fallback para eventos (São Paulo / SP).
 *
 * Garante que Feed e Mapa NUNCA fiquem zerados quando a API principal
 * retorna erro ou array vazio. Todos os eventos passam por filterPublicEvents()
 * antes de serem retornados.
 *
 * Todos os eventos utilizam venues reais de São Paulo, fotografias reais
 * (Unsplash) e links de compra em plataformas oficiais de ingressos.
 */

import { filterPublicEvents } from './eventValidation';
import { RAW_FALLBACK_EVENTS } from './fallbackEventsData';

/**
 * Retorna eventos de fallback validados por filterPublicEvents().
 * Usado quando a API retorna erro ou array vazio.
 */
export function getFallbackEvents() {
  const events = filterPublicEvents(RAW_FALLBACK_EVENTS);
  // Marcar explicitamente como seed/demo — NUNCA enviar ao pipeline de sincronização externa.
  return events.map(e => ({
    ...e,
    is_seed: true,
    is_external: false,
  }));
}

/**
 * Helper: se a lista de eventos da API estiver vazia ou em erro,
 * retorna o seed de fallback.
 */
export function withFallback(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return getFallbackEvents();
  }
  return events;
}