'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Download, Upload } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'client') {
        aValue = a.client?.name || ''
        bValue = b.client?.name || ''
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }
      
      return sortOrder === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (bValue > aValue ? 1 : -1)
    })

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['Client', 'Status', 'Total', 'Created Date'],
      ...filteredOrders.map(order => [
        order.client?.name || '',
        order.status,
        order.order_amount || 0,
        formatDate(order.created_at)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      
      // Delete work order services first (due to foreign key constraint)
      const { error: servicesError } = await supabase
        .from('work_order_services')
        .delete()
        .eq('work_order_id', orderId)

      if (servicesError) {
        console.error('Error deleting order services:', servicesError)
        alert('Failed to delete order services')
        return
      }

      // Delete the work order
      const { error: orderError } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', orderId)

      if (orderError) {
        console.error('Error deleting order:', orderError)
        alert('Failed to delete order')
        return
      }

      // Refresh the orders list
      fetchOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Failed to delete order')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchOrders}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Work Orders</h1>
          <p className="text-sm text-muted-foreground">Manage and track your work orders</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/dashboard/orders/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm h-9"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('client')}>
                    Client {sortBy === 'client' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('order_amount')}>
                    Total {sortBy === 'order_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('created_at')}>
                    Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-sm">{order.client?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{order.client?.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        ${order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-sm">
                        {formatCurrency(order.order_amount || 0)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">View</Button>
                        </Link>
                        <Link href={`/dashboard/orders/${order.id}/edit`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">Edit</Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(order.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">No orders found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 