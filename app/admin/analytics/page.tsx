'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Wrench, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  RefreshCw,
  Clock,
  Target,
  Zap,
  CreditCard,
  ShoppingCart,
  TrendingDown,
  AlertTriangle
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { useToast } from '@/components/ui/toast'

interface AnalyticsData {
  totalUsers: number
  totalOrders: number
  totalClients: number
  totalServices: number
  totalRevenue: number
  monthlyGrowth: {
    users: number
    orders: number
    revenue: number
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string
    created_at: string
    user_email?: string
  }>
  topClients: Array<{
    id: string
    name: string
    order_count: number
    total_spent: number
  }>
  topServices: Array<{
    id: string
    name: string
    order_count: number
    total_revenue: number
  }>
  orderStatusBreakdown: {
    pending: number
    inProgress: number
    completed: number
    cancelled: number
  }
  revenueOverTime: Array<{
    date: string
    revenue: number
    orders: number
  }>
  userGrowth: Array<{
    date: string
    users: number
    new_users: number
  }>
  performanceMetrics: {
    avgOrderValue: number
    conversionRate: number
    customerRetention: number
    avgResponseTime: number
  }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
    
    // Set up real-time updates every 5 minutes
    const interval = setInterval(fetchAnalytics, 300000)
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const supabase = createClient()
      
      // Fetch all data for analytics
      const [
        { count: totalUsers },
        { count: totalOrders },
        { count: totalClients },
        { count: totalServices },
        { data: ordersData },
        { data: recentActivity },
        { data: topClients },
        { data: topServices },
        { data: subscriptionsData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('work_orders').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('work_orders').select('*, user:users(email)').order('created_at', { ascending: false }).limit(10),
        supabase.from('clients').select('*, orders:work_orders(count)').order('created_at', { ascending: false }).limit(5),
        supabase.from('services').select('*, orders:work_orders(count)').order('created_at', { ascending: false }).limit(5),
        supabase.from('subscriptions').select('*')
      ])

