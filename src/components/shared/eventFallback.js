/**
 * SUBLINX — Empty-state helper for event lists.
 *
 * REGRAS:
 * - NUNCA injetar eventos fictícios, seed ou demo.
 * - Quando a API retorna vazio ou erro, o sistema deve exibir
 *   um estado vazio amigável — nunca preencher com dados inventados.
 * - withFallback(events) retorna events inalterado (ou [] se vazio).
 * - getFallbackEvents() retorna [] — sem fallback de eventos fictícios.
 */

/**
 * Retorna eventos de fallback. SEMPRE retorna array vazio —
 * o SUBLINX não utiliza eventos fictícios para preencher a interface.
 * Quando não há eventos válidos, o frontend exibe um estado vazio.
 */
export function getFallbackEvents() {
  return [];
}

/**
 * Helper: retorna a lista de eventos inalterada.
 * Se a lista for vazia ou inválida, retorna [].
 * NUNCA injeta eventos fictícios.
 */
export function withFallback(events) {
  if (!Array.isArray(events)) return [];
  return events;
}