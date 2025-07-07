import { createClient } from '@/lib/supabase/server'
import { subscriptionService } from '@/lib/subscription'

export async function ensureUserSubscription(userId: string) {
  try {
    const supabase = createClient()
    
    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    // If no active subscription exists, create a free one
    if (!existingSubscription) {
      await subscriptionService.createFreeSubscription(userId)
      console.log(`Created free subscription for user ${userId}`)
    }
  } catch (error) {
    console.error('Error ensuring user subscription:', error)
    // Don't throw error to avoid blocking user registration
  }
}

export async function checkAndEnforceLimits(userId: string, action: 'create_work_order' | 'add_team_member') {
  try {
    switch (action) {
      case 'create_work_order':
        const canCreateWorkOrder = await subscriptionService.canCreateWorkOrder(userId)
        if (!canCreateWorkOrder) {
          throw new Error('Work order limit reached. Please upgrade your plan.')
        }
        break
      
      case 'add_team_member':
        const canAddTeamMember = await subscriptionService.canAddTeamMember(userId)
        if (!canAddTeamMember) {
          throw new Error('Team member limit reached. Please upgrade your plan.')
        }
        break
    }
  } catch (error) {
    console.error(`Error checking limits for ${action}:`, error)
    throw error
  }
} 