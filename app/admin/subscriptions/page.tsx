'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  CreditCard, 
  Users, 
  DollarSign, 
  TrendingUp,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'

interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  plan: 'free' | 'professional' | 'enterprise'
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
  user?: {
    name: string
    email: string
  }
}

interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  monthlyRevenue: number
  churnRate: number
  growthRate: number
  planBreakdown: {
    free: number
    professional: number
    enterprise: number
  }
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchSubscriptions()
    fetchStats()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to fetch subscriptions'
      })
    }
  }

  const fetchStats = async () => {
    try {
      const supabase = createClient()
      
      // Get subscription counts
      const { data: allSubs } = await supabase
        .from('subscriptions')
        .select('plan, status, created_at')

      if (allSubs) {
        const totalSubscriptions = allSubs.length
        const activeSubscriptions = allSubs.filter(sub => sub.status === 'active').length
        
        // Calculate plan breakdown
        const planBreakdown = {
          free: allSubs.filter(sub => sub.plan === 'free').length,
          professional: allSubs.filter(sub => sub.plan === 'professional').length,
          enterprise: allSubs.filter(sub => sub.plan === 'enterprise').length
        }

        // Calculate monthly revenue
        const monthlyRevenue = planBreakdown.professional * 24 + planBreakdown.enterprise * 59

        // Calculate growth rate (simplified)
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const thisMonthSubs = allSubs.filter(sub => {
          const subDate = new Date(sub.created_at)
          return subDate.getMonth() === currentMonth && subDate.getFullYear() === currentYear
        }).length

        const lastMonthSubs = allSubs.filter(sub => {
          const subDate = new Date(sub.created_at)
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
          return subDate.getMonth() === lastMonth && subDate.getFullYear() === lastMonthYear
        }).length

        const growthRate = lastMonthSubs > 0 ? ((thisMonthSubs - lastMonthSubs) / lastMonthSubs) * 100 : 0

        setStats({
          totalSubscriptions,
          activeSubscriptions,
          monthlyRevenue,
          churnRate: 2.5, // Mock churn rate
          growthRate,
          planBreakdown
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscriptionAction = async (subscriptionId: string, action: string) => {
    try {
      const supabase = createClient()
      
      switch (action) {
        case 'cancel':
          // In a real app, you'd call Stripe API to cancel the subscription
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('id', subscriptionId)
          
          toast.success({
            title: 'Success',
            description: 'Subscription canceled successfully'
          })
          break
        
        case 'reactivate':
          // In a real app, you'd call Stripe API to reactivate
          await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('id', subscriptionId)
          
          toast.success({
            title: 'Success',
            description: 'Subscription reactivated successfully'
          })
          break
        
        case 'delete':
          if (confirm('Are you sure you want to delete this subscription? This action cannot be undone.')) {
            await supabase
              .from('subscriptions')
              .delete()
              .eq('id', subscriptionId)
            
            toast.success({
              title: 'Success',
              description: 'Subscription deleted successfully'
            })
          }
          break
      }
      
      fetchSubscriptions()
      fetchStats()
    } catch (error) {
      console.error('Error performing subscription action:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to perform action'
      })
    }
  }

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.stripe_subscription_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter
    const matchesPlan = planFilter === 'all' || subscription.plan === planFilter
    
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800' },
      canceled: { label: 'Canceled', className: 'bg-red-100 text-red-800' },
      incomplete: { label: 'Incomplete', className: 'bg-yellow-100 text-yellow-800' },
      past_due: { label: 'Past Due', className: 'bg-orange-100 text-orange-800' },
      trialing: { label: 'Trialing', className: 'bg-blue-100 text-blue-800' },
      unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.incomplete
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      free: { label: 'Free', className: 'bg-gray-100 text-gray-800' },
      professional: { label: 'Professional', className: 'bg-blue-100 text-blue-800' },
      enterprise: { label: 'Enterprise', className: 'bg-purple-100 text-purple-800' }
    }
    
    const config = planConfig[plan as keyof typeof planConfig] || planConfig.free
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage user subscriptions and billing</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage user subscriptions and billing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSubscriptions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeSubscriptions || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {stats?.growthRate ? stats.growthRate.toFixed(1) : '0.0'}%
              {stats?.growthRate && stats.growthRate > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 ml-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 ml-1" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.churnRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Monthly churn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
          <CardDescription>Breakdown of users by subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats?.planBreakdown.free || 0}</div>
              <div className="text-sm text-gray-600">Free Plan</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.planBreakdown.professional || 0}</div>
              <div className="text-sm text-blue-600">Professional</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats?.planBreakdown.enterprise || 0}</div>
              <div className="text-sm text-purple-600">Enterprise</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Manage and monitor all user subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subscriptions Table */}
          <div className="space-y-4">
            {filteredSubscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold">{subscription.user?.name || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-500">{subscription.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(subscription.status)}
                      {getPlanBadge(subscription.plan)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Subscription
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {subscription.status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => handleSubscriptionAction(subscription.id, 'cancel')}
                              className="text-orange-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleSubscriptionAction(subscription.id, 'reactivate')}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleSubscriptionAction(subscription.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Subscription ID:</span>
                      <p className="font-mono text-xs">{subscription.stripe_subscription_id}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Period:</span>
                      <p>{formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <p>{formatDate(subscription.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Monthly Value:</span>
                      <p className="font-semibold">
                        {subscription.plan === 'professional' ? '$24' : 
                         subscription.plan === 'enterprise' ? '$59' : '$0'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No subscriptions found</h3>
              <p className="text-gray-500">No subscriptions match your current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 