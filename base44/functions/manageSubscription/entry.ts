import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * SUBLINX — Gerenciamento Seguro de Assinaturas
 *
 * Esta é a ÚNICA via permitida para conceder privilégios premium
 * (is_organizer, is_pro_member, verified_organizer, secret_mode_unlocked).
 *
 * O frontend NUNCA pode definir essas flags diretamente via updateMe().
 *
 * Regras:
 * - Plano gratuito: ativa imediatamente, revoga privilégios premium.
 * - Planos pagos: sem gateway configurado → cria assinatura 'pending',
 *   NÃO concede privilégios. Modo sandbox claramente identificado.
 * - Preço e features são validados server-side; o payload do cliente é ignorado.
 */

const PLANS = {
  free: {
    name: 'Underground Free',
    price: 0,
    features: ['Acesso a eventos públicos', '3 eventos por mês', 'Feed básico', 'Perfil simples'],
    privileges: { is_organizer: false, is_pro_member: false, verified_organizer: false, secret_mode_unlocked: false },
  },
  underground_pro: {
    name: 'Underground Pro',
    price: 29.90,
    features: ['Acesso a TODOS os eventos', 'Eventos ilimitados', 'Notificações personalizadas', 'Prioridade em eventos secretos', 'Chat com organizadores', 'Perfil premium', 'Sem anúncios'],
    privileges: { is_organizer: false, is_pro_member: true, verified_organizer: false, secret_mode_unlocked: true },
  },
  organizer_elite: {
    name: 'Organizador Elite',
    price: 99.90,
    features: ['Criar eventos ilimitados', 'Gestão de participantes', 'Analytics avançados', 'Promoção prioritária', 'Chat premium com usuários', 'Suporte dedicado', 'Comissão reduzida', 'Verificação de organizador'],
    privileges: { is_organizer: true, is_pro_member: true, verified_organizer: true, secret_mode_unlocked: true },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { plan_id } = body;

    // Validar plano contra definição server-side (nunca confiar no payload do cliente)
    const plan = PLANS[plan_id];
    if (!plan) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Buscar assinatura ativa atual
    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id,
      status: 'active',
    });

    // PLANO GRATUITO — ativação imediata, sem privilégios premium
    if (plan.price === 0) {
      // Cancelar assinaturas ativas anteriores
      for (const sub of existingSubs) {
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'cancelled',
          end_date: new Date().toISOString(),
        });
      }

      // Criar nova assinatura ativa
      await base44.asServiceRole.entities.Subscription.create({
        user_id: user.id,
        plan_type: plan_id,
        status: 'active',
        price: plan.price,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        features: plan.features,
      });

      // Revogar privilégios premium (plano gratuito não concede nenhum)
      await base44.asServiceRole.entities.User.update(user.id, {
        is_organizer: false,
        is_pro_member: false,
        verified_organizer: false,
        secret_mode_unlocked: false,
      });

      return Response.json({
        success: true,
        plan_id,
        plan_name: plan.name,
        status: 'active',
        message: `Plano ${plan.name} ativado com sucesso!`,
      });
    }

    // PLANOS PAGOS — sem gateway de pagamento configurado
    // NÃO conceder privilégios. Criar assinatura pendente (modo sandbox).
    // Quando um gateway real for integrado, o fluxo de confirmação virá via webhook.

    // Cancelar assinaturas ativas anteriores
    for (const sub of existingSubs) {
      await base44.asServiceRole.entities.Subscription.update(sub.id, {
        status: 'cancelled',
        end_date: new Date().toISOString(),
      });
    }

    // Criar assinatura com status 'pending' — NENHUM privilégio concedido
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: user.id,
      plan_type: plan_id,
      status: 'pending',
      price: plan.price,
      start_date: new Date().toISOString(),
      features: plan.features,
    });

    return Response.json({
      success: false,
      plan_id,
      plan_name: plan.name,
      status: 'pending_payment',
      sandbox: true,
      subscription_id: subscription.id,
      price: plan.price,
      message: 'Pagamento pendente. Nenhum privilégio foi concedido. A integração de pagamento será ativada em breve.',
    });

  } catch (error) {
    console.error('❌ Erro em manageSubscription:', error);
    return Response.json({ error: 'Erro interno ao processar assinatura' }, { status: 500 });
  }
});