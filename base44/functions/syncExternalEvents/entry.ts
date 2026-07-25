/**
 * SUBLINX — Sincronização de Eventos Externos
 * ETAPAS 2-12: Motor completo de agregação inteligente.
 *
 * Usa InvokeLLM com busca web para descobrir eventos reais globalmente.
 * Inclui: normalização, deduplicação, geocodificação, organizadores,
 * validação, cache, retry, circuit breaker, dry_run, timeout control,
 * logs estruturados, estatísticas de proveniência de imagens e monitoramento.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { runSync, cleanDatabase } from '../../shared/syncEngine.ts';

Deno.serve(async (req) => {
  let dryRunFlag = false;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado — apenas administradores' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    dryRunFlag = body.dry_run || false;
    const { action = 'sync', city, category, sync_type = 'incremental', dry_run = false, limit = 10, timeout_ms = 120000 } = body;

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
    const result = await runSync(base44, { city, category, sync_type, dry_run, limit, timeout_ms });

    return Response.json({
      success: true,
      action: 'sync',
      timestamp: new Date().toISOString(),
      ...result,
    });

  } catch (error) {
    // Timeout controlado — não expor stack trace
    if (error?.code === 'SYNC_TIMEOUT') {
      return Response.json({
        success: false,
        error_code: 'SYNC_TIMEOUT',
        stage: error.stage,
        elapsed_ms: error.elapsed_ms,
        dry_run: dryRunFlag,
        timestamp: new Date().toISOString(),
      }, { status: 504 });
    }
    console.error('[SYNC] Erro na sincronização:', error?.message || 'unknown');
    return Response.json({
      success: false,
      error: 'Erro interno durante a sincronização',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});