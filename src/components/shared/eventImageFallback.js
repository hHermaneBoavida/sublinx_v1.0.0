// SVG inline fallback for event images — no external requests, no random generators.
// Used whenever an event has no image_url or the URL fails to load.
export const FALLBACK_EVENT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='28' font-weight='bold'%3ESUBLINX EVENTOS%3C/text%3E%3C/svg%3E";

// Fallback ticket URL — null por padrão.
// URLs genéricas de busca/listagem são PROIBIDAS como proveniência de evento.
// Cada evento deve ter sua própria ticket_url específica, ou null.
export const FALLBACK_TICKET_URL = null;

// URL do logo SUBLINX que era erroneamente armazenado como image_url de eventos
// sem imagem original. Deve ser filtrado — NUNCA exibido como imagem de evento.
const PLACEHOLDER_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a70ee66a1156f1068d2903/de9996d20_500x500.png";

/**
 * Resolve a imagem correta de um evento com prioridade consistente.
 * Garante que o logo genérico do SUBLINX (antigo DEFAULT_IMAGE) NUNCA
 * seja exibido como imagem de evento — apenas a imagem original real
 * da fonte, ou o fallback SVG estático.
 *
 * Prioridade:
 * 1. image_url original da fonte (se válida e não-placeholder)
 * 2. thumbnail_url (se válido e não-placeholder)
 * 3. FALLBACK_EVENT_IMAGE (SVG estático)
 */
export function resolveEventImage(event) {
  if (!event) return FALLBACK_EVENT_IMAGE;

  const imageUrl = event.image_url;
  if (imageUrl && typeof imageUrl === "string" && imageUrl.trim() !== "" && imageUrl !== PLACEHOLDER_LOGO_URL) {
    return imageUrl;
  }

  const thumbUrl = event.thumbnail_url;
  if (thumbUrl && typeof thumbUrl === "string" && thumbUrl.trim() !== "" && thumbUrl !== PLACEHOLDER_LOGO_URL) {
    return thumbUrl;
  }

  return FALLBACK_EVENT_IMAGE;
}