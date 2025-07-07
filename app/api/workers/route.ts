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

    const { data: workers, error } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 })
    }

    return NextResponse.json({ workers })
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

    const body = await request.json()
    const { name, email, phone } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Check if user can add team member (usage limits)
    const canAddTeamMember = await subscriptionService.canAddTeamMember(user.id)
    if (!canAddTeamMember) {
      return NextResponse.json(
        { error: 'Team member limit reached. Please upgrade your plan to add more team members.' },
        { status: 403 }
      )
    }

    const { data: worker, error } = await supabase
      .from('workers')
      .insert({
        user_id: user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 })
    }

    return NextResponse.json({ worker })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 