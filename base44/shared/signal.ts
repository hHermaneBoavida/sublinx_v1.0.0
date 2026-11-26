/**
 * SUBLINX LIGHT — regras compartilhadas de Signal
 *
 * - Todo alerta dura no máximo 24h.
 * - A expiração é calculada exclusivamente no servidor.
 * - O payload público nunca carrega created_by, created_by_id, e-mail
 *   ou qualquer identificador pessoal.
 */

export const SIGNAL_TTL_MS = 24 * 60 * 60 * 1000;

export const SIGNAL_TYPES = ['evento', 'aviso', 'promocao', 'surpresa'];

export function computeExpiresAt(now: number = Date.now()): string {
  return new Date(now + SIGNAL_TTL_MS).toISOString();
}

export function isExpired(signal: any, now: number = Date.now()): boolean {
  const expiresAt = signal?.expires_at ? new Date(signal.expires_at).getTime() : NaN;
  if (!Number.isFinite(expiresAt)) return true;
  return expiresAt <= now;
}

function publicLocation(location: any) {
  if (!location || typeof location !== 'object') return null;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    address: location.address || null,
  };
}

export function toPublicSignal(signal: any, options: { isMine?: boolean; isViewed?: boolean } = {}) {
  return {
    id: signal.id,
    title: signal.title,
    body: signal.body,
    type: signal.type || 'evento',
    city: signal.city || null,
    location: publicLocation(signal.location),
    image_url: signal.image_url || null,
    link_url: signal.link_url || null,
    expires_at: signal.expires_at,
    created_date: signal.created_date || null,
    is_mine: options.isMine === true,
    is_viewed: options.isViewed === true,
  };
}

export function isCreator(signal: any, userId: string | null | undefined): boolean {
  if (!userId) return false;
  // author_id é o único handle confiável: created_by_id pode ser carimbado
  // com a conta de serviço quando o alerta nasce numa função backend.
  return signal?.author_id === userId;
}