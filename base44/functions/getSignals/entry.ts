import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isExpired, isCreator, toPublicSignal } from '../../shared/signal.ts';

/**
 * Descoberta de alertas.
 *
 * - Retorna apenas alertas não expirados (expires_at > agora).
 * - Exclui para o usuário atual os alertas que ele já visualizou
 *   (SignalView persistido no servidor).
 * - O criador continua vendo o próprio alerta, sem gerar SignalView.
 * - Visitantes anônimos veem todos os alertas ativos (não há view por usuário).
 * - Payload sanitizado: sem created_by, created_by_id, e-mail ou author_id.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    const nowIso = new Date().toISOString();

    const { items: signals } = await base44.asServiceRole.entities.Signal.filter(
      { expires_at: { $gt: nowIso } },
      { sort: '-created_date', limit: 100 }
    );

    const active = (signals || []).filter((signal) => !isExpired(signal));

    let viewedIds = new Set();

    if (user) {
      const { items: views } = await base44.asServiceRole.entities.SignalView.filter(
        { user_id: user.id },
        { limit: 500 }
      );
      viewedIds = new Set((views || []).map((view) => view.signal_id));
    }

    const items = active
      .filter((signal) => {
        const mine = isCreator(signal, user?.id);
        if (mine) return true;
        return !viewedIds.has(signal.id);
      })
      .map((signal) =>
        toPublicSignal(signal, {
          isMine: isCreator(signal, user?.id),
          isViewed: viewedIds.has(signal.id),
        })
      );

    return Response.json({ success: true, items, count: items.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}