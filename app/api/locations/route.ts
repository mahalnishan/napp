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

    // Check if user has multi-location feature
    const hasMultiLocation = await subscriptionService.hasFeature(user.id, 'multiLocation')
    if (!hasMultiLocation) {
      return NextResponse.json({ error: 'Multi-location feature not available on your plan' }, { status: 403 })
    }

    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
    }

    return NextResponse.json({ locations })
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

    // Check if user has multi-location feature
    const hasMultiLocation = await subscriptionService.hasFeature(user.id, 'multiLocation')
    if (!hasMultiLocation) {
      return NextResponse.json({ error: 'Multi-location feature not available on your plan' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, city, state, postal_code, country, phone, email, is_default } = body

    if (!name) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('locations')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
    }

    const { data: location, error } = await supabase
      .from('locations')
      .insert({
        user_id: user.id,
        name,
        address,
        city,
        state,
        postal_code,
        country: country || 'US',
        phone,
        email,
        is_default: is_default || false,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
    }

    return NextResponse.json({ location })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 