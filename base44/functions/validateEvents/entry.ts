import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * SUBLINX — Validacao Periodica de Eventos v3
 * 
 * 3 CAMADAS:
 * 1. Validacao estrutural (consistencia dos dados)
 * 2. Validacao da fonte original (URL acessivel + dados compativeis)
 * 3. Validacao de compra/reserva (URLs de venda acessiveis)
 * 
 * Score (0-100):
 * - Fonte identificavel: +10
 * - ID externo valido: +10
 * - Titulo valido: +10
 * - Data valida: +10
 * - Localizacao valida ou online: +10
 * - URL de origem acessivel: +15
 * - Evento confirmado na fonte: +15
 * - URL de compra valida: +5
 * - URL de reserva valida: +5
 * - Evento futuro e ativo: +10
 * 
 * Status: verified (>=70), pending (50-69), unverified (<50), expired, cancelled
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado — apenas administradores' }, { status: 403 });
    }

    const now = new Date();
    const events = await base44.asServiceRole.entities.Event.list('-created_date', 500);

    const stats = {
      total: events.length,
      validated: 0,
      verified: 0,
      pending: 0,
      unverified: 0,
      expired: 0,
      cancelled: 0,
      with_ticketing: 0,
      with_reservation: 0,
      errors: [],
    };

    for (const event of events) {
      try {
        const eventDate = event.date ? new Date(event.date) : null;
        const daysUntilEvent = eventDate
          ? Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Eventos passados → expired (nao revalidar)
        if (daysUntilEvent !== null && daysUntilEvent < -1) {
          if (event.verification_status !== 'expired') {
            await base44.asServiceRole.entities.Event.update(event.id, {
              verification_status: 'expired',
              is_expired: true,
              last_verified_at: now.toISOString(),
            });
            stats.expired++;
          }
          continue;
        }

        // Eventos cancelados → cancelled (nao revalidar)
        if (event.event_status === 'cancelled') {
          if (event.verification_status !== 'cancelled') {
            await base44.asServiceRole.entities.Event.update(event.id, {
              verification_status: 'cancelled',
              last_verified_at: now.toISOString(),
            });
            stats.cancelled++;
          }
          continue;
        }

        // Determinar intervalo de validacao por proximidade
        let intervalHours = 24;
        if (daysUntilEvent !== null) {
          if (daysUntilEvent < 1) intervalHours = 2;
          else if (daysUntilEvent < 7) intervalHours = 6;
          else if (daysUntilEvent < 30) intervalHours = 12;
        }

        // Verificar se precisa validar
        const lastVerified = event.last_verified_at ? new Date(event.last_verified_at) : null;
        if (lastVerified) {
          const hoursSinceLastVerify = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastVerify < intervalHours) continue;
        }

        // CAMADA 1 — Validacao estrutural
        const structuralValid = validateStructure(event);

        // CAMADA 2 — Validacao da fonte original
        const sourceUrl = event.source_event_url || event.source_url;
        let sourceUrlAccessible = false;
        if (sourceUrl) {
          sourceUrlAccessible = await checkUrl(sourceUrl);
        }

        // CAMADA 3 — Validacao de compra/reserva
        const purchaseUrl = event.purchase_url;
        const ticketUrl = event.ticket_url;
        const reservationUrl = event.reservation_url;

        let purchaseUrlAccessible = false;
        let ticketUrlAccessible = false;
        let reservationUrlAccessible = false;

        if (purchaseUrl) purchaseUrlAccessible = await checkUrl(purchaseUrl);
        if (ticketUrl && ticketUrl !== purchaseUrl) ticketUrlAccessible = await checkUrl(ticketUrl);
        if (reservationUrl) reservationUrlAccessible = await checkUrl(reservationUrl);

        // Determinar ticket_status
        let ticketStatus = 'unknown';
        const hasAnyTicketUrl = !!(purchaseUrl || ticketUrl);
        if (hasAnyTicketUrl) {
          if (purchaseUrlAccessible || ticketUrlAccessible) {
            ticketStatus = 'available';
          }
          // Se nao acessivel, mantem unknown — nao assume vendido nem esgotado
        }

        // Computar verification_score (0-100)
        const score = computeScore({
          event,
          daysUntilEvent,
          structuralValid,
          sourceUrlAccessible,
          purchaseUrlAccessible,
          ticketUrlAccessible,
          reservationUrlAccessible,
        });

        // Determinar verification_status
        let verificationStatus;
        if (score >= 70) verificationStatus = 'verified';
        else if (score >= 50) verificationStatus = 'pending';
        else verificationStatus = 'unverified';

        const hasTicketing = !!(purchaseUrl || ticketUrl);
        const hasReservation = !!reservationUrl;

        if (hasTicketing) stats.with_ticketing++;
        if (hasReservation) stats.with_reservation++;

        // Atualizar evento
        await base44.asServiceRole.entities.Event.update(event.id, {
          verification_status: verificationStatus,
          verification_score: score,
          last_verified_at: now.toISOString(),
          external_source: event.external_source || event.source,
          external_id: event.external_id || event.source_id,
          source_event_url: event.source_event_url || event.source_url,
          external_url: event.external_url || event.source_url,
          has_ticketing: hasTicketing,
          has_reservation: hasReservation,
          ticket_status: ticketStatus,
          last_ticket_check_at: now.toISOString(),
        });

        stats.validated++;
        if (verificationStatus === 'verified') stats.verified++;
        else if (verificationStatus === 'pending') stats.pending++;
        else if (verificationStatus === 'unverified') stats.unverified++;

      } catch (e) {
        stats.errors.push(`${event.id || 'unknown'}: ${e.message}`);
      }
    }

    // Criar SyncLog
    await base44.asServiceRole.entities.SyncLog.create({
      sync_type: 'validate',
      source: 'validation_engine',
      status: stats.errors.length > 0 && stats.validated > 0 ? 'partial' : (stats.errors.length > 0 ? 'failed' : 'completed'),
      started_at: now.toISOString(),
      completed_at: new Date().toISOString(),
      summary: `Validacao: ${stats.validated} validados, ${stats.verified} verificados, ${stats.pending} pendentes, ${stats.unverified} nao verificados, ${stats.expired} expirados, ${stats.cancelled} cancelados. Compra: ${stats.with_ticketing}, Reserva: ${stats.with_reservation}.`,
      errors: stats.errors.slice(0, 50),
      duration_seconds: Math.round((Date.now() - now.getTime()) / 1000),
    });

    return Response.json({
      success: true,
      timestamp: now.toISOString(),
      ...stats,
    });

  } catch (error) {
    return Response.json({ error: 'Erro interno durante validacao' }, { status: 500 });
  }
});

