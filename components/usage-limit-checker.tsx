'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscriptionClientService } from '@/lib/subscription-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Crown, ArrowUpRight } from 'lucide-react'

interface UsageLimitCheckerProps {
  action: 'create_work_order' | 'add_team_member' | 'api_call'
  onAllowed: () => void
  onDenied?: () => void
  children?: React.ReactNode
}

export function UsageLimitChecker({ action, onAllowed, onDenied, children }: UsageLimitCheckerProps) {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [usageSummary, setUsageSummary] = useState<any>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    checkLimit()
  }, [action])

  const checkLimit = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const summary = await subscriptionClientService.getUsageSummary()
      setUsageSummary(summary)

      let isAllowed = false

      switch (action) {
        case 'create_work_order':
          isAllowed = await subscriptionClientService.canCreateWorkOrder()
          break
        case 'add_team_member':
          isAllowed = await subscriptionClientService.canAddTeamMember()
          break
        case 'api_call':
          // API calls are only available on paid plans
          isAllowed = summary.plan !== 'free'
          break
      }

      setAllowed(isAllowed)
      
      if (isAllowed) {
        onAllowed()
      } else {
        onDenied?.()
      }
    } catch (error) {
      console.error('Error checking usage limit:', error)
      setAllowed(false)
      onDenied?.()
    } finally {
      setLoading(false)
    }
  }

  const getActionText = () => {
    switch (action) {
      case 'create_work_order':
        return 'Create Work Order'
      case 'add_team_member':
        return 'Add Team Member'
      case 'api_call':
        return 'API Access'
      default:
        return 'Action'
    }
  }

  const getLimitText = () => {
    if (!usageSummary) return ''

    switch (action) {
      case 'create_work_order':
        const workOrderLimit = usageSummary.limits.workOrdersPerMonth
        return workOrderLimit === -1 ? 'Unlimited work orders' : `${workOrderLimit} work orders per month`
      case 'add_team_member':
        const teamLimit = usageSummary.limits.teamMembers
        return teamLimit === -1 ? 'Unlimited team members' : `${teamLimit} team members`
      case 'api_call':
        const apiLimit = usageSummary.limits.apiCallsPerMonth
        return apiLimit === -1 ? 'Unlimited API calls' : `${apiLimit} API calls per month`
      default:
        return ''
    }
  }

  const getCurrentUsage = () => {
    if (!usageSummary) return 0

    switch (action) {
      case 'create_work_order':
        return usageSummary.currentUsage.workOrders
      case 'add_team_member':
        return usageSummary.currentUsage.teamMembers
      case 'api_call':
        return usageSummary.currentUsage.apiCalls
      default:
        return 0
    }
  }

  const getRemaining = () => {
    if (!usageSummary) return null

    switch (action) {
      case 'create_work_order':
        return usageSummary.remaining.workOrders
      case 'add_team_member':
        return usageSummary.remaining.teamMembers
      case 'api_call':
        return usageSummary.remaining.apiCalls
      default:
        return null
    }
  }

  if (loading) {
    return <div className="animate-pulse">Checking limits...</div>
  }

  if (allowed) {
    return <>{children}</>
  }

  return (
    <>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Limit Reached
          </CardTitle>
          <CardDescription className="text-yellow-700">
            You've reached your plan limit for {getActionText().toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Plan</span>
              <Badge variant="outline" className="capitalize">
                {usageSummary?.plan}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Usage</span>
              <span className="text-sm text-muted-foreground">
                {getCurrentUsage()} / {getLimitText()}
              </span>
            </div>

            {getRemaining() !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Remaining</span>
                <span className="text-sm text-muted-foreground">
                  {getRemaining()} available
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {usageSummary?.plan === 'free' && (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Professional
                </Button>
              )}
              {usageSummary?.plan === 'professional' && (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Enterprise
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Upgrade Your Plan
              </CardTitle>
              <CardDescription>
                Get unlimited access to all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="mb-2">Upgrade to unlock:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Unlimited work orders</li>
                    <li>• Unlimited team members</li>
                    <li>• Advanced features</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      // Redirect to pricing page or checkout
                      window.location.href = '/#pricing'
                    }}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    View Plans
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUpgradeModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
} 