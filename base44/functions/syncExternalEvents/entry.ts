/**
 * SUBLINX — Sincronização de Eventos Externos
 * ETAPAS 2-12: Motor completo de agregação inteligente.
 *
 * Usa InvokeLLM com busca web para descobrir eventos reais globalmente.
 * Inclui: normalização, deduplicação, geocodificação, organizadores,
 * validação, cache, retry, circuit breaker e monitoramento.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { runSync, cleanDatabase } from '../../shared/syncEngine.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado — apenas administradores' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'sync', city, category, sync_type = 'incremental' } = body;

    // ETAPA 1: Limpeza da base
    if (action === 'clean') {
      const result = await cleanDatabase(base44);
      return Response.json({
        success: true,
        action: 'clean',
        ...result,
        message: `Limpeza concluída: ${result.total_deleted} eventos inválidos/duplicados removidos.`,
      });
    }

    // ETAPAS 2-12: Sincronização completa
    const result = await runSync(base44, { city, category, sync_type });

    return Response.json({
      success: true,
      action: 'sync',
      timestamp: new Date().toISOString(),
      ...result,
    });

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});