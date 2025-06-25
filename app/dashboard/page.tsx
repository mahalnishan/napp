'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, DollarSign, FileText, Users, Package, TrendingUp, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DashboardStats, WorkOrderWithDetails } from '@/lib/types'

async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = createClient()
  
  const [
    { count: totalOrders },
    { count: totalClients },
    { count: totalServices },
    { data: orders },
    { count: pendingOrders },
    { count: completedOrders }
  ] = await Promise.all([
    supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('work_orders').select('order_amount').eq('user_id', userId),
    supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['Pending', 'In Progress']),
    supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'Completed')
  ])

  const totalRevenue = orders?.reduce((sum, order) => sum + (order.order_amount || 0), 0) || 0

  return {
    totalOrders: totalOrders || 0,
    totalClients: totalClients || 0,
    totalServices: totalServices || 0,
    totalRevenue,
    pendingOrders: pendingOrders || 0,
    completedOrders: completedOrders || 0
  }
}

async function getRecentOrders(userId: string): Promise<WorkOrderWithDetails[]> {
  const supabase = createClient()
  
  const { data: orders } = await supabase
    .from('work_orders')
    .select(`
      *,
      client:clients(*),
      worker:workers(*),
      services:work_order_services(
        *,
        service:services(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  return orders || []
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState<WorkOrderWithDetails[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          return
        }

        const [statsData, ordersData] = await Promise.all([
          getDashboardStats(user.id),
          getRecentOrders(user.id)
        ])

        setStats(statsData)
        setRecentOrders(ordersData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your work orders.</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: 'All time earnings',
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: FileText,
      description: 'All orders created',
      trend: '+8.2%',
      trendUp: true
    },
    {
      title: 'Active Clients',
      value: stats.totalClients.toString(),
      icon: Users,
      description: 'Total clients',
      trend: '+5.1%',
      trendUp: true
    },
    {
      title: 'Services',
      value: stats.totalServices.toString(),
      icon: Package,
      description: 'Available services',
      trend: '+2.3%',
      trendUp: true
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your work orders.</p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button className="hover-lift">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className={`h-3 w-3 mr-1 ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`} />
                  {stat.trend} from last month
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/orders/new">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Schedule Order</h3>
                  <p className="text-sm text-muted-foreground">Create a new work order</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/clients">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Add Client</h3>
                  <p className="text-sm text-muted-foreground">Register a new client</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/services">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Package className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Services</h3>
                  <p className="text-sm text-muted-foreground">Update service offerings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card className="hover-lift">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest work orders</CardDescription>
            </div>
            <Link href="/dashboard/orders">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No orders yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first order.</p>
              <div className="mt-6">
                <Link href="/dashboard/orders/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Order
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-foreground">
                        {order.client.name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        order.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(order.schedule_date_time)}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {order.services.length} service{order.services.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-foreground">
                      {formatCurrency(order.order_amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.order_payment_status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 