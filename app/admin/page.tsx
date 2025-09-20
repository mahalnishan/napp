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
  Clock,
  Shield,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface SystemStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalClients: number
  totalServices: number
}

interface RecentActivity {
  id: string
  description: string
  timestamp: string
  user_email?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalClients: 0,
    totalServices: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setRefreshing(true)
      const supabase = createClient()
      
      // Simple, reliable data fetching
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })

      const { data: ordersData, error: ordersError } = await supabase
        .from('work_orders')
        .select(`
          id, 
          title, 
          order_amount, 
          created_at,
          user:users(email)
        `)
        .order('created_at', { ascending: false })

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })

      // Handle errors gracefully
      if (usersError) console.error('Users error:', usersError.message)
      if (ordersError) console.error('Orders error:', ordersError.message)
      if (clientsError) console.error('Clients error:', clientsError.message)
      if (servicesError) console.error('Services error:', servicesError.message)

      // Calculate stats from actual data
      const totalUsers = usersData?.length || 0
      const totalOrders = ordersData?.length || 0
      const totalClients = clientsData?.length || 0
      const totalServices = servicesData?.length || 0
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.order_amount || 0), 0) || 0

      setStats({
        totalUsers,
        totalOrders,
        totalRevenue,
        totalClients,
        totalServices
      })

      // Recent activity from recent orders
      const recentOrders = ordersData?.slice(0, 5) || []
      const processedActivity = recentOrders.map(order => ({
        id: order.id,
        description: `Order: ${order.title || 'Untitled'}`,
        timestamp: order.created_at,
        user_email: (order.user as any)?.email
      }))

      setRecentActivity(processedActivity)

    } catch (error) {
      console.error('Error fetching admin data:', error)
      setStats({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalClients: 0,
        totalServices: 0
      })
      setRecentActivity([])
    } finally {
      setLoading(false)
      setRefreshing(false)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAdminData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
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
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Work orders created
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
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Client accounts
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
              Available services
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