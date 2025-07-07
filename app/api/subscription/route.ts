import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { subscriptionService } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the user from the request headers (passed from client)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get usage summary and user settings directly from database
    const currentMonth = new Date().toISOString().slice(0, 7)
    
    // Get current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const plan = (subscription?.plan_type || 'free') as 'free' | 'professional' | 'enterprise'
    
    // Get usage tracking
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_year', currentMonth)
      .single()

    // Get team members count
    const { count: teamMembers } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get user settings
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Import plan constants
    const { PLAN_LIMITS } = await import('@/lib/plan-constants')
    const limits = PLAN_LIMITS[plan]

    const currentUsage = {
      workOrders: usage?.work_orders_count || 0,
      teamMembers: teamMembers || 0,
      apiCalls: usage?.api_calls_count || 0,
      storageMB: usage?.storage_mb_used || 0
    }

    const remaining = {
      workOrders: limits.workOrdersPerMonth === -1 ? null : Math.max(0, limits.workOrdersPerMonth - currentUsage.workOrders),
      teamMembers: limits.teamMembers === -1 ? null : Math.max(0, limits.teamMembers - currentUsage.teamMembers),
      apiCalls: limits.apiCallsPerMonth === -1 ? null : Math.max(0, limits.apiCallsPerMonth - currentUsage.apiCalls),
      storageMB: limits.storageGB === -1 ? null : Math.max(0, limits.storageGB * 1024 - currentUsage.storageMB)
    }

    const usageSummary = {
      plan,
      limits,
      currentUsage,
      remaining
    }

    return NextResponse.json({
      usageSummary,
      userSettings
    })
  } catch (error) {
    console.error('Error fetching subscription data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, planType, stripeSubscriptionId, stripeCustomerId } = body

    switch (action) {
      case 'create_free':
        await subscriptionService.createFreeSubscription(user.id)
        break
      
      case 'upgrade':
        if (!planType) {
          return NextResponse.json({ error: 'Plan type is required' }, { status: 400 })
        }
        await subscriptionService.upgradeSubscription(
          user.id, 
          planType, 
          stripeSubscriptionId, 
          stripeCustomerId
        )
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Return updated data
    const usageSummary = await subscriptionService.getUsageSummary(user.id)
    const userSettings = await subscriptionService.getUserSettings(user.id)

    return NextResponse.json({
      success: true,
      usageSummary,
      userSettings
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 