import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    // Test Stripe connection by listing customers
    const customers = await stripe.customers.list({ limit: 1 })
    
    return NextResponse.json({
      success: true,
      message: 'Stripe is configured correctly',
      plans: {
        professional: {
          priceId: STRIPE_PLANS.professional.priceId,
          amount: STRIPE_PLANS.professional.amount,
          name: STRIPE_PLANS.professional.name
        },
        enterprise: {
          priceId: STRIPE_PLANS.enterprise.priceId,
          amount: STRIPE_PLANS.enterprise.amount,
          name: STRIPE_PLANS.enterprise.name
        }
      },
      customerCount: customers.data.length
    })
  } catch (error) {
    console.error('Stripe test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Stripe configuration issue detected'
    }, { status: 500 })
  }
} 