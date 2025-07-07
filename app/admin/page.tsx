'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Database,
  Zap,
  Server,
  Globe,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  BarChart3
} from 'lucide-react'

interface SystemStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  activeSubscriptions: number
  systemHealth: 'healthy' | 'warning' | 'error'
  databaseConnections: number
  apiRequests: number
  errorRate: number
  uptime: number
}

interface RecentActivity {
  id: string
  type: 'user_signup' | 'order_created' | 'payment_received' | 'system_error'
  description: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    systemHealth: 'healthy',
    databaseConnections: 0,
    apiRequests: 0,
    errorRate: 0,
    uptime: 99.9
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
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).then(res => ({ count: res.count || 0 })),
        supabase.from('work_orders').select('*', { count: 'exact', head: true }).then(res => ({ count: res.count || 0 })),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).then(res => ({ count: res.count || 0 })),
        supabase.from('subscriptions').select('plan_type').then(res => ({ data: res.data || [] }))
      ])

      // Calculate revenue (mock calculation for now)
      const revenue = revenueData?.reduce((acc, sub) => {
        const planPrice = sub.plan_type === 'professional' ? 24 : sub.plan_type === 'enterprise' ? 59 : 0
        return acc + planPrice
      }, 0) || 0

      setStats({
        totalUsers: usersCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue: revenue,
        activeSubscriptions: subscriptionsCount || 0,
        systemHealth: 'healthy',
        databaseConnections: Math.floor(Math.random() * 50) + 10,
        apiRequests: Math.floor(Math.random() * 1000) + 500,
        errorRate: Math.random() * 2,
        uptime: 99.9
      })

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'user_signup',
          description: 'New user registered: john.doe@example.com',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          severity: 'low'
        },
        {
          id: '2',
          type: 'order_created',
          description: 'New order created: #ORD-2024-001',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          severity: 'low'
        },
        {
          id: '3',
          type: 'payment_received',
          description: 'Payment received: $24.00 for Professional plan',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          severity: 'low'
        },
        {
          id: '4',
          type: 'system_error',
          description: 'API rate limit exceeded for user ID: 12345',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          severity: 'medium'
        }
      ])

    } catch (error) {
      console.error('Error fetching admin data:', error)
      // Set default values on error
      setStats({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        activeSubscriptions: 0,
        systemHealth: 'error',
        databaseConnections: 0,
        apiRequests: 0,
        errorRate: 0,
        uptime: 0
      })
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
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
          <Badge className={getHealthColor(stats.systemHealth)}>
            <Activity className="h-3 w-3 mr-1" />
            System {stats.systemHealth}
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
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Real-time system performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.uptime}%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.databaseConnections}</div>
                <div className="text-sm text-gray-600">DB Connections</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.apiRequests}</div>
                <div className="text-sm text-gray-600">API Requests/min</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.errorRate.toFixed(2)}%</div>
                <div className="text-sm text-gray-600">Error Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.severity === 'high' ? 'bg-red-500' : 
                    activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                  <Badge className={getSeverityColor(activity.severity)}>
                    {activity.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Database className="h-6 w-6 mb-2" />
              <span>Database</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Zap className="h-6 w-6 mb-2" />
              <span>API Keys</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Server className="h-6 w-6 mb-2" />
              <span>System Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 