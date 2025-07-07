import { createClient } from '@/lib/supabase/server'
import { Subscription, UsageTracking, UserSettings } from '@/types/database'
import { PlanType, PlanLimits, PLAN_LIMITS } from '@/lib/plan-constants'

export class SubscriptionService {
  private async getSupabase() {
    return await createClient()
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  }

  async getUserPlan(userId: string): Promise<PlanType> {
    const subscription = await this.getUserSubscription(userId)
    return subscription?.plan_type || 'free'
  }

  async getCurrentUsage(userId: string): Promise<UsageTracking | null> {
    const supabase = await this.getSupabase()
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching usage:', error)
      return null
    }

    return data
  }

  async canCreateWorkOrder(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId)
    const limits = PLAN_LIMITS[plan]
    
    if (limits.workOrdersPerMonth === -1) {
      return true // unlimited
    }

    const usage = await this.getCurrentUsage(userId)
    const currentCount = usage?.work_orders_count || 0
    
    return currentCount < limits.workOrdersPerMonth
  }

  async canAddTeamMember(userId: string): Promise<boolean> {
    const supabase = await this.getSupabase()
    const plan = await this.getUserPlan(userId)
    const limits = PLAN_LIMITS[plan]
    
    if (limits.teamMembers === -1) {
      return true // unlimited
    }

    const { count, error } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      console.error('Error counting team members:', error)
      return false
    }

    return (count || 0) < limits.teamMembers
  }

  async hasFeature(userId: string, feature: keyof PlanLimits['features']): Promise<boolean> {
    const plan = await this.getUserPlan(userId)
    return PLAN_LIMITS[plan].features[feature]
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user settings:', error)
      return null
    }

    return data
  }

  async createFreeSubscription(userId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'free',
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        cancel_at_period_end: false
      })

    if (error) {
      console.error('Error creating free subscription:', error)
      throw error
    }

    // Initialize user settings
    await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        custom_branding_enabled: false,
        white_label_enabled: false,
        api_access_enabled: false,
        advanced_automation_enabled: false,
        multi_location_enabled: false,
        advanced_reporting_enabled: false,
        webhooks_enabled: false,
        custom_integrations_enabled: false
      })

    // Initialize usage tracking for current month
    const currentMonth = new Date().toISOString().slice(0, 7)
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        month_year: currentMonth,
        work_orders_count: 0,
        api_calls_count: 0,
        storage_mb_used: 0
      })
  }

  async upgradeSubscription(
    userId: string, 
    planType: PlanType, 
    stripeSubscriptionId?: string,
    stripeCustomerId?: string
  ): Promise<void> {
    const supabase = await this.getSupabase()
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    // Cancel current subscription
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: now.toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')

    // Create new subscription
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        cancel_at_period_end: false,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId
      })

    if (error) {
      console.error('Error upgrading subscription:', error)
      throw error
    }

    // Update user settings based on plan
    const limits = PLAN_LIMITS[planType]
    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        custom_branding_enabled: limits.features.customBranding,
        white_label_enabled: limits.features.whiteLabel,
        api_access_enabled: limits.features.apiAccess,
        advanced_automation_enabled: limits.features.advancedAutomation,
        multi_location_enabled: limits.features.multiLocation,
        advanced_reporting_enabled: limits.features.advancedReporting,
        webhooks_enabled: limits.features.webhooks,
        custom_integrations_enabled: limits.features.customIntegrations
      })
  }



  async incrementWorkOrderCount(userId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const currentMonth = new Date().toISOString().slice(0, 7)
    
    const { error } = await supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        month_year: currentMonth,
        work_orders_count: 1
      }, {
        onConflict: 'user_id,month_year'
      })

    if (error) {
      console.error('Error incrementing work order count:', error)
      throw error
    }
  }

  async incrementApiCallCount(userId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const currentMonth = new Date().toISOString().slice(0, 7)
    
    const { error } = await supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        month_year: currentMonth,
        api_calls_count: 1
      }, {
        onConflict: 'user_id,month_year'
      })

    if (error) {
      console.error('Error incrementing API call count:', error)
      throw error
    }
  }

  async getUsageSummary(userId: string): Promise<{
    plan: PlanType
    limits: PlanLimits
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
    const supabase = await this.getSupabase()
    const plan = await this.getUserPlan(userId)
    const limits = PLAN_LIMITS[plan]
    const usage = await this.getCurrentUsage(userId)
    const { count: teamMembers } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const currentUsage = {
      workOrders: usage?.work_orders_count || 0,
      teamMembers: teamMembers || 0,
      apiCalls: usage?.api_calls_count || 0,
      storageMB: usage?.storage_used_mb || 0
    }

    const remaining = {
      workOrders: limits.workOrdersPerMonth === -1 ? null : Math.max(0, limits.workOrdersPerMonth - currentUsage.workOrders),
      teamMembers: limits.teamMembers === -1 ? null : Math.max(0, limits.teamMembers - currentUsage.teamMembers),
      apiCalls: limits.apiCallsPerMonth === -1 ? null : Math.max(0, limits.apiCallsPerMonth - currentUsage.apiCalls),
      storageMB: limits.storageGB === -1 ? null : Math.max(0, limits.storageGB * 1024 - currentUsage.storageMB)
    }

    return {
      plan,
      limits,
      currentUsage,
      remaining
    }
  }
}

export const subscriptionService = new SubscriptionService() 