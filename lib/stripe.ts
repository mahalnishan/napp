import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    })
  : null

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

// Plan configurations
export const STRIPE_PLANS = {
  professional: {
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    amount: 2400, // $24.00 in cents
    currency: 'usd',
    interval: 'month',
    name: 'Professional',
    features: [
      'Unlimited work orders',
      'Unlimited team members',
      'Advanced analytics',
      'QuickBooks integration',
      'Custom branding',
      'Advanced reporting',
      'Priority support'
    ]
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    amount: 5900, // $59.00 in cents
    currency: 'usd',
    interval: 'month',
    name: 'Enterprise',
    features: [
      'Everything in Professional',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'Advanced automation',
      'Multi-location support'
    ]
  }
}

// Create a Stripe customer
export async function createStripeCustomer(email: string, name?: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'effortless'
      }
    })
    return customer
  } catch (error) {
    throw error
  }
}

// Create a checkout session
export async function createCheckoutSession({
  customerId,
  priceId,
  planType,
  successUrl,
  cancelUrl
}: {
  customerId: string
  priceId: string
  planType: 'professional' | 'enterprise'
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        planType,
        source: 'effortless'
      },
      subscription_data: {
        metadata: {
          planType,
          source: 'effortless'
        }
      }
    })
    return session
  } catch (error) {
    throw error
  }
}

// Create a billing portal session
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    return session
  } catch (error) {
    throw error
  }
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'latest_invoice']
    })
    return subscription
  } catch (error) {
    throw error
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })
    return subscription
  } catch (error) {
    throw error
  }
}

// Reactivate subscription
export async function reactivateSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    })
    return subscription
  } catch (error) {
    throw error
  }
}

// Update subscription
export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    })
    
    return updatedSubscription
  } catch (error) {
    throw error
  }
}

// Verify webhook signature
export function constructWebhookEvent(payload: string, signature: string, secret: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret)
  } catch (error) {
    throw error
  }
} 