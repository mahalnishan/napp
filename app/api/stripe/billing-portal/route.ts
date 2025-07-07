import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing information found' }, { status: 404 })
    }

    // Create billing portal session
    const session = await createBillingPortalSession(
      subscription.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 })
  }
} 