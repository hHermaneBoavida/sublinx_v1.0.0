/**
 * SUBLINX — Centralized Subscription-Based Authorization
 *
 * Subscription is the SINGLE source of truth for premium privileges.
 * user.is_organizer / is_pro_member are convenience flags for the frontend only.
 * Backend functions MUST validate via this module, never trust user flags directly.
 *
 * This prevents privilege escalation via updateMe() — even if a user sets
 * is_organizer=true from the frontend, backend functions will deny access
 * unless there is a valid, active, non-expired organizer_elite subscription.
 */

const PLAN_PRIVILEGES: Record<string, Record<string, boolean>> = {
  free: { is_organizer: false, is_pro_member: false, verified_organizer: false, secret_mode_unlocked: false },
  underground_pro: { is_organizer: false, is_pro_member: true, verified_organizer: false, secret_mode_unlocked: true },
  organizer_elite: { is_organizer: true, is_pro_member: true, verified_organizer: true, secret_mode_unlocked: true },
};

/**
 * Returns the user's active, non-expired subscription.
 * Auto-expires and revokes privileges for stale subscriptions.
 * Returns null if no active subscription exists.
 */
export async function getActiveSubscription(base44: any, userId: string): Promise<any | null> {
  if (!userId) return null;

  let subs: any[] = [];
  try {
    subs = await base44.asServiceRole.entities.Subscription.filter({
      user_id: userId,
      status: 'active',
    });
  } catch {
    return null;
  }

  if (!subs || subs.length === 0) return null;

  const now = new Date();
  const valid = subs.find(s => {
    if (!s.end_date) return true; // no end date = perpetual
    return new Date(s.end_date) > now;
  });

  // Auto-expire stale subscriptions and revoke all premium privileges
  if (!valid) {
    for (const sub of subs) {
      if (sub.status === 'active' && sub.end_date && new Date(sub.end_date) <= now) {
        try {
          await base44.asServiceRole.entities.Subscription.update(sub.id, { status: 'expired' });
        } catch { /* ignore */ }
      }
    }
    try {
      await base44.asServiceRole.entities.User.update(userId, {
        is_organizer: false,
        is_pro_member: false,
        verified_organizer: false,
        secret_mode_unlocked: false,
      });
    } catch { /* ignore */ }
  }

  return valid || null;
}

/** Returns true if the user has an active organizer_elite subscription. */
export async function hasOrganizerAccess(base44: any, userId: string): Promise<boolean> {
  const sub = await getActiveSubscription(base44, userId);
  return sub?.plan_type === 'organizer_elite';
}

/** Returns true if the user has an active pro or elite subscription. */
export async function hasProAccess(base44: any, userId: string): Promise<boolean> {
  const sub = await getActiveSubscription(base44, userId);
  return sub?.plan_type === 'underground_pro' || sub?.plan_type === 'organizer_elite';
}

/** Returns the privilege set for a given plan type. */
export function getPlanPrivileges(planType: string): Record<string, boolean> {
  return PLAN_PRIVILEGES[planType] || PLAN_PRIVILEGES.free;
}