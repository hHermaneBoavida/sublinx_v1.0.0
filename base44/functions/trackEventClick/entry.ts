import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * SUBLINX — Rastreamento de Cliques em Eventos
 * 
 * Registra redirecionamentos para compras, reservas e detalhes.
 * Nao armazena dados sensiveis — apenas metricas de interesse.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Autenticacao opcional — permite tracking anonimo
    let userId = null;
    try {
      const user = await base44.auth.me();
      if (user) userId = user.id;
    } catch {
      // Usuario nao autenticado — tracking anonimo
    }

    const body = await req.json().catch(() => ({}));
    const { event_id, action_type, provider, destination_url } = body;

    if (!event_id || !action_type || !destination_url) {
      return Response.json({ error: 'Campos obrigatorios ausentes' }, { status: 400 });
    }

    const validActionTypes = ['purchase', 'reservation', 'details'];
    if (!validActionTypes.includes(action_type)) {
      return Response.json({ error: 'Tipo de acao invalido' }, { status: 400 });
    }

    await base44.asServiceRole.entities.EventClick.create({
      event_id,
      user_id: userId,
      action_type,
      provider: provider || 'unknown',
      destination_url,
      clicked_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Erro ao registrar clique' }, { status: 500 });
  }
});