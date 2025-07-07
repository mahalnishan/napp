'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Filter,
  X,
  RefreshCw
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

const calculateMetrics = (orders: any[], filters: any) => {
  const now = new Date()
  
  // Apply date filters
  let filteredOrders = [...orders]
  
  if (filters.dateRange !== 'all') {
    const startDate = new Date()
    switch (filters.dateRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '6m':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'custom':
        if (filters.startDate && filters.endDate) {
          const customStart = new Date(filters.startDate)
          const customEnd = new Date(filters.endDate)
          customEnd.setHours(23, 59, 59, 999)
          filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.created_at)
            return orderDate >= customStart && orderDate <= customEnd
          })
        }
        break
    }
    
    if (filters.dateRange !== 'custom') {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_at) >= startDate
      )
    }
  }
  
  // Apply status filter
  if (filters.status !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === filters.status)
  }
  
  // Apply payment status filter
  if (filters.paymentStatus !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.order_payment_status === filters.paymentStatus)
  }
  
  // Apply client filter
  if (filters.clientId !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.client_id === filters.clientId)
  }
  
  // Apply client type filter
  if (filters.clientType !== 'all') {
    filteredOrders = filteredOrders.filter(order => 
      (order.client as any)?.client_type === filters.clientType
    )
  }
  
  // Apply minimum amount filter
  if (filters.minAmount) {
    filteredOrders = filteredOrders.filter(order => 
      (order.order_amount || 0) >= parseFloat(filters.minAmount)
    )
  }
  
  // Apply maximum amount filter
  if (filters.maxAmount) {
    filteredOrders = filteredOrders.filter(order => 
      (order.order_amount || 0) <= parseFloat(filters.maxAmount)
    )
  }

  // Calculate comparison periods based on selected date range
  let comparisonStartDate = new Date()
  let comparisonEndDate = new Date()
  
  if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
    const customStart = new Date(filters.startDate)
    const customEnd = new Date(filters.endDate)
    const duration = customEnd.getTime() - customStart.getTime()
    
    comparisonEndDate = new Date(customStart)
    comparisonStartDate = new Date(customStart.getTime() - duration)
  } else {
    switch (filters.dateRange) {
      case '7d':
        comparisonEndDate.setDate(now.getDate() - 7)
        comparisonStartDate.setDate(now.getDate() - 14)
        break
      case '30d':
        comparisonEndDate.setDate(now.getDate() - 30)
        comparisonStartDate.setDate(now.getDate() - 60)
        break
      case '90d':
        comparisonEndDate.setDate(now.getDate() - 90)
        comparisonStartDate.setDate(now.getDate() - 180)
        break
      case '6m':
        comparisonEndDate.setMonth(now.getMonth() - 6)
        comparisonStartDate.setMonth(now.getMonth() - 12)
        break
      case '1y':
        comparisonEndDate.setFullYear(now.getFullYear() - 1)
        comparisonStartDate.setFullYear(now.getFullYear() - 2)
        break
      default:
        comparisonEndDate.setDate(now.getDate() - 30)
        comparisonStartDate.setDate(now.getDate() - 60)
    }
  }
  
  // Get comparison period orders
  const comparisonOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at)
    return orderDate >= comparisonStartDate && orderDate <= comparisonEndDate
  })

  // Revenue calculations
  const currentRevenue = filteredOrders.reduce((sum, order) => sum + (order.order_amount || 0), 0)
  const comparisonRevenue = comparisonOrders.reduce((sum, order) => sum + (order.order_amount || 0), 0)
  const totalRevenue = orders.reduce((sum, order) => sum + (order.order_amount || 0), 0)

  // Order counts
  const currentCount = filteredOrders.length
  const comparisonCount = comparisonOrders.length
  const totalOrders = orders.length

  // Status breakdown
  const statusBreakdown = filteredOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Payment status breakdown
  const paymentBreakdown = filteredOrders.reduce((acc, order) => {
    acc[order.order_payment_status] = (acc[order.order_payment_status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Top clients by revenue
  const clientRevenue = filteredOrders.reduce((acc, order) => {
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
  const serviceUsage = filteredOrders.reduce((acc, order) => {
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

  // Monthly revenue data for chart (based on filtered data)
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    
    const monthOrders = filteredOrders.filter(order => {
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
    currentRevenue,
    comparisonRevenue,
    totalRevenue,
    currentCount,
    comparisonCount,
    totalOrders,
    statusBreakdown,
    paymentBreakdown,
    topClients,
    topServices,
    monthlyRevenue,
    filteredOrders,
    revenueChange: comparisonRevenue > 0 ? ((currentRevenue - comparisonRevenue) / comparisonRevenue) * 100 : 0,
    orderChange: comparisonCount > 0 ? ((currentCount - comparisonCount) / comparisonCount) * 100 : 0
  }
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [rawData, setRawData] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState({
    dateRange: '30d',
    status: 'all',
    paymentStatus: 'all',
    clientId: 'all',
    clientType: 'all',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          return
        }

        const { orders, clients: clientsData, services: servicesData } = await getAnalyticsData(user.id)
        setRawData({ orders, clients: clientsData, services: servicesData })
        setClients(clientsData)
        
        const metricsData = calculateMetrics(orders, filters)
        setMetrics(metricsData)
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Recalculate metrics when filters change
  useEffect(() => {
    if (rawData) {
      const metricsData = calculateMetrics(rawData.orders, filters)
      setMetrics(metricsData)
    }
  }, [filters, rawData])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      dateRange: '30d',
      status: 'all',
      paymentStatus: 'all',
      clientId: 'all',
      clientType: 'all',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: ''
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status !== 'all') count++
    if (filters.paymentStatus !== 'all') count++
    if (filters.clientId !== 'all') count++
    if (filters.clientType !== 'all') count++
    if (filters.minAmount) count++
    if (filters.maxAmount) count++
    if (filters.startDate || filters.endDate) count++
    return count
  }

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
      title: 'Filtered Revenue',
      value: formatCurrency(metrics.currentRevenue),
      change: metrics.revenueChange,
      changeLabel: 'vs previous period',
      icon: DollarSign,
      description: `Revenue for selected period (${metrics.currentCount} orders)`
    },
    {
      title: 'Filtered Orders',
      value: metrics.currentCount.toString(),
      change: metrics.orderChange,
      changeLabel: 'vs previous period',
      icon: BarChart3,
      description: `Orders for selected period`
    },
    {
      title: 'Active Clients',
      value: metrics.topClients.length.toString(),
      icon: Users,
      description: 'Clients with orders in period'
    },
    {
      title: 'Services Used',
      value: metrics.topServices.length.toString(),
      icon: Package,
      description: 'Services used in period'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your performance and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>
          {getActiveFiltersCount() > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filter Analytics Data</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Filter your analytics data to focus on specific time periods, statuses, clients, and amounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <Select value={filters.paymentStatus} onValueChange={(value) => handleFilterChange('paymentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Statuses</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Pending Invoice">Pending Invoice</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Client Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <Select value={filters.clientId} onValueChange={(value) => handleFilterChange('clientId', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Type
                </label>
                <Select value={filters.clientType} onValueChange={(value) => handleFilterChange('clientType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Company">Company</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Contractor">Contractor</SelectItem>
                    <SelectItem value="Residential">Residential</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Government">Government</SelectItem>
                    <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Amount Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Amount
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                />
              </div>

              {/* Max Amount Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Amount
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                />
              </div>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Active Filters Summary */}
            {getActiveFiltersCount() > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Active Filters:</strong> {getActiveFiltersCount()} filter(s) applied
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.status !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Status: {filters.status}
                    </span>
                  )}
                  {filters.paymentStatus !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Payment: {filters.paymentStatus}
                    </span>
                  )}
                  {filters.clientId !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Client: {clients.find(c => c.id === filters.clientId)?.name}
                    </span>
                  )}
                  {filters.clientType !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Type: {filters.clientType}
                    </span>
                  )}
                  {filters.minAmount && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Min: ${filters.minAmount}
                    </span>
                  )}
                  {filters.maxAmount && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Max: ${filters.maxAmount}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              {metrics.filteredOrders?.slice(0, 5).map((order: any) => (
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