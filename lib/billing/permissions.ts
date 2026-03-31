/**
 * TropiChat Feature Permissions Matrix
 * 
 * Defines what each tier can and cannot do.
 * Database Plans: 'free', 'starter', 'professional', 'enterprise'
 * App Tiers: 'free', 'starter', 'medium', 'pro', 'elite'
 */

export type PlanTier = 'free' | 'starter' | 'medium' | 'pro' | 'elite';

export interface PlanPermissions {
  maxContacts: number;
  maxTeamMembers: number;
  canBulkBroadcast: boolean;
  canAutoReply: boolean;
  canUseBookingPage: boolean;
  canUsePaymentLinks: boolean;
  canTrainAI: boolean;
  canUseAI: boolean;
  canUseSmartReply: boolean;
  canWhiteLabel: boolean;
  canUseAutomations: boolean; // Added for Workflows
}

/**
 * Normalizes database plan names to our app's PlanTier.
 */
export function normalizePlan(plan: string | undefined): PlanTier {
  const p = plan?.toLowerCase() || 'starter';
  if (p === 'coconut' || p === 'free') return 'free';
  if (p === 'tropic' || p === 'starter') return 'starter';
  if (p === 'island_pro' || p === 'medium') return 'medium';
  if (p === 'professional' || p === 'pro') return 'pro';
  if (p === 'enterprise' || p === 'elite') return 'elite';
  return 'starter';
}

export const PERMISSIONS: Record<PlanTier, PlanPermissions> = {
  free: {
    maxContacts: 100, // Trial limit
    maxTeamMembers: 1,
    canBulkBroadcast: false,
    canAutoReply: true,
    canUseBookingPage: false,
    canUsePaymentLinks: false,
    canTrainAI: false,
    canUseAI: false,
    canUseSmartReply: false,
    canWhiteLabel: false,
    canUseAutomations: false,
  },
  starter: {
    maxContacts: 500,
    maxTeamMembers: 1,
    canBulkBroadcast: false,
    canAutoReply: true,
    canUseBookingPage: false,
    canUsePaymentLinks: false,
    canTrainAI: false,
    canUseAI: false,
    canUseSmartReply: false,
    canWhiteLabel: false,
    canUseAutomations: false,
  },
  medium: {
    maxContacts: 2500,
    maxTeamMembers: 3,
    canBulkBroadcast: true,
    canAutoReply: true,
    canUseBookingPage: false,
    canUsePaymentLinks: false,
    canTrainAI: false,
    canUseAI: false,
    canUseSmartReply: false,
    canWhiteLabel: false,
    canUseAutomations: true,
  },
  pro: {
    maxContacts: 10000,
    maxTeamMembers: 99999, // Unlimited
    canBulkBroadcast: true,
    canAutoReply: true,
    canUseBookingPage: true,
    canUsePaymentLinks: true,
    canTrainAI: true,
    canUseAI: true,
    canUseSmartReply: true,
    canWhiteLabel: false,
    canUseAutomations: true,
  },
  elite: {
    maxContacts: 999999, // Unlimited
    maxTeamMembers: 99999,
    canBulkBroadcast: true,
    canAutoReply: true,
    canUseBookingPage: true,
    canUsePaymentLinks: true,
    canTrainAI: true,
    canUseAI: true,
    canUseSmartReply: true,
    canWhiteLabel: true,
    canUseAutomations: true,
  }
};

/**
 * Checks if a user has access to a specific feature.
 */
export function hasPermission(plan: PlanTier | string | undefined, feature: keyof PlanPermissions): boolean {
  const p = normalizePlan(typeof plan === 'string' ? plan : 'free');
  const config = PERMISSIONS[p] || PERMISSIONS.free;
  
  const val = config[feature];
  return typeof val === 'boolean' ? val : true;
}

/**
 * Checks if a user's trial has expired.
 */
export function isTrialExpired(status: string | undefined, trialEndsAt: string | null | undefined): boolean {
  if (status !== 'trial') return false;
  if (!trialEndsAt) return false; 
  
  return new Date(trialEndsAt).getTime() < Date.now();
}

/**
 * Returns the "blocked" reason if any.
 */
export function getAccessStatus(customer: { status?: string, plan?: string, trial_ends_at?: string | null } | null) {
  // If no customer data is available yet, don't block. 
  // The loading splash handled by the layout is the gatekeeper.
  if (!customer) return { isBlocked: false, reason: null };
  
  const expired = isTrialExpired(customer.status, customer.trial_ends_at);
  
  if (customer.status === 'suspended') return { isBlocked: true, reason: 'suspended' };
  if (customer.status === 'past_due') return { isBlocked: true, reason: 'past_due' };
  if (expired) return { isBlocked: true, reason: 'trial_expired' };
  
  return { isBlocked: false, reason: null };
}

