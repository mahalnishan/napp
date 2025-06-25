'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AnalyticsChart } from '@/components/analytics-chart'
import { RevenueChart } from '@/components/revenue-chart'
import { TopClientsTable } from '@/components/top-clients-table'
import { TopServicesTable } from '@/components/top-services-table'

async function getAnalyticsData(userId: string) {
  const supabase = createClient()
  
  // Get all orders for the user
  const { data: orders } = await supabase
    .from('work_orders')
    .select(`
      *,
      client:clients(*),
      services:work_order_services(
        *,
        service:services(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Get clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)

  // Get services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', userId)

  return { orders: orders || [], clients: clients || [], services: services || [] }
}

function calculateMetrics(orders: any[], clients: any[], services: any[]) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Current month orders
  const currentMonthOrders = orders.filter(order => 
    new Date(order.created_at) >= thirtyDaysAgo
  )
  
  // Previous month orders
  const previousMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at)
    return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo
  })

  // Revenue calculations
  const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.order_amount || 0), 0)
  const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + (order.order_amount || 0), 0)
  const totalRevenue = orders.reduce((sum, order) => sum + (order.order_amount || 0), 0)

  // Order counts
  const currentMonthCount = currentMonthOrders.length
  const previousMonthCount = previousMonthOrders.length
  const totalOrders = orders.length

  // Status breakdown
  const statusBreakdown = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Payment status breakdown
  const paymentBreakdown = orders.reduce((acc, order) => {
    acc[order.order_payment_status] = (acc[order.order_payment_status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Top clients by revenue
  const clientRevenue = orders.reduce((acc, order) => {
    const clientId = order.client_id
    const clientName = (order.client as any)?.name || 'Unknown'
    if (!acc[clientId]) {
      acc[clientId] = { name: clientName, revenue: 0, orders: 0 }
    }
    acc[clientId].revenue += order.order_amount || 0
    acc[clientId].orders += 1
    return acc
  }, {} as Record<string, { name: string; revenue: number; orders: number }>)

  const topClients = Object.values(clientRevenue)
    .sort((a, b) => (b as { revenue: number }).revenue - (a as { revenue: number }).revenue)
    .slice(0, 5) as { name: string; revenue: number; orders: number }[]

  // Top services by usage
  const serviceUsage = orders.reduce((acc, order) => {
    order.services?.forEach((serviceOrder: any) => {
      const serviceId = serviceOrder.service_id
      const serviceName = serviceOrder.service?.name || 'Unknown'
      if (!acc[serviceId]) {
        acc[serviceId] = { name: serviceName, usage: 0, revenue: 0 }
      }
      acc[serviceId].usage += serviceOrder.quantity || 0
      acc[serviceId].revenue += (serviceOrder.service?.price || 0) * (serviceOrder.quantity || 0)
    })
    return acc
  }, {} as Record<string, { name: string; usage: number; revenue: number }>)

  const topServices = Object.values(serviceUsage)
    .sort((a, b) => (b as { usage: number }).usage - (a as { usage: number }).usage)
    .slice(0, 5) as { name: string; usage: number; revenue: number }[]

  // Monthly revenue data for chart
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= monthStart && orderDate <= monthEnd
    })
    
    const revenue = monthOrders.reduce((sum, order) => sum + (order.order_amount || 0), 0)
    
    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      revenue
    }
  }).reverse()

  return {
    currentMonthRevenue,
    previousMonthRevenue,
    totalRevenue,
    currentMonthCount,
    previousMonthCount,
    totalOrders,
    statusBreakdown,
    paymentBreakdown,
    topClients,
    topServices,
    monthlyRevenue,
    revenueChange: previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0,
    orderChange: previousMonthCount > 0 ? ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100 : 0
  }
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          return
        }

        const { orders, clients: clientsData, services: servicesData } = await getAnalyticsData(user.id)
        const metricsData = calculateMetrics(orders, clientsData, servicesData)
        
        setMetrics(metricsData)
        setClients(clientsData)
        setServices(servicesData)
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your performance and insights</p>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      change: metrics.revenueChange,
      changeLabel: 'vs last month',
      icon: DollarSign,
      description: 'All time earnings'
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders.toString(),
      change: metrics.orderChange,
      changeLabel: 'vs last month',
      icon: BarChart3,
      description: 'All orders created'
    },
    {
      title: 'Active Clients',
      value: clients.length.toString(),
      icon: Users,
      description: 'Total clients'
    },
    {
      title: 'Services',
      value: services.length.toString(),
      icon: Package,
      description: 'Available services'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Track your performance and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change !== undefined && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    {Math.abs(stat.change).toFixed(1)}% {stat.changeLabel}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the past 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={metrics.monthlyRevenue} />
          </CardContent>
        </Card>

        {/* Order Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Breakdown of orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={metrics.statusBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Revenue</CardTitle>
            <CardDescription>Your highest-earning clients</CardDescription>
          </CardHeader>
          <CardContent>
            <TopClientsTable clients={metrics.topClients} />
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Services</CardTitle>
            <CardDescription>Your most popular service offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <TopServicesTable services={metrics.topServices} />
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.paymentBreakdown).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{status}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.recentOrders?.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{(order.client as any)?.name || 'Unknown Client'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(order.order_amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Average Order Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.totalRevenue / Math.max(metrics.totalOrders, 1))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round((metrics.statusBreakdown['Completed'] || 0) / Math.max(metrics.totalOrders, 1) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 