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
  Activity,
  Database,
  Zap,
  Server,
  DollarSign,
  Clock,
  Shield,
  BarChart3
} from 'lucide-react'

interface SystemStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  activeSubscriptions: number
  totalClients: number
  totalServices: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  user_email?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalClients: 0,
    totalServices: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const supabase = createClient()
      
      // Fetch system statistics with proper error handling
      const [
        { count: usersCount },
        { count: ordersCount },
        { count: subscriptionsCount },
        { count: clientsCount },
        { count: servicesCount },
        { data: ordersData },
        { data: recentOrdersData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).then(res => ({ count: res.count || 0 })),
        supabase.from('work_orders').select('*', { count: 'exact', head: true }).then(res => ({ count: res.count || 0 })),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).then(res => ({ count: res.count || 0 })),
        supabase.from('clients').select('*', { count: 'exact', head: true }).then(res => ({ count: res.count || 0 })),
        supabase.from('services').select('*', { count: 'exact', head: true }).then(res => ({ count: res.count || 0 })),
        supabase.from('work_orders').select('order_amount').then(res => ({ data: res.data || [] })),
        supabase.from('work_orders').select('*, user:users(email)').order('created_at', { ascending: false }).limit(5).then(res => ({ data: res.data || [] }))
      ])

      // Calculate revenue from actual order data
      const revenue = ordersData?.reduce((acc, order) => acc + (order.order_amount || 0), 0) || 0

      setStats({
        totalUsers: usersCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue: revenue,
        activeSubscriptions: subscriptionsCount || 0,
        totalClients: clientsCount || 0,
        totalServices: servicesCount || 0
      })

      // Process recent activity from actual data
      const processedRecentActivity = recentOrdersData?.map((order, index) => ({
        id: order.id,
        type: 'order_created',
        description: `New order created: ${order.title || 'Untitled Order'}`,
        timestamp: order.created_at,
        user_email: order.user?.email
      })) || []

      setRecentActivity(processedRecentActivity)

    } catch (error) {
      console.error('Error fetching admin data:', error)
      // Set default values on error
      setStats({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        activeSubscriptions: 0,
        totalClients: 0,
        totalServices: 0
      })
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }


  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Activity className="h-3 w-3 mr-1" />
            System Active
          </Badge>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Reports
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
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              All clients in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              All services available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user_email && `${activity.user_email} • `}
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col" onClick={() => window.location.href = '/admin/users'}>
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col" onClick={() => window.location.href = '/admin/orders'}>
              <FileText className="h-6 w-6 mb-2" />
              <span>View Orders</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col" onClick={() => window.location.href = '/admin/clients'}>
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Clients</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col" onClick={() => window.location.href = '/admin/services'}>
              <Wrench className="h-6 w-6 mb-2" />
              <span>Manage Services</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 