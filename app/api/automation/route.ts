import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subscriptionService } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has advanced automation feature
    const hasAutomation = await subscriptionService.hasFeature(user.id, 'advancedAutomation')
    if (!hasAutomation) {
      return NextResponse.json({ error: 'Advanced automation feature not available on your plan' }, { status: 403 })
    }

    const { data: automationRules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 })
    }

    return NextResponse.json({ automationRules })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has advanced automation feature
    const hasAutomation = await subscriptionService.hasFeature(user.id, 'advancedAutomation')
    if (!hasAutomation) {
      return NextResponse.json({ error: 'Advanced automation feature not available on your plan' }, { status: 403 })
    }

    const body = await request.json()
    const { name, trigger_type, conditions, actions } = body

    if (!name || !trigger_type || !actions) {
      return NextResponse.json({ error: 'Name, trigger type, and actions are required' }, { status: 400 })
    }

    const { data: automationRule, error } = await supabase
      .from('automation_rules')
      .insert({
        user_id: user.id,
        name,
        trigger_type,
        conditions: conditions || null,
        actions,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create automation rule' }, { status: 500 })
    }

    return NextResponse.json({ automationRule })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 