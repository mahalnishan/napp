'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  Wrench, 
  DollarSign,
  RefreshCw,
  Clock
} from 'lucide-react'

interface SimpleAnalytics {
  totalUsers: number
  totalOrders: number
  totalClients: number
  totalServices: number
  totalRevenue: number
  recentOrders: Array<{
    id: string
    title: string
    amount: number
    created_at: string
    user_email?: string
  }>
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SimpleAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const supabase = createClient()
      
      // Simple data fetching
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id')

      const { data: ordersData, error: ordersError } = await supabase
        .from('work_orders')
        .select('id, title, order_amount, created_at, user:users(email)')
        .order('created_at', { ascending: false })

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id')

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id')

      // Handle errors gracefully
      if (usersError) console.error('Users error:', usersError.message)
      if (ordersError) console.error('Orders error:', ordersError.message)
      if (clientsError) console.error('Clients error:', clientsError.message)
      if (servicesError) console.error('Services error:', servicesError.message)

      // Calculate simple analytics
      const totalUsers = usersData?.length || 0
      const totalOrders = ordersData?.length || 0
      const totalClients = clientsData?.length || 0
      const totalServices = servicesData?.length || 0
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.order_amount || 0), 0) || 0

      // Recent orders
      const recentOrders = ordersData?.slice(0, 10).map(order => ({
        id: order.id,
        title: order.title || 'Untitled Order',
        amount: order.order_amount || 0,
        created_at: order.created_at,
        user_email: order.user?.email
      })) || []

      setAnalytics({
        totalUsers,
        totalOrders,
        totalClients,
        totalServices,
        totalRevenue,
        recentOrders
      })

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">System analytics and insights</p>
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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">System analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Work orders created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              From all orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">
              Client accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Orders
          </CardTitle>
          <CardDescription>Latest work orders created</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics?.recentOrders && analytics.recentOrders.length > 0 ? (
              analytics.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{order.title}</p>
                    <p className="text-sm text-gray-500">
                      {order.user_email && `${order.user_email} • `}
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.amount)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No recent orders</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}