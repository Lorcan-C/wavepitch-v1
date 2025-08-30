import { useAuth } from '@clerk/clerk-react';

export function useBilling() {
  const { has } = useAuth();

  return {
    // Check if user has unlimited meetings feature
    hasUnlimitedMeetings: () => has?.({ feature: 'unlimited_meetings' }) ?? false,

    // Check if user has advanced analytics feature
    hasAdvancedAnalytics: () => has?.({ feature: 'advanced_analytics' }) ?? false,

    // Check if user has priority support feature
    hasPrioritySupport: () => has?.({ feature: 'priority_support' }) ?? false,

    // Check if user has custom branding feature
    hasCustomBranding: () => has?.({ feature: 'custom_branding' }) ?? false,

    // Check if user has Pro plan
    hasProPlan: () => has?.({ plan: 'pro' }) ?? false,

    // Check if user has Enterprise plan
    hasEnterprisePlan: () => has?.({ plan: 'enterprise' }) ?? false,

    // Generic feature checker
    hasFeature: (feature: string) => has?.({ feature }) ?? false,

    // Generic plan checker
    hasPlan: (plan: string) => has?.({ plan }) ?? false,
  };
}
