'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Search, Save, X, Download, Calendar, DollarSign, User, CheckSquare, Square, List, Grid3X3, Clock, MapPin, Phone, Mail, RefreshCw, Eye } from 'lucide-react'
import { WorkOrderWithDetails, Client, Service, Worker } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BulkEditModal } from '@/components/bulk-edit-modal'
import Link from 'next/link'

export default function OrdersPage() {
  const [orders, setOrders] = useState<WorkOrderWithDetails[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [bulkEditLoading, setBulkEditLoading] = useState(false)
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'schedule'>('list')
  const [scheduleFilter, setScheduleFilter] = useState<'week' | 'month' | 'year'>('week')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchOrders = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (clientFilter !== 'all') {
        params.append('clientId', clientFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      // Use the API endpoint for pagination and filtering
      const response = await fetch(`/api/orders?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders || [])
        setTotalOrders(data.pagination.total || 0)
        setTotalPages(data.pagination.totalPages || 0)
      } else {
        setError(data.error || 'Failed to fetch orders')
      }
    } catch (error) {
      setError('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Refetch when filters or pagination change
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
    fetchOrders()
  }, [statusFilter, clientFilter, paymentFilter, searchTerm, pageSize])

  // Refetch when page changes
  useEffect(() => {
    fetchOrders()
  }, [currentPage])

  const fetchClients = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        return
      }

      setClients(data || [])
    } catch (error) {
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Map filter values to database values
      const statusFilterMap: Record<string, string> = {
        'all': 'all',
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
      }
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilterMap[statusFilter]
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof WorkOrderWithDetails]
      let bValue: any = b[sortField as keyof WorkOrderWithDetails]
      
      if (sortField === 'client') {
        aValue = a.client?.name || ''
        bValue = b.client?.name || ''
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }
      
      return sortDirection === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (bValue > aValue ? 1 : -1)
    })

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(key)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)))
    }
  }

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const handleBulkEdit = async (updates: any) => {
    setBulkEditLoading(true)
    try {
      const supabase = createClient()
      
      // Map form field names to database field names and format values correctly
      const dbUpdates: any = {}
      
      if (updates.status) {
        // Convert status to proper format
        const statusMap: Record<string, string> = {
          'pending': 'Pending',
          'in_progress': 'In Progress',
          'completed': 'Completed',
          'cancelled': 'Cancelled',
          'archived': 'Archived'
        }
        dbUpdates.status = statusMap[updates.status] || updates.status
      }
      
      if (updates.payment_status) {
        // Convert payment status to proper format
        const paymentStatusMap: Record<string, string> = {
          'unpaid': 'Unpaid',
          'pending_invoice': 'Pending Invoice',
          'paid': 'Paid'
        }
        dbUpdates.order_payment_status = paymentStatusMap[updates.payment_status] || updates.payment_status
      }
      
      if (updates.notes) {
        dbUpdates.notes = updates.notes
      }
      
      if (Object.keys(dbUpdates).length === 0) {
        alert('No valid fields to update')
        return
      }
      
      console.log('Updating orders with:', dbUpdates)
      
      const { error } = await supabase
        .from('work_orders')
        .update(dbUpdates)
        .in('id', Array.from(selectedOrders))

      if (error) {
        console.error('Error updating orders:', error)
        alert(`Failed to update orders: ${error.message}`)
        return
      }

      // Refresh orders and clear selection
      await fetchOrders()
      setSelectedOrders(new Set())
      setBulkAction('')
    } catch (error) {
      console.error('Bulk edit error:', error)
      alert('Failed to update orders')
    } finally {
      setBulkEditLoading(false)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.size === 0) return

    try {
      const supabase = createClient()
      
      switch (bulkAction) {
        case 'edit':
          setShowBulkEditModal(true)
          return

        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedOrders.size} order(s)? This action cannot be undone.`)) {
            return
          }
          
          // Delete work order services first
          const { error: servicesError } = await supabase
            .from('work_order_services')
            .delete()
            .in('work_order_id', Array.from(selectedOrders))

          if (servicesError) {
            console.error('Error deleting order services:', servicesError)
            alert('Failed to delete order services')
            return
          }

          // Delete the work orders
          const { error: orderError } = await supabase
            .from('work_orders')
            .delete()
            .in('id', Array.from(selectedOrders))

          if (orderError) {
            console.error('Error deleting orders:', orderError)
            alert('Failed to delete orders')
            return
          }
          break

        case 'status_pending':
        case 'status_in_progress':
        case 'status_completed':
        case 'status_cancelled':
          const statusMap: Record<string, string> = {
            'status_pending': 'Pending',
            'status_in_progress': 'In Progress',
            'status_completed': 'Completed',
            'status_cancelled': 'Cancelled'
          }
          const newStatus = statusMap[bulkAction]
          const { error: updateError } = await supabase
            .from('work_orders')
            .update({ status: newStatus })
            .in('id', Array.from(selectedOrders))

          if (updateError) {
            console.error('Error updating orders:', updateError)
            alert('Failed to update orders')
            return
          }
          break

        case 'payment_unpaid':
        case 'payment_pending_invoice':
        case 'payment_paid':
          const paymentStatusMap: Record<string, string> = {
            'payment_unpaid': 'Unpaid',
            'payment_pending_invoice': 'Pending Invoice',
            'payment_paid': 'Paid'
          }
          const newPaymentStatus = paymentStatusMap[bulkAction]
          const { error: paymentError } = await supabase
            .from('work_orders')
            .update({ order_payment_status: newPaymentStatus })
            .in('id', Array.from(selectedOrders))

          if (paymentError) {
            console.error('Error updating payment status:', paymentError)
            alert('Failed to update payment status')
            return
          }
          break
      }

      // Refresh orders and clear selection
      await fetchOrders()
      setSelectedOrders(new Set())
      setBulkAction('')
      setShowBulkActions(false)
    } catch (error) {
      console.error('Bulk action error:', error)
      alert('Failed to perform bulk action')
    }
  }

  const handleExport = () => {
    const ordersToExport = selectedOrders.size > 0 
      ? filteredOrders.filter(order => selectedOrders.has(order.id))
      : filteredOrders

    const csvContent = [
      ['Client', 'Status', 'Payment Status', 'Total', 'Created Date'],
      ...ordersToExport.map(order => [
        order.client?.name || '',
        order.status,
        order.order_payment_status,
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

  // Helper function to get date range for schedule filter
  const getScheduleDateRange = () => {
    const now = new Date()
    const start = new Date()
    
    switch (scheduleFilter) {
      case 'week':
        // Start of current week (Sunday)
        start.setDate(now.getDate() - now.getDay())
        start.setHours(0, 0, 0, 0)
        break
      case 'month':
        // Start of current month
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case 'year':
        // Start of current year
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        break
    }
    
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    
    return { start, end }
  }

  // Filter orders for schedule view
  const getScheduleOrders = () => {
    const { start, end } = getScheduleDateRange()
    
    return orders.filter(order => {
      const orderDate = new Date(order.schedule_date_time)
      return orderDate >= start && orderDate <= end
    }).sort((a, b) => new Date(a.schedule_date_time).getTime() - new Date(b.schedule_date_time).getTime())
  }

  // Group orders by date for schedule view
  const getGroupedScheduleOrders = () => {
    const scheduleOrders = getScheduleOrders()
    const grouped: Record<string, WorkOrderWithDetails[]> = {}
    
    // For week view, create entries for all days of the week
    if (scheduleFilter === 'week') {
      const { start } = getScheduleDateRange()
      const weekStart = new Date(start)
      
      // Create entries for all 7 days of the week
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart)
        dayDate.setDate(weekStart.getDate() + i)
        const dateString = dayDate.toDateString()
        grouped[dateString] = []
      }
    }
    
    // Add orders to their respective days
    scheduleOrders.forEach(order => {
      const date = new Date(order.schedule_date_time).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(order)
    })
    
    return grouped
  }

  // Get all unique dates for column headers
  const getScheduleDates = () => {
    const groupedOrders = getGroupedScheduleOrders()
    return Object.keys(groupedOrders).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  }

  // Get orders for a specific date
  const getOrdersForDate = (dateString: string) => {
    const groupedOrders = getGroupedScheduleOrders()
    return groupedOrders[dateString] || []
  }

  // Format date for display
  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  // Get day of week for better organization
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  // Check if a date is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Get status color for schedule cards
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'Archived': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get payment status color
  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-50 text-green-700'
      case 'Pending Invoice': return 'bg-yellow-50 text-yellow-700'
      case 'Unpaid': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-50 text-gray-700'
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Work Orders</h1>
          <p className="text-sm text-muted-foreground">Manage and track your work orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export {selectedOrders.size > 0 && `(${selectedOrders.size})`}
          </Button>
          <Link href="/dashboard/orders/new" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex-1 sm:flex-none"
          >
            <List className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">List View</span>
            <span className="xs:hidden">List</span>
          </Button>
          <Button
            variant={viewMode === 'schedule' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('schedule')}
            className="flex-1 sm:flex-none"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Schedule View</span>
            <span className="xs:hidden">Schedule</span>
          </Button>
        </div>
        
        {/* Schedule Filter (only show in schedule view) */}
        {viewMode === 'schedule' && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Show:</span>
            <Select value={scheduleFilter} onValueChange={(value: 'week' | 'month' | 'year') => setScheduleFilter(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search orders by client name, notes, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <SelectValue placeholder="Filter by status" />
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
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <SelectValue placeholder="Filter by client" />
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
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <SelectValue placeholder="Filter by payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Statuses</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Pending Invoice">Pending Invoice</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
          <SelectTrigger className="w-full sm:w-24 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedOrders.size} order(s) selected
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Select action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="edit">Edit Selected</SelectItem>
                      <SelectItem value="delete">Delete Selected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleBulkAction} disabled={!bulkAction} className="w-full sm:w-auto">
                    Apply
                  </Button>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedOrders(new Set())}
                className="w-full sm:w-auto"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'list' ? (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="space-y-3 p-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className={`border rounded-lg p-4 space-y-3 ${selectedOrders.has(order.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectOrder(order.id)}
                            className="h-6 w-6 p-0"
                            aria-label={selectedOrders.has(order.id) ? `Deselect order ${order.id}` : `Select order ${order.id}`}
                          >
                            {selectedOrders.has(order.id) ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                          <div>
                            <div className="font-medium text-sm">#{order.id.slice(0,8)}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(order.created_at)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                            ${order.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : ''}
                            ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                            ${order.status === 'Archived' ? 'bg-gray-100 text-gray-800' : ''}
                          `}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="font-medium text-sm">{order.client?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{order.client?.email}</div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            {formatCurrency(order.order_amount || 0)}
                          </div>
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${order.order_payment_status === 'Paid' ? 'bg-green-100 text-green-800' : ''}
                            ${order.order_payment_status === 'Pending Invoice' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${order.order_payment_status === 'Unpaid' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {order.order_payment_status}
                          </span>
                        </div>
                        
                        {order.schedule_date_time && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(order.schedule_date_time)}
                          </div>
                        )}
                        
                        {order.notes && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {order.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/orders/${order.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-6 w-6 p-0"
                      >
                        {selectedOrders.size === filteredOrders.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('id')} 
                      tabIndex={0}
                      aria-label={`Sort by ID ${sortField === 'id' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSort('id')
                        }
                      }}
                    >
                      Order ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('client')} tabIndex={0} aria-label="Sort by client ascending">
                      Client {sortField === 'client' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('status')}
                      tabIndex={0}
                      aria-label={`Sort by status ${sortField === 'status' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSort('status')
                        }
                      }}
                    >
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('order_amount')}
                      tabIndex={0}
                      aria-label={`Sort by total amount ${sortField === 'order_amount' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSort('order_amount')
                        }
                      }}
                    >
                      Total {sortField === 'order_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('order_payment_status')}
                      tabIndex={0}
                      aria-label={`Sort by payment status ${sortField === 'order_payment_status' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSort('order_payment_status')
                        }
                      }}
                    >
                      Payment Status {sortField === 'order_payment_status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('created_at')}
                      tabIndex={0}
                      aria-label={`Sort by creation date ${sortField === 'created_at' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSort('created_at')
                        }
                      }}
                    >
                      Created {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left p-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className={`border-b hover:bg-muted/30 ${selectedOrders.has(order.id) ? 'bg-blue-50' : ''}`}>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectOrder(order.id)}
                          className="h-6 w-6 p-0"
                          aria-label={selectedOrders.has(order.id) ? `Deselect order ${order.id}` : `Select order ${order.id}`}
                        >
                          {selectedOrders.has(order.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className="p-3 text-xs font-mono text-muted-foreground">{order.id.slice(0,8)}</td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-sm">{order.client?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{order.client?.email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                          ${order.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : ''}
                          ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                          ${order.status === 'Archived' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-sm">
                          {formatCurrency(order.order_amount || 0)}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${order.order_payment_status === 'Paid' ? 'bg-green-100 text-green-800' : ''}
                          ${order.order_payment_status === 'Pending Invoice' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${order.order_payment_status === 'Unpaid' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {order.order_payment_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-1">
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 w-7 p-0"
                              aria-label={`View order ${order.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/orders/${order.id}/edit`}>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 w-7 p-0"
                              aria-label={`Edit order ${order.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(order.id)}
                            aria-label={`Delete order ${order.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
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
            </>
          ) : (
            /* Schedule View */
            <div className="p-4">
              {(() => {
                const groupedOrders = getGroupedScheduleOrders()
                const scheduleOrders = getScheduleOrders()
                const scheduleDates = getScheduleDates()
                
                if (scheduleOrders.length === 0 && (scheduleFilter === 'month' || scheduleFilter === 'year')) {
                  return (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No scheduled orders</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        No orders scheduled for {scheduleFilter === 'month' ? 'this month' : 'this year'}
                      </p>
                      <Link href="/dashboard/orders/new">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Order
                        </Button>
                      </Link>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-4">
                    {/* Schedule Filter Info */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Schedule View - {scheduleFilter === 'week' ? 'This Week' : scheduleFilter === 'month' ? 'This Month' : 'This Year'}
                        </span>
                      </div>
                      <Link href="/dashboard/orders/new">
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Order
                        </Button>
                      </Link>
                    </div>

                    {/* Schedule Grid */}
                    <div className="overflow-x-auto">
                      <div className="min-w-max">
                        {/* Mobile Schedule View */}
                        <div className="block lg:hidden">
                          <div className="space-y-4">
                            {scheduleDates.map((dateString) => {
                              const orders = getOrdersForDate(dateString)
                              return (
                                <div key={dateString} className="border rounded-lg p-4">
                                  <div className={`flex items-center justify-between mb-4 p-3 rounded-lg ${
                                    isToday(dateString) ? 'bg-blue-100 border border-blue-200' : 'bg-gray-50'
                                  }`}>
                                    <div>
                                      <div className={`text-lg font-semibold ${
                                        isToday(dateString) ? 'text-blue-900' : 'text-gray-900'
                                      }`}>
                                        {formatScheduleDate(dateString)}
                                      </div>
                                      <div className={`text-sm ${
                                        isToday(dateString) ? 'text-blue-700' : 'text-gray-500'
                                      }`}>
                                        {getDayOfWeek(dateString)}
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-gray-600">
                                      {orders.length} order{orders.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                  
                                  {orders.length === 0 ? (
                                    <div className="text-center py-8">
                                      <div className="text-sm text-gray-400 mb-3">
                                        {isToday(dateString) ? 'No orders for today' : 'No orders scheduled'}
                                      </div>
                                      <Link href="/dashboard/orders/new">
                                        <Button size="sm" variant="outline">
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add Order
                                        </Button>
                                      </Link>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {orders.map((order) => (
                                        <div
                                          key={order.id}
                                          className={`p-3 rounded-lg border ${
                                            selectedOrders.has(order.id) 
                                              ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                                              : 'bg-white border-gray-200 hover:border-gray-300'
                                          }`}
                                          onClick={() => handleSelectOrder(order.id)}
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-gray-900 truncate">
                                                {order.client?.name || 'Unknown'}
                                              </div>
                                              <div className="text-gray-600 text-sm">
                                                {new Date(order.schedule_date_time).toLocaleTimeString('en-US', {
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  hour12: true
                                                })}
                                              </div>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleSelectOrder(order.id)
                                              }}
                                            >
                                              {selectedOrders.has(order.id) ? (
                                                <CheckSquare className="h-4 w-4" />
                                              ) : (
                                                <Square className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </div>
                                          
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm font-medium text-gray-900">
                                              {formatCurrency(order.order_amount || 0)}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                                              {order.status}
                                            </span>
                                          </div>
                                          
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Payment:</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentColor(order.order_payment_status)}`}>
                                              {order.order_payment_status}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Desktop Schedule View */}
                        <div className="hidden lg:block">
                          {/* Header Row with Dates */}
                          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${scheduleDates.length}, 1fr)` }}>
                            {/* Date column headers */}
                            {scheduleDates.map((dateString) => (
                              <div 
                                key={dateString} 
                                className={`h-16 flex flex-col items-center justify-center border rounded-lg text-center ${
                                  isToday(dateString) ? 'bg-blue-100 border-blue-300' : 'bg-gray-50'
                                }`}
                              >
                                <div className={`text-sm font-medium ${
                                  isToday(dateString) ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {formatScheduleDate(dateString)}
                                </div>
                                <div className={`text-xs ${
                                  isToday(dateString) ? 'text-blue-700' : 'text-gray-500'
                                }`}>
                                  {getDayOfWeek(dateString)}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Orders Rows */}
                          <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: `repeat(${scheduleDates.length}, 1fr)` }}>
                          {/* Orders for each date */}
                          {scheduleDates.map((dateString) => {
                            const orders = getOrdersForDate(dateString)
                            
                            return (
                              <div 
                                key={dateString} 
                                className={`min-h-64 border rounded-lg p-3 ${
                                  isToday(dateString) ? 'bg-blue-50 border-blue-200' : 'bg-white'
                                }`}
                              >
                                {orders.length === 0 ? (
                                  <div className="h-full flex flex-col items-center justify-center">
                                    <div className="text-xs text-gray-400 text-center mb-2">
                                      {isToday(dateString) ? 'Today' : 'No orders'}
                                    </div>
                                    <Link href="/dashboard/orders/new">
                                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Order
                                      </Button>
                                    </Link>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {orders.map((order) => (
                                      <div
                                        key={order.id}
                                        className={`p-3 rounded-lg text-sm cursor-pointer transition-all hover:shadow-sm ${
                                          selectedOrders.has(order.id) 
                                            ? 'ring-2 ring-blue-500 bg-blue-100' 
                                            : 'bg-white border border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => handleSelectOrder(order.id)}
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                              {order.client?.name || 'Unknown'}
                                            </div>
                                            <div className="text-gray-600 text-xs">
                                              {new Date(order.schedule_date_time).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                              })}
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 ml-1 flex-shrink-0"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleSelectOrder(order.id)
                                            }}
                                          >
                                            {selectedOrders.has(order.id) ? (
                                              <CheckSquare className="h-3 w-3" />
                                            ) : (
                                              <Square className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="text-sm font-medium text-gray-900">
                                            {formatCurrency(order.order_amount || 0)}
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                                              {order.status}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs text-gray-500">Payment Status:</span>
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentColor(order.order_payment_status)}`}>
                                            {order.order_payment_status}
                                          </span>
                                        </div>
                                        
                                        {/* Quick actions */}
                                        <div className="flex space-x-1">
                                          <Link href={`/dashboard/orders/${order.id}`}>
                                            <Button size="sm" variant="outline" className="h-6 w-6 p-0" aria-label={`View order ${order.id}`}>
                                              <Eye className="h-3 w-3" />
                                            </Button>
                                          </Link>
                                          <Link href={`/dashboard/orders/${order.id}/edit`}>
                                            <Button size="sm" variant="outline" className="h-6 w-6 p-0" aria-label={`Edit order ${order.id}`}>
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                          </Link>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                      <div className="text-sm font-medium text-gray-700 mb-2">Legend</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="font-medium text-gray-600 mb-2">Order Status</div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                              <span>Today</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                              <span>Completed</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                              <span>In Progress</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                              <span>Pending</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                              <span>Cancelled</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-600 mb-2">Payment Status</div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                              <span>Paid</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                              <span>Pending Invoice</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                              <span>Unpaid</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        onSave={handleBulkEdit}
        type="orders"
        selectedCount={selectedOrders.size}
        loading={bulkEditLoading}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalOrders)} of {totalOrders} orders
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex-1 sm:flex-none"
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex-1 sm:flex-none"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 