'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, Crown, CheckCircle, ArrowUpRight } from 'lucide-react'
import { subscriptionClientService } from '@/lib/subscription-client'

interface PaymentHandlerProps {
  currentPlan: 'free' | 'professional' | 'enterprise'
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function PaymentHandler({ currentPlan, onSuccess, onError }: PaymentHandlerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (planType: 'professional' | 'enterprise') => {
    setLoading(planType)
    try {
      const { url } = await subscriptionClientService.createCheckoutSession(planType)
      window.location.href = url
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to create checkout session')
    } finally {
      setLoading(null)
    }
  }

  const handleBillingPortal = async () => {
    setLoading('billing')
    try {
      const { url } = await subscriptionClientService.createBillingPortalSession()
      window.location.href = url
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to open billing portal')
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      type: 'professional' as const,
      name: 'Professional',
      price: '$24',
      period: '/month',
      features: [
        'Unlimited work orders',
        'Unlimited team members',
        'Advanced analytics',
        'QuickBooks integration (Coming Soon)',
        'Custom branding',
        'Advanced reporting',
        'Priority support'
      ],
      popular: false
    },
    {
      type: 'enterprise' as const,
      name: 'Enterprise',
      price: '$59',
      period: '/month',
      features: [
        'Everything in Professional',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
        'White-label options',
        'Advanced automation',
        'Multi-location support'
      ],
      popular: true
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Choose the plan that best fits your business needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.type} 
            className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                {plan.name}
              </CardTitle>
              <CardDescription>
                Perfect for {plan.type === 'professional' ? 'growing businesses' : 'large organizations'}
              </CardDescription>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {currentPlan === plan.type ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  onClick={() => handleUpgrade(plan.type)}
                  disabled={loading === plan.type}
                  className="w-full"
                >
                  {loading === plan.type ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Upgrade to {plan.name}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {currentPlan !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Management
            </CardTitle>
            <CardDescription>
              Manage your subscription, payment methods, and billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleBillingPortal}
              disabled={loading === 'billing'}
              variant="outline"
              className="w-full"
            >
              {loading === 'billing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Billing
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include a 14-day free trial. Cancel anytime.</p>
        <p className="mt-1">
          Need help? Contact our support team at{' '}
          <a href="mailto:support@dotorder.app" className="text-blue-500 hover:underline">
            support@dotorder.app
          </a>
        </p>
      </div>
    </div>
  )
} 