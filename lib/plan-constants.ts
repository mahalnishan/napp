export type PlanType = 'free' | 'professional' | 'enterprise'

export interface PlanLimits {
  workOrdersPerMonth: number
  teamMembers: number
  apiCallsPerMonth: number
  storageGB: number
  features: {
    customBranding: boolean
    whiteLabel: boolean
    apiAccess: boolean
    advancedAutomation: boolean
    multiLocation: boolean
    advancedReporting: boolean
    webhooks: boolean
    customIntegrations: boolean
  }
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    workOrdersPerMonth: 1000,
    teamMembers: 3,
    apiCallsPerMonth: 0,
    storageGB: 1,
    features: {
      customBranding: false,
      whiteLabel: false,
      apiAccess: false,
      advancedAutomation: false,
      multiLocation: false,
      advancedReporting: false,
      webhooks: false,
      customIntegrations: false,
    }
  },
  professional: {
    workOrdersPerMonth: -1, // unlimited
    teamMembers: -1, // unlimited
    apiCallsPerMonth: 10000,
    storageGB: 10,
    features: {
      customBranding: true,
      whiteLabel: false,
      apiAccess: false,
      advancedAutomation: false,
      multiLocation: false,
      advancedReporting: true,
      webhooks: false,
      customIntegrations: false,
    }
  },
  enterprise: {
    workOrdersPerMonth: -1, // unlimited
    teamMembers: -1, // unlimited
    apiCallsPerMonth: 100000,
    storageGB: 100,
    features: {
      customBranding: true,
      whiteLabel: true,
      apiAccess: true,
      advancedAutomation: true,
      multiLocation: true,
      advancedReporting: true,
      webhooks: true,
      customIntegrations: true,
    }
  }
} 