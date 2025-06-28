'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, ArrowLeft, Calendar, User, DollarSign, FileText, Clock, MapPin, Phone, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface OrderDetails {
  id: string
  client_id: string
  assigned_to_type: 'Self' | 'Worker'
  assigned_to_id?: string
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Archived'
  schedule_date_time: string
  order_amount: number
  order_payment_status: 'Unpaid' | 'Pending Invoice' | 'Paid'
  quickbooks_invoice_id?: string
  notes?: string
  created_at: string
  updated_at: string
  client: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
  }
  worker?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  services: Array<{
    id: string
    quantity: number
    service: {
      id: string
      name: string
      description?: string
      price: number
    }
  }>
}

export default function ViewOrderPage() {
  const params = useParams()
  const orderId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [syncMessage, setSyncMessage] = useState('')

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orderData, error: orderError } = await supabase
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
        .eq('id', orderId)
        .single()

      if (orderError) {
        console.error('Error fetching order:', orderError)
        setError('Order not found')
        return
      }

      setOrder(orderData)
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'Archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Pending Invoice': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Unpaid': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handleSyncWithQuickBooks = async () => {
    if (!order) return
    
    setSyncing(true)
    setSyncStatus('idle')
    setSyncMessage('')

    try {
      const response = await fetch('/api/quickbooks/sync-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      const data = await response.json()

      if (response.ok) {
        setSyncStatus('success')
        setSyncMessage(data.message)
        
        // Refresh the order data to show updated information
        await fetchOrder()
      } else {
        setSyncStatus('error')
        setSyncMessage(data.error || 'Failed to sync with QuickBooks')
      }
    } catch (error) {
      setSyncStatus('error')
      setSyncMessage('Network error occurred while syncing')
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-gray-500">Loading order...</div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-500">{error || 'Order not found'}</div>
          <Link href="/dashboard/orders">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600">View work order information</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleSyncWithQuickBooks}
            disabled={syncing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {syncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync with QuickBooks
              </>
            )}
          </Button>
          <Link href={`/dashboard/orders/${order.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Sync Status Message */}
      {syncStatus !== 'idle' && (
        <div className={`p-4 rounded-lg border ${
          syncStatus === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {syncStatus === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{syncMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status and Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentColor(order.order_payment_status)}`}>
                  {order.order_payment_status}
                </span>
                {order.quickbooks_invoice_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    QB Invoice: {order.quickbooks_invoice_id}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Services included in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.services.map((serviceOrder) => (
                  <div key={serviceOrder.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{serviceOrder.service.name}</h4>
                      {serviceOrder.service.description && (
                        <p className="text-sm text-gray-600">{serviceOrder.service.description}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {serviceOrder.quantity} × {formatCurrency(serviceOrder.service.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(serviceOrder.service.price * serviceOrder.quantity)}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold">{formatCurrency(order.order_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formatDate(order.schedule_date_time)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {formatDate(order.created_at)}
                </div>
                {order.updated_at !== order.created_at && (
                  <div className="text-xs text-gray-500">
                    Updated: {formatDate(order.updated_at)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {order.assigned_to_type === 'Self' ? 'Assigned to Self' : 'Assigned to Worker'}
                </p>
                {order.assigned_to_type === 'Worker' && order.worker && (
                  <div className="text-sm text-gray-600">
                    <p>{order.worker.name}</p>
                    <p>{order.worker.email}</p>
                    {order.worker.phone && <p>{order.worker.phone}</p>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">{order.client.name}</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <a href={`mailto:${order.client.email}`} className="hover:text-blue-600">
                      {order.client.email}
                    </a>
                  </div>
                  {order.client.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${order.client.phone}`} className="hover:text-blue-600">
                        {order.client.phone}
                      </a>
                    </div>
                  )}
                  {order.client.address && (
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="font-medium">{order.client.address}</span>
                      </div>
                      <div className="ml-6">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="text-xs"
                        >
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.client.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MapPin className="mr-1 h-3 w-3" />
                            Open in Google Maps
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 