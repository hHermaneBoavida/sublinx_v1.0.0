import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isExpired, isCreator } from '../../shared/signal.ts';

/**
 * Marca um alerta como visualizado pelo usuário atual.
 *
 * - Exige autenticação: a visualização precisa ser atribuível a alguém.
 * - Nunca cria SignalView para o criador do alerta.
 * - Idempotente: se já existe view, retorna sucesso sem duplicar.
 * - Não cria view para alerta expirado.
 * - Só retorna sucesso depois da gravação confirmada no servidor;
 *   o cliente só remove o alerta localmente com `ok: true`.
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

    if (isCreator(signal, user.id)) {
      return Response.json({ ok: true, view_created: false, reason: 'creator' });
    }

    const { items: existing } = await base44.asServiceRole.entities.SignalView.filter(
      { signal_id: signal.id, user_id: user.id },
      { limit: 1 }
    );

    if ((existing || []).length > 0) {
      return Response.json({
        ok: true,
        view_created: false,
        reason: 'already_viewed',
        viewed_at: existing[0].viewed_at,
      });
    }

    const viewedAt = new Date().toISOString();
    const view = await base44.asServiceRole.entities.SignalView.create({
      signal_id: signal.id,
      user_id: user.id,
      viewed_at: viewedAt,
    });

    if (!view || !view.id) {
      return Response.json({ ok: false, error: 'Falha ao gravar a visualização.' }, { status: 500 });
    }

    return Response.json({ ok: true, view_created: true, viewed_at: view.viewed_at || viewedAt });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}