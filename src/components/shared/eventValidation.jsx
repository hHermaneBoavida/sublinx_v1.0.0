/**
 * SUBLINX — Sistema de Validação e Autenticidade de Eventos
 * 
 * Níveis de confiança:
 *   verified  = Nível 1 — Confirmado por fonte oficial
 *   confirmed = Nível 2 — Publicado pelo estabelecimento
 *   partner   = Nível 3 — Parceiro SUBLINX validado
 *   pending   = Nível 4 — Aguardando validação (NÃO exibir publicamente)
 *   rejected  = Reprovado (NÃO exibir)
 */

export const TRUST_LEVELS = {
  verified: { label: "Verificado", color: "#10b981", icon: "✓", level: 1, public: true },
  confirmed: { label: "Confirmado", color: "#06b6d4", icon: "✓", level: 2, public: true },
  partner: { label: "Parceiro SUBLINX", color: "#a855f7", icon: "✓", level: 3, public: true },
  pending: { label: "Em análise", color: "#f59e0b", icon: "⏳", level: 4, public: false },
  rejected: { label: "Reprovado", color: "#ef4444", icon: "✗", level: null, public: false },
};

export const SOURCE_LABELS = {
  organizer: "Organizador Verificado",
  google_places: "Google Places",
  google_business: "Google Business",
  facebook: "Facebook",
  instagram: "Instagram",
  official_site: "Site Oficial",
  sublinx_partner: "Parceiro SUBLINX",
  admin: "SUBLINX Admin",
};

/**
 * Retorna true se o evento pode ser exibido publicamente.
 * Regras:
 *  - trust_level deve ser verified, confirmed ou partner
 *  - is_published deve ser true
 *  - data do evento não pode ser passada (is_expired false)
 *  - campos obrigatórios presentes
 */
export function isEventPublishable(event) {
  if (!event) return false;
  const trustConfig = TRUST_LEVELS[event.trust_level];
  if (!trustConfig?.public) return false;
  if (!event.is_published) return false;
  // CAUSA RAIZ: o flag is_expired pode ficar stale (backend validateEvents nunca o reseta
  // quando o organizador altera a data para o futuro). Derivar expiração da data real.
  if (isEventExpired(event)) return false;
  if (!event.trust_level || !event.source) return false;
  return getValidationErrors(event).length === 0;
}

/**
 * Valida os campos obrigatórios de um evento.
 * Retorna array de strings descrevendo cada erro.
 */
export function getValidationErrors(event) {
  const errors = [];

  if (!event.title?.trim()) errors.push("Nome do evento ausente");
  if (!event.date) errors.push("Data do evento ausente");
  if (!event.organizer_id) errors.push("Organizador não identificado");
  if (!event.source) errors.push("Fonte de origem não registrada");
  if (!event.trust_level) errors.push("Nível de confiança não definido");
  if (!event.genre) errors.push("Categoria/gênero ausente");

  // Valida data futura
  if (event.date) {
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) {
      errors.push("Data inválida");
    } else if (eventDate < new Date()) {
      errors.push("Data do evento já passou");
    }
  }

  // Valida localização (para eventos presenciais)
  if (!event.is_secret) {
    if (!event.location?.address?.trim()) errors.push("Endereço do local ausente");
    if (event.location?.lat == null || event.location?.lng == null) {
      errors.push("Coordenadas geográficas ausentes");
    } else {
      const { lat, lng } = event.location;
      if (lat === 0 && lng === 0) errors.push("Coordenadas inválidas (0,0)");
      if (lat < -90 || lat > 90) errors.push("Latitude fora do intervalo válido");
      if (lng < -180 || lng > 180) errors.push("Longitude fora do intervalo válido");
    }
  }

  return errors;
}

/**
 * Filtra uma lista de eventos removendo os não publicáveis.
 * Uso: aplicar antes de renderizar qualquer lista pública.
 */
export function filterPublicEvents(events = []) {
  return events.filter(isEventPublishable);
}

/**
 * Verifica se um evento está expirado (data passada).
 */
export function isEventExpired(event) {
  if (!event?.date) return false;
  return new Date(event.date) < new Date();
}

/**
 * Retorna o badge de confiança de um evento para exibição.
 */
export function getTrustBadge(trustLevel) {
  return TRUST_LEVELS[trustLevel] || TRUST_LEVELS.pending;
}