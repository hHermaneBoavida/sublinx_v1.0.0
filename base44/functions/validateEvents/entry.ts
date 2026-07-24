import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * SUBLINX — Validacao Periodica de Eventos
 * 
 * Valida origem, consistencia de dados, URLs e status de vendas.
 * Calcula verification_score (0-100) e atualiza verification_status.
 * 
 * Frequencia tierada por proximidade do evento:
 * - > 30 dias: a cada 24h
 * - 7-30 dias: a cada 12h
 * - < 7 dias: a cada 6h
 * - < 24h: a cada 2h
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
      validated: 0,
      verified: 0,
      pending: 0,
      unverified: 0,
      expired: 0,
      cancelled: 0,
      errors: [],
    };

    for (const event of events) {
      try {
        const eventDate = event.date ? new Date(event.date) : null;
        const daysUntilEvent = eventDate
          ? Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Eventos passados → expired
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

        // Eventos cancelados
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

        // Determinar intervalo de validacao baseado na proximidade
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

        // Computar score de verificacao
        const score = computeVerificationScore(event, daysUntilEvent);

        // Verificar URL externa (com timeout de 5s)
        const urlToCheck = event.source_event_url || event.external_url || event.source_url;
        let urlValid = true;
        if (urlToCheck) {
          urlValid = await checkUrl(urlToCheck);
        }

        const finalScore = urlValid ? score : Math.max(0, score - 20);

        // Determinar status
        let verificationStatus;
        if (finalScore >= 70) verificationStatus = 'verified';
        else if (finalScore >= 50) verificationStatus = 'pending';
        else verificationStatus = 'unverified';

        // Determinar has_ticketing e has_reservation
        const hasTicketing = !!(event.purchase_url || event.ticket_url);
        const hasReservation = !!event.reservation_url;

        // Atualizar evento
        await base44.asServiceRole.entities.Event.update(event.id, {
          verification_status: verificationStatus,
          verification_score: finalScore,
          last_verified_at: now.toISOString(),
          external_source: event.external_source || event.source,
          external_id: event.external_id || event.source_id,
          source_event_url: event.source_event_url || event.source_url,
          external_url: event.external_url || event.source_url,
          has_ticketing: hasTicketing,
          has_reservation: hasReservation,
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
      summary: `Validacao: ${stats.validated} validados, ${stats.verified} verificados, ${stats.pending} pendentes, ${stats.unverified} nao verificados, ${stats.expired} expirados, ${stats.cancelled} cancelados.`,
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
 * Computa o score de verificacao (0-100)
 */
function computeVerificationScore(event, daysUntilEvent) {
  let score = 0;

  // Fonte externa identificavel
  const externalSource = event.external_source || event.source;
  if (externalSource && externalSource !== 'organizer') score += 10;

  // ID externo valido
  const externalId = event.external_id || event.source_id;
  if (externalId && String(externalId).trim().length > 0) score += 15;

  // URL de origem valida
  const sourceUrl = event.source_event_url || event.external_url || event.source_url;
  if (sourceUrl) score += 15;

  // Titulo valido
  if (event.title && event.title.trim().length >= 3) score += 10;

  // Data valida e futura
  if (event.date) {
    const d = new Date(event.date);
    if (!isNaN(d.getTime()) && daysUntilEvent !== null && daysUntilEvent >= -1) {
      score += 15;
    }
  }

  // Localizacao valida ou evento online
  const hasCoords = event.location?.lat && event.location?.lng;
  const hasAddress = event.location?.address || event.location?.venue_name || event.location?.city;
  if (event.is_online || (hasCoords && hasAddress)) {
    score += 15;
  } else if (hasCoords || hasAddress) {
    score += 8;
  }

  // Compra/reserva disponivel
  if (event.purchase_url || event.ticket_url || event.reservation_url) {
    score += 10;
  }

  // Organizador identificado
  if (event.organizer_id || (event.organizer && event.organizer !== 'Organizador Externo')) {
    score += 5;
  }

  // Recentemente sincronizado
  if (event.last_synced_at) {
    const syncDate = new Date(event.last_synced_at);
    const daysSinceSync = (Date.now() - syncDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSync < 7) score += 5;
  }

  return Math.min(100, score);
}

/**
 * Verifica se uma URL responde corretamente
 */
async function checkUrl(url) {
  if (!url) return false;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    // Tentar GET se HEAD falhar
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
}