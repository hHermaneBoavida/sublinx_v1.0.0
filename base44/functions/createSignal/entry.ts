import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { computeExpiresAt, toPublicSignal, SIGNAL_TYPES } from '../../shared/signal.ts';

/**
 * Cria um alerta Signal.
 *
 * Regras:
 * - Exige usuário autenticado.
 * - `expires_at` é calculado SOMENTE aqui (agora + 24h). Qualquer data
 *   enviada pelo cliente é ignorada.
 * - A resposta é o payload público sanitizado.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));

    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const body = typeof payload.body === 'string' ? payload.body.trim() : '';

    if (title.length < 3 || title.length > 120) {
      return Response.json(
        { error: 'O título deve ter entre 3 e 120 caracteres.' },
        { status: 400 }
      );
    }

    if (body.length < 3 || body.length > 1000) {
      return Response.json(
        { error: 'O conteúdo deve ter entre 3 e 1000 caracteres.' },
        { status: 400 }
      );
    }

    const type = SIGNAL_TYPES.includes(payload.type) ? payload.type : 'evento';

    const rawLocation = payload.location;
    let location = null;
    if (rawLocation && typeof rawLocation === 'object') {
      const lat = Number(rawLocation.lat);
      const lng = Number(rawLocation.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        location = {
          lat,
          lng,
          address: rawLocation.address ? String(rawLocation.address).slice(0, 240) : null,
        };
      }
    }

    const signal = await base44.asServiceRole.entities.Signal.create({
      title,
      body,
      type,
      city: payload.city ? String(payload.city).slice(0, 120) : null,
      location,
      image_url: payload.image_url ? String(payload.image_url) : null,
      link_url: payload.link_url ? String(payload.link_url) : null,
      author_id: user.id,
      expires_at: computeExpiresAt(),
    });

    return Response.json({
      success: true,
      signal: toPublicSignal(signal, { isMine: true }),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}