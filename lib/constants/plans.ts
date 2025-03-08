type BasePlan = {
  name: string;
  dailyLimit: number;
  features: readonly string[];
}

type FreePlan = BasePlan & {
  tier: 'FREE';
}

type PaidPlan = BasePlan & {
  tier: 'PRO' | 'UNLIMITED';
  price: number;
}

export const SUBSCRIPTION_TIERS = {
  FREE: {
    tier: 'FREE' as const,
    name: 'Free',
    dailyLimit: 1,
    features: [
      'One news visualization per day',
      'Basic art styles',
      'View last 24 hours of history'
    ]
  },
  PRO: {
    tier: 'PRO' as const,
    name: 'Pro',
    price: 9.99,
    dailyLimit: 10,
    features: [
      '10 news visualizations per day',
      'All art styles',
      'Full history access',
      'Custom art style preferences'
    ]
  },
  UNLIMITED: {
    tier: 'UNLIMITED' as const,
    name: 'Unlimited',
    price: 29.99,
    dailyLimit: Infinity,
    features: [
      'Unlimited news visualizations',
      'Priority image generation',
      'API access',
      'Custom branding options'
    ]
  }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type Plan = typeof SUBSCRIPTION_TIERS[SubscriptionTier];

// KEEP: These will be used for subscription features
export const FreePlan = {
  name: 'Free',
  limit: 5,
  price: 0
} as const

export const PaidPlan = {
  name: 'Pro',
  limit: 100,
  price: 10
} as const

// Add type guard
export const isPaidPlan = (plan: unknown): plan is typeof PaidPlan => {
  return plan === PaidPlan
} 