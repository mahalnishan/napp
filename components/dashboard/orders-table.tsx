'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Edit, Trash2, Eye, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { WorkOrderWithDetails } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface OrdersTableProps {
  orders: WorkOrderWithDetails[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [quickbooksConnected, setQuickbooksConnected] = useState(false)
  const [creatingInvoices, setCreatingInvoices] = useState<Set<string>>(new Set())
  const [invoiceMessages, setInvoiceMessages] = useState<Record<string, { type: 'success' | 'error', text: string }>>({})

  useEffect(() => {
    checkQuickBooksConnection()
  }, [])

  const checkQuickBooksConnection = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: integration } = await supabase
        .from('quickbooks_integrations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setQuickbooksConnected(!!integration)
    } catch (error) {
      console.error('Error checking QuickBooks connection:', error)
    }
  }

  const handleCreateInvoice = async (order: WorkOrderWithDetails) => {
    if (creatingInvoices.has(order.id)) return

    setCreatingInvoices(prev => new Set(prev).add(order.id))
    setInvoiceMessages(prev => ({ ...prev, [order.id]: { type: 'success', text: '' } }))

    try {
      const invoiceResponse = await fetch('/api/quickbooks/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          clientId: order.client_id,
          services: order.services.map(s => ({
            serviceId: s.service_id,
            quantity: s.quantity,
            price: s.service.price
          })),
          totalAmount: order.order_amount
        })
      })

      if (invoiceResponse.ok) {
        const { invoiceId } = await invoiceResponse.json()
        setInvoiceMessages(prev => ({
          ...prev,
          [order.id]: { 
            type: 'success', 
            text: `Invoice created! QB ID: ${invoiceId}` 
          }
        }))
        
        // Clear message after 5 seconds
        setTimeout(() => {
          setInvoiceMessages(prev => {
            const newMessages = { ...prev }
            delete newMessages[order.id]
            return newMessages
          })
        }, 5000)
      } else {
        const error = await invoiceResponse.json()
        setInvoiceMessages(prev => ({
          ...prev,
          [order.id]: { 
            type: 'error', 
            text: `Failed: ${error.error}` 
          }
        }))
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      setInvoiceMessages(prev => ({
        ...prev,
        [order.id]: { 
          type: 'error', 
          text: 'Failed to create invoice' 
        }
      }))
    } finally {
      setCreatingInvoices(prev => {
        const newSet = new Set(prev)
        newSet.delete(order.id)
        return newSet
      })
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.order_payment_status === paymentFilter
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      case 'Archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800'
      case 'Pending Invoice': return 'bg-yellow-100 text-yellow-800'
      case 'Unpaid': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by client name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
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
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Pending Invoice">Pending Invoice</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Services
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{order.client.name}</div>
                    <div className="text-sm text-gray-500">{order.client.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {order.services.map((wos, index) => (
                      <div key={wos.id}>
                        {wos.quantity}x {wos.service.name}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(order.schedule_date_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(order.order_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentColor(order.order_payment_status)}`}>
                      {order.order_payment_status}
                    </span>
                    {order.quickbooks_invoice_id && (
                      <div className="text-xs text-blue-600">
                        QB: {order.quickbooks_invoice_id}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/orders/${order.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {quickbooksConnected && !order.quickbooks_invoice_id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCreateInvoice(order)}
                        disabled={creatingInvoices.has(order.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        {creatingInvoices.has(order.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {order.quickbooks_invoice_id && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  {/* Invoice Message */}
                  {invoiceMessages[order.id] && (
                    <div className={`mt-2 text-xs p-2 rounded ${
                      invoiceMessages[order.id].type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-1">
                        {invoiceMessages[order.id].type === 'success' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        <span>{invoiceMessages[order.id].text}</span>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">No orders found</div>
        </div>
      )}
    </div>
  )
} 