'use client'

import { useSupabaseQuery } from '@/lib/hooks/useOptimizedQuery'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, DollarSign, FileText, Users, Package, TrendingUp, Calendar, Clock, Shield } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DashboardStats, WorkOrderWithDetails } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Get user ID once
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      setUserEmail(user?.email || null)
    }
    getUser()
  }, [])

  // Optimized queries with caching
  const { data: stats, loading: statsLoading, error: statsError } = useSupabaseQuery<DashboardStats>(
    `dashboard-stats-${userId}`,
    (supabase) => {
      if (!userId) return Promise.resolve({ data: null, error: null })
      
      return Promise.all([
        supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('work_orders').select('order_amount').eq('user_id', userId),
        supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['Pending', 'In Progress']),
        supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'Completed')
      ]).then(([orders, clients, services, revenueData, pending, completed]) => {
        const totalRevenue = revenueData.data?.reduce((sum: number, order: { order_amount: number }) => sum + (order.order_amount || 0), 0) || 0
        
        return {
          data: {
            totalOrders: orders.count || 0,
            totalClients: clients.count || 0,
            totalServices: services.count || 0,
            totalRevenue,
            pendingOrders: pending.count || 0,
            completedOrders: completed.count || 0
          },
          error: null
        }
      })
    },
    { enabled: !!userId, staleTime: 2 * 60 * 1000 } // 2 minutes cache
  )

  const { data: recentOrders, loading: ordersLoading } = useSupabaseQuery<WorkOrderWithDetails[]>(
    `recent-orders-${userId}`,
    (supabase) => {
      if (!userId) return Promise.resolve({ data: null, error: null })
      
      return supabase
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
    },
    { enabled: !!userId, staleTime: 1 * 60 * 1000 } // 1 minute cache
  )

  const loading = statsLoading || ordersLoading || !userId

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your work orders.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your work orders.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading dashboard data. Please try refreshing the page.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStats = stats || {
    totalOrders: 0,
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(currentStats.totalRevenue),
      icon: DollarSign,
      description: 'All time earnings',
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: 'Total Orders',
      value: currentStats.totalOrders.toString(),
      icon: FileText,
      description: 'All orders created',
      trend: '+8.2%',
      trendUp: true
    },
    {
      title: 'Active Clients',
      value: currentStats.totalClients.toString(),
      icon: Users,
      description: 'Total clients',
      trend: '+5.1%',
      trendUp: true
    },
    {
      title: 'Services',
      value: currentStats.totalServices.toString(),
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
        <div className="flex items-center gap-2">
          {userEmail === 'nishan.mahal71@gmail.com' && (
            <Link href="/admin">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}
          <Link href="/dashboard/orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>
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
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Clients</h3>
                  <p className="text-sm text-muted-foreground">View and edit client information</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/services">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Package className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Services</h3>
                  <p className="text-sm text-muted-foreground">Manage your service offerings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      {recentOrders && recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest work orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.client?.name || 'Unknown Client'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.schedule_date_time)} • {order.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.order_amount)}</p>
                    <p className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/dashboard/orders">
                <Button variant="outline" className="w-full">
                  View All Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 