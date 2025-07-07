import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createStripeCustomer, createCheckoutSession, STRIPE_PLANS } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planType } = body

    if (!planType || !['professional', 'enterprise'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 })
    }

    // Get or create Stripe customer
    let stripeCustomerId: string
    let userName: string | undefined = undefined
    // Always fetch from users table
    const { data: profile } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()
    userName = typeof profile?.name === 'string' && profile.name.trim() !== '' ? profile.name : undefined

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await createStripeCustomer(user.email!, userName)
      stripeCustomerId = customer.id

      // Update subscription with Stripe customer ID
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', user.id)
    }

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId: plan.priceId,
      planType: planType as 'professional' | 'enterprise',
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?canceled=true`
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
} 