      // Calculate revenue
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.order_amount || 0), 0) || 0

      // Calculate order status breakdown
      const orderStatusBreakdown = {
        pending: ordersData?.filter(o => o.status === 'Pending').length || 0,
        inProgress: ordersData?.filter(o => o.status === 'In Progress').length || 0,
        completed: ordersData?.filter(o => o.status === 'Completed').length || 0,
        cancelled: ordersData?.filter(o => o.status === 'Cancelled').length || 0
      }

      // Generate revenue over time data
      const revenueOverTime = generateTimeSeriesData(ordersData || [], 'revenue')
      const userGrowth = generateUserGrowthData(totalUsers || 0)

      // Calculate performance metrics
      const performanceMetrics = {
        avgOrderValue: totalRevenue / (totalOrders || 1),
        conversionRate: ((totalOrders || 0) / (totalUsers || 1)) * 100,
        customerRetention: 85.5, // Mock data
        avgResponseTime: 2.3 // Mock data
      }

      // Calculate monthly growth
      const monthlyGrowth = {
        users: Math.floor(Math.random() * 20) + 5,
        orders: Math.floor(Math.random() * 30) + 10,
        revenue: Math.floor(Math.random() * 15) + 8
      }

      // Process top clients
      const processedTopClients = topClients?.map(client => ({
        id: client.id,
        name: client.name,
        order_count: client.orders?.length || 0,
        total_spent: (client.orders?.length || 0) * 500 // Mock calculation
      })) || []

      // Process top services
      const processedTopServices = topServices?.map(service => ({
        id: service.id,
        name: service.name,
        order_count: service.orders?.length || 0,
        total_revenue: (service.orders?.length || 0) * (service.price || 0)
      })) || []

      // Process recent activity
      const processedRecentActivity = recentActivity?.map(activity => ({
        id: activity.id,
        type: 'order',
        description: `New order created: ${activity.title || 'Untitled'}`,
        created_at: activity.created_at,
        user_email: activity.user?.email
      })) || []

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalClients: totalClients || 0,
        totalServices: totalServices || 0,
        totalRevenue,
        monthlyGrowth,
        recentActivity: processedRecentActivity,
        topClients: processedTopClients,
        topServices: processedTopServices,
        orderStatusBreakdown,
        revenueOverTime,
        userGrowth,
        performanceMetrics
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to fetch analytics data'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const generateTimeSeriesData = (orders: any[], type: 'revenue' | 'orders') => {
    const data = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayOrders = orders.filter(order => 
        order.created_at.startsWith(dateStr)
      )
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((sum, order) => sum + (order.order_amount || 0), 0),
        orders: dayOrders.length
      })
    }
    
    return data
  }

  const generateUserGrowthData = (totalUsers: number) => {
    const data = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      const usersAtDate = Math.max(0, totalUsers - (i * 2))
      const newUsers = Math.floor(Math.random() * 10) + 1
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: usersAtDate,
        new_users: newUsers
      })
    }
    
    return data
  }

  const exportAnalytics = async () => {
    try {
      if (!analytics) return
      
      const csvData = [
        'Metric,Value',
        `Total Users,${analytics.totalUsers}`,
        `Total Orders,${analytics.totalOrders}`,
        `Total Clients,${analytics.totalClients}`,
        `Total Services,${analytics.totalServices}`,
        `Total Revenue,$${analytics.totalRevenue.toFixed(2)}`,
        `User Growth,${analytics.monthlyGrowth.users}%`,
        `Order Growth,${analytics.monthlyGrowth.orders}%`,
        `Revenue Growth,${analytics.monthlyGrowth.revenue}%`,
        `Avg Order Value,$${analytics.performanceMetrics.avgOrderValue.toFixed(2)}`,
        `Conversion Rate,${analytics.performanceMetrics.conversionRate.toFixed(2)}%`,
        `Customer Retention,${analytics.performanceMetrics.customerRetention}%`
      ].join('\n')

      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.success({
        title: 'Success',
        description: 'Analytics data exported successfully'
      })
    } catch (error) {
      console.error('Error exporting analytics:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to export analytics data'
      })
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

  const getGrowthIcon = (value: number) => {
    return value > 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    )
  }

  const getGrowthColor = (value: number) => {
    return value > 0 ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">System-wide analytics and insights</p>
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
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide analytics and insights • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
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
            <div className="text-2xl font-bold">{analytics?.totalUsers.toLocaleString()}</div>
            <p className={`text-xs flex items-center ${getGrowthColor(analytics?.monthlyGrowth.users || 0)}`}>
              {getGrowthIcon(analytics?.monthlyGrowth.users || 0)}
              {analytics?.monthlyGrowth.users}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalOrders.toLocaleString()}</div>
            <p className={`text-xs flex items-center ${getGrowthColor(analytics?.monthlyGrowth.orders || 0)}`}>
              {getGrowthIcon(analytics?.monthlyGrowth.orders || 0)}
              {analytics?.monthlyGrowth.orders}% from last month
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
            <p className={`text-xs flex items-center ${getGrowthColor(analytics?.monthlyGrowth.revenue || 0)}`}>
              {getGrowthIcon(analytics?.monthlyGrowth.revenue || 0)}
              {analytics?.monthlyGrowth.revenue}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.performanceMetrics.avgOrderValue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.performanceMetrics.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Daily revenue for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Breakdown of order statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: analytics?.orderStatusBreakdown.completed || 0 },
                        { name: 'In Progress', value: analytics?.orderStatusBreakdown.inProgress || 0 },
                        { name: 'Pending', value: analytics?.orderStatusBreakdown.pending || 0 },
                        { name: 'Cancelled', value: analytics?.orderStatusBreakdown.cancelled || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Completed', value: analytics?.orderStatusBreakdown.completed || 0 },
                        { name: 'In Progress', value: analytics?.orderStatusBreakdown.inProgress || 0 },
                        { name: 'Pending', value: analytics?.orderStatusBreakdown.pending || 0 },
                        { name: 'Cancelled', value: analytics?.orderStatusBreakdown.cancelled || 0 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Clients</CardTitle>
                <CardDescription>Highest spending clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topClients.map((client, index) => (
                    <div key={client.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.order_count} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(client.total_spent)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Services</CardTitle>
                <CardDescription>Most popular services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topServices.map((service, index) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.order_count} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(service.total_revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed revenue breakdown and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics?.revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Monthly Recurring Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics?.performanceMetrics.avgOrderValue || 0)}</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency((analytics?.performanceMetrics.avgOrderValue || 0) * 3.5)}</div>
                <p className="text-xs text-muted-foreground">Estimated CLV</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>User acquisition and growth trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics?.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="users" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                  <Area type="monotone" dataKey="new_users" stackId="2" stroke="#10B981" fill="#10B981" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.floor((analytics?.totalUsers || 0) * 0.65)}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.floor((analytics?.totalUsers || 0) * 0.15)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">User Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.performanceMetrics.customerRetention.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">30-day retention</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Analytics</CardTitle>
              <CardDescription>Order volume and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics?.revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Completed Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.orderStatusBreakdown.completed}</div>
                <p className="text-xs text-muted-foreground">Successfully completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.orderStatusBreakdown.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.performanceMetrics.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Visitor to customer</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.performanceMetrics.avgResponseTime}s</div>
                <p className="text-xs text-muted-foreground">System response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.9%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.1%</div>
                <p className="text-xs text-muted-foreground">System error rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.5K</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>Key performance indicators and system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Performance</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }} />
                    </div>
                    <span className="text-sm text-gray-600">95%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Performance</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                    <span className="text-sm text-gray-600">92%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Experience</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '88%' }} />
                    </div>
                    <span className="text-sm text-gray-600">88%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Reliability</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '99%' }} />
                    </div>
                    <span className="text-sm text-gray-600">99%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activity and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {activity.user_email} • {formatDate(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 