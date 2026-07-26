import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * SUBLINX — Criação de Eventos Demo (DESATIVADO)
 *
 * POLÍTICA DE AUTENTICIDADE:
 * A criação de eventos fictícios, demo, mock ou seed é PROIBIDA em produção.
 * O SUBLINX prefere FEED VAZIO a EVENTO FALSO.
 *
 * Eventos só entram no Feed público através do pipeline de sincronização
 * (syncExternalEvents → syncEngine) com proveniência verificável, ou via
 * criação manual pelo organizador no frontend (CriarEvento).
 *
 * Esta função existe apenas para compatibilidade de API e sempre retorna erro.
 */
Deno.serve(async (_req) => {
  return Response.json({
    success: false,
    error: 'Criação de eventos demo/fictícios é proibida pela política de autenticidade do SUBLINX. Use o pipeline syncExternalEvents ou o formulário CriarEvento.',
  }, { status: 403 });
});