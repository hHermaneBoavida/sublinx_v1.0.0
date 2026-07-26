import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getPlanPrivileges } from '../../shared/subscriptionAuth.ts';

/**
 * SUBLINX — Gerenciamento Seguro de Assinaturas
 *
 * ÚNICA via permitida para conceder privilégios premium.
 * O frontend NUNCA pode definir is_organizer/is_pro_member via updateMe().
 *
 * Regras:
 * - Plano gratuito: ativa imediatamente, revoga privilégios premium.
 * - Planos pagos: cria assinatura 'pending' com end_date (30 dias).
 *   Privilégios só concedidos após webhook de pagamento confirmado.
 * - action: 'cancel' cancela assinatura ativa e revoga privilégios.
 * - Expiração automática é validada pelo módulo subscriptionAuth.
 */

const PLANS = {
  free: {
    name: 'Underground Free',
    price: 0,
    features: ['Acesso a eventos públicos', '3 eventos por mês', 'Feed básico', 'Perfil simples'],
  },
  underground_pro: {
    name: 'Underground Pro',
    price: 29.90,
    features: ['Acesso a TODOS os eventos', 'Eventos ilimitados', 'Notificações personalizadas', 'Prioridade em eventos secretos', 'Chat com organizadores', 'Perfil premium', 'Sem anúncios'],
  },
  organizer_elite: {
    name: 'Organizador Elite',
    price: 99.90,
    features: ['Criar eventos ilimitados', 'Gestão de participantes', 'Analytics avançados', 'Promoção prioritária', 'Chat premium', 'Suporte dedicado', 'Comissão reduzida', 'Verificação de organizador'],
  },
};

const SUBSCRIPTION_DURATION_DAYS = 30;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { plan_id, action } = body;

    // ── CANCEL / DOWNGRADE ──────────────────────────────────
    if (action === 'cancel') {
      const activeSubs = await base44.asServiceRole.entities.Subscription.filter({
        user_id: user.id,
        status: 'active',
      });

      for (const sub of activeSubs) {
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'cancelled',
          end_date: new Date().toISOString(),
        });
      }

      // Revoke ALL premium privileges immediately
      await base44.asServiceRole.entities.User.update(user.id, {
        is_organizer: false,
        is_pro_member: false,
        verified_organizer: false,
        secret_mode_unlocked: false,
      });

      return Response.json({
        success: true,
        status: 'cancelled',
        message: 'Assinatura cancelada. Privilégios premium revogados.',
      });
    }

    // ── PLAN CHANGE ────────────────────────────────────────
    const plan = PLANS[plan_id];
    if (!plan) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id,
      status: 'active',
    });

    // Cancel all existing active subscriptions
    for (const sub of existingSubs) {
      await base44.asServiceRole.entities.Subscription.update(sub.id, {
        status: 'cancelled',
        end_date: new Date().toISOString(),
      });
    }

    // FREE PLAN — immediate activation, revoke premium
    if (plan.price === 0) {
      await base44.asServiceRole.entities.Subscription.create({
        user_id: user.id,
        plan_type: plan_id,
        status: 'active',
        price: plan.price,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        features: plan.features,
      });

      // Revoke all premium privileges (free plan has none)
      const privileges = getPlanPrivileges(plan_id);
      await base44.asServiceRole.entities.User.update(user.id, privileges);

      return Response.json({
        success: true,
        plan_id,
        plan_name: plan.name,
        status: 'active',
        message: `Plano ${plan.name} ativado!`,
      });
    }

    // PAID PLANS — create PENDING subscription, NO privileges granted
    // Privileges are only granted after payment confirmation via webhook
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: user.id,
      plan_type: plan_id,
      status: 'pending',
      price: plan.price,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      features: plan.features,
    });

    // Explicitly ensure no premium privileges while pending
    await base44.asServiceRole.entities.User.update(user.id, {
      is_organizer: false,
      is_pro_member: false,
      verified_organizer: false,
      secret_mode_unlocked: false,
    });

    return Response.json({
      success: false,
      plan_id,
      plan_name: plan.name,
      status: 'pending',
      subscription_id: subscription.id,
      message: `Pagamento necessário para ativar o plano ${plan.name}. Privilégios serão concedidos após confirmação do pagamento.`,
    });

  } catch (error) {
    console.error('❌ Erro em manageSubscription:', error);
    return Response.json({ error: 'Erro interno ao processar assinatura' }, { status: 500 });
  }
});