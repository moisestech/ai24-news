import { useAtom } from 'jotai'
import { userEmailAtom } from '../atoms'
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../constants/plans'
import { subscriptionQueries } from '../supabase'

type UsageCheckResult = {
  canGenerate: boolean
  remaining: number
  tier: SubscriptionTier
}

export function useSubscription() {
  const [email] = useAtom(userEmailAtom)
  
  const checkUsageLimit = async (): Promise<UsageCheckResult | false> => {
    if (!email) return false;
    
    const subscription = await subscriptionQueries.getCurrentSubscription(email);
    const tier = (subscription?.tier || 'FREE') as SubscriptionTier;
    const limit = SUBSCRIPTION_TIERS[tier].dailyLimit;
    
    const usage = await subscriptionQueries.getDailyUsage(email);
    const currentCount = usage?.visualizations_count || 0;
    
    return {
      canGenerate: currentCount < limit,
      remaining: limit - currentCount,
      tier
    };
  };

  return { checkUsageLimit };
} 