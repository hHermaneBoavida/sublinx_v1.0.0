import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isExpired, isCreator, toPublicSignal } from '../../shared/signal.ts';

/**
 * Abre um alerta específico.
 *
 * - Retorna 404 se não existir ou se já tiver passado de expires_at.
 * - Não cria SignalView: a marcação só acontece em markSignalViewed,
 *   depois do conteúdo realmente apresentado.
 * - Payload sanitizado.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    const payload = await req.json().catch(() => ({}));
    const signalId = typeof payload.signal_id === 'string' ? payload.signal_id.trim() : '';

    if (!signalId) {
      return Response.json({ error: 'signal_id é obrigatório.' }, { status: 400 });
    }

    const signal = await base44.asServiceRole.entities.Signal
      .get(signalId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));

    if (!signal || isExpired(signal)) {
      return Response.json({ error: 'Alerta não encontrado ou expirado.' }, { status: 404 });
    }

    let isViewed = false;

    if (user) {
      const { items: views } = await base44.asServiceRole.entities.SignalView.filter(
        { signal_id: signal.id, user_id: user.id },
        { limit: 1 }
      );
      isViewed = (views || []).length > 0;
    }

    return Response.json({
      success: true,
      signal: toPublicSignal(signal, {
        isMine: isCreator(signal, user?.id),
        isViewed,
      }),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}