import { createClient } from '@/lib/supabase/client'
import { PlanType, PLAN_LIMITS } from '@/lib/plan-constants'

export class SubscriptionClientService {
  private supabase = createClient()

  async getUserSubscription(): Promise<any> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session found')
    }

    const response = await fetch('/api/subscription', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch subscription data')
    }
    
    const { usageSummary } = await response.json()
    return usageSummary
  }

  async getUserPlan(): Promise<PlanType> {
    const subscription = await this.getUserSubscription()
    return subscription?.plan || 'free'
  }

  async getCurrentUsage(): Promise<any> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session found')
    }

    const response = await fetch('/api/subscription', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch usage data')
    }
    
    const { usageSummary } = await response.json()
    return usageSummary
  }

  async canCreateWorkOrder(): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return false

    const usageSummary = await this.getCurrentUsage()
    const plan = usageSummary?.plan || 'free'
    const limits = PLAN_LIMITS[plan]
    
    if (limits.workOrdersPerMonth === -1) {
      return true // unlimited
    }

    const currentCount = usageSummary?.currentUsage?.workOrders || 0
    return currentCount < limits.workOrdersPerMonth
  }

  async canAddTeamMember(): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return false

    const usageSummary = await this.getCurrentUsage()
    const plan = usageSummary?.plan || 'free'
    const limits = PLAN_LIMITS[plan]
    
    if (limits.teamMembers === -1) {
      return true // unlimited
    }

    const { count } = await this.supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return (count || 0) < limits.teamMembers
  }

  async hasFeature(feature: keyof typeof PLAN_LIMITS.free.features): Promise<boolean> {
    const usageSummary = await this.getCurrentUsage()
    const plan = usageSummary?.plan || 'free'
    return PLAN_LIMITS[plan].features[feature]
  }

  async getUserSettings(): Promise<any> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session found')
    }

    const response = await fetch('/api/subscription', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch user settings')
    }
    
    const { userSettings } = await response.json()
    return userSettings
  }

  async createCheckoutSession(planType: 'professional' | 'enterprise'): Promise<{ sessionId: string; url: string }> {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planType }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create checkout session')
    }

    return response.json()
  }

  async createBillingPortalSession(): Promise<{ url: string }> {
    const response = await fetch('/api/stripe/billing-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create billing portal session')
    }

    return response.json()
  }

  async getUsageSummary(): Promise<{
    plan: PlanType
    limits: any
    currentUsage: {
      workOrders: number
      teamMembers: number
      apiCalls: number
      storageMB: number
    }
    remaining: {
      workOrders: number | null
      teamMembers: number | null
      apiCalls: number | null
      storageMB: number | null
    }
  }> {
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session found')
    }

    const response = await fetch('/api/subscription', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch usage summary')
    }
    
    const { usageSummary } = await response.json()
    return usageSummary
  }
}

export const subscriptionClientService = new SubscriptionClientService() 