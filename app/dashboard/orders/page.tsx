'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Download, Upload } from 'lucide-react'
import Link from 'next/link'
import { useCachedOrders } from '@/lib/hooks/use-cached-data'
import { VirtualTable } from '@/components/ui/virtual-list'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const {
    orders,
    loading,
    error,
    refreshing,
    refetch,
    createOrder,
    updateOrder,
    deleteOrder,
    optimisticUpdates,
    isReconciling
  } = useCachedOrders({
    maxAge: 2 * 60 * 1000, // 2 minutes
    enableOptimisticUpdates: true,
    enableCoalescing: true
  })

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

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      width: '120px',
      render: (order: any) => (
        <Link 
          href={`/dashboard/orders/${order.id}`}
          className="text-primary hover:underline font-mono text-xs"
        >
          {order.id.slice(0, 8)}...
        </Link>
      )
    },
    {
      key: 'client',
      header: 'Client',
      width: '200px',
      render: (order: any) => (
        <div>
          <div className="font-medium">{order.client?.name || 'Unknown'}</div>
          <div className="text-xs text-muted-foreground">{order.client?.email}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (order: any) => (
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
          ${order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
          ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
        `}>
          {order.status.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'total_amount',
      header: 'Total',
      width: '120px',
      render: (order: any) => (
        <div className="font-medium">
          {formatCurrency(order.total_amount || 0)}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '150px',
      render: (order: any) => (
        <div className="text-sm">
          {formatDate(order.created_at)}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (order: any) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/orders/${order.id}`}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          <Link href={`/dashboard/orders/${order.id}/edit`}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
        </div>
      )
    }
  ]

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
      ['Order ID', 'Client', 'Status', 'Total', 'Created Date'],
      ...filteredOrders.map(order => [
        order.id,
        order.client?.name || '',
        order.status,
        order.total_amount || 0,
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
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage your work orders and track their progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/dashboard/orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button
              variant="outline"
              onClick={refetch}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                {isReconciling && ' • Syncing...'}
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {optimisticUpdates.size > 0 && `${optimisticUpdates.size} pending update${optimisticUpdates.size !== 1 ? 's' : ''}`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No orders found</p>
              <Link href="/dashboard/orders/new">
                <Button>Create your first order</Button>
              </Link>
            </div>
          ) : (
            <VirtualTable
              items={filteredOrders}
              height={600}
              rowHeight={80}
              columns={columns}
              onEndReached={() => {
                // Load more orders if needed
                console.log('End reached - could load more orders')
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 