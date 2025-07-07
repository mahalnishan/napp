import { NextRequest, NextResponse } from 'next/server'
import { stripe, constructWebhookEvent } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { subscriptionService } from '@/lib/subscription'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  const customerId = subscription.customer as string
  const planType = subscription.metadata.planType as 'professional' | 'enterprise'

  // Find user by Stripe customer ID
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (existingSubscription) {
    // Update existing subscription
    await supabase
      .from('subscriptions')
      .update({
        plan_type: planType,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', existingSubscription.user_id)
  } else {
    // Create new subscription (this should rarely happen)
    console.warn('No existing subscription found for customer:', customerId)
  }

  // Update user settings based on plan
  if (existingSubscription) {
    await subscriptionService.upgradeSubscription(
      existingSubscription.user_id,
      planType,
      subscription.id,
      customerId
    )
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  const customerId = subscription.customer as string
  const planType = subscription.metadata.planType as 'professional' | 'enterprise'

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .update({
      plan_type: planType,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  // If subscription was reactivated, update user settings
  if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (sub) {
      await subscriptionService.upgradeSubscription(
        sub.user_id,
        planType,
        subscription.id,
        customerId
      )
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  // Downgrade to free plan
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  // Create new free subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (sub) {
    await subscriptionService.createFreeSubscription(sub.user_id)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  if (invoice.subscription) {
    // Update subscription status to active
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription as string)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  if (invoice.subscription) {
    // Update subscription status to past_due
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription as string)
  }
}

async function handleCustomerCreated(customer: Stripe.Customer, supabase: any) {
  // This is mainly for logging purposes
  console.log('New Stripe customer created:', customer.id, customer.email)
} 