/**
 * CAMADA 1 — Validacao estrutural
 * Verifica consistencia basica dos dados do evento.
 */
function validateStructure(event) {
  if (!event.title || event.title.trim().length < 3) return false;
  if (!event.date) return false;
  const d = new Date(event.date);
  if (isNaN(d.getTime())) return false;
  if (!event.source) return false;
  const hasCoords = event.location?.lat && event.location?.lng;
  const hasAddress = event.location?.address || event.location?.venue_name || event.location?.city;
  if (!event.is_online && !hasCoords && !hasAddress) return false;
  return true;
}

/**
 * Computa o verification_score (0-100)
 */
function computeScore(data) {
  const {
    event,
    daysUntilEvent,
    structuralValid,
    sourceUrlAccessible,
    purchaseUrlAccessible,
    ticketUrlAccessible,
    reservationUrlAccessible,
  } = data;

  let score = 0;

  // Identidade/origem
  const externalSource = event.external_source || event.source;
  if (externalSource && externalSource !== 'organizer' && externalSource !== 'admin') {
    score += 10; // Fonte identificavel
  }

  const externalId = event.external_id || event.source_id;
  if (externalId && String(externalId).trim().length > 0) {
    score += 10; // ID externo valido
  }

  // Dados do evento
  if (event.title && event.title.trim().length >= 3) {
    score += 10; // Titulo valido
  }

  if (event.date) {
    const d = new Date(event.date);
    if (!isNaN(d.getTime())) {
      score += 10; // Data valida
    }
  }

  // Localizacao valida ou evento online
  const hasCoords = event.location?.lat && event.location?.lng;
  const hasAddress = event.location?.address || event.location?.venue_name || event.location?.city;
  if (event.is_online || (hasCoords && hasAddress)) {
    score += 10;
  }

  // Fonte
  if (sourceUrlAccessible) {
    score += 15; // URL de origem acessivel
  }

  // Evento confirmado na fonte original (proxy: URL acessivel + dados estruturalmente validos + fonte externa)
  const isExternalSource = externalSource && externalSource !== 'organizer' && externalSource !== 'admin';
  if (sourceUrlAccessible && structuralValid && isExternalSource) {
    score += 15;
  }

  // Compra/reserva
  if (purchaseUrlAccessible || ticketUrlAccessible) {
    score += 5; // URL de compra valida
  }
  if (reservationUrlAccessible) {
    score += 5; // URL de reserva valida
  }

  // Atualidade
  if (daysUntilEvent !== null && daysUntilEvent >= -1) {
    score += 10; // Evento futuro e ativo
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Verifica se uma URL esta acessivel (HEAD → GET fallback)
 */
async function checkUrl(url) {
  if (!url) return false;

  // Primeira tentativa: HEAD
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (response.ok) return true;
  } catch {
    // HEAD falhou — tentar GET
  }

  // Fallback: GET
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}