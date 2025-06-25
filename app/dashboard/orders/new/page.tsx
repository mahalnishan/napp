'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Save } from 'lucide-react'
import { Client, Service, Worker } from '@/lib/types'
import { ensureUserRecord } from '@/lib/utils'

interface OrderService {
  serviceId: string
  quantity: number
  price: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [assignedToType, setAssignedToType] = useState<'Self' | 'Worker'>('Self')
  const [assignedToId, setAssignedToId] = useState('')
  const [scheduleDateTime, setScheduleDateTime] = useState('')
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Archived'>('Pending')
  const [paymentStatus, setPaymentStatus] = useState<'Unpaid' | 'Pending Invoice' | 'Paid'>('Unpaid')
  const [notes, setNotes] = useState('')
  const [orderServices, setOrderServices] = useState<OrderService[]>([])
  const [createQuickBooksInvoice, setCreateQuickBooksInvoice] = useState(false)
  const [quickbooksConnected, setQuickbooksConnected] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [clientsData, servicesData, workersData, integrationData] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('services').select('*').eq('user_id', user.id),
      supabase.from('workers').select('*').eq('user_id', user.id),
      supabase.from('quickbooks_integrations').select('*').eq('user_id', user.id).single()
    ])

    setClients(clientsData.data || [])
    setServices(servicesData.data || [])
    setWorkers(workersData.data || [])
    setQuickbooksConnected(!!integrationData.data)
  }

  const addService = () => {
    setOrderServices([...orderServices, { serviceId: '', quantity: 1, price: 0 }])
  }

  const removeService = (index: number) => {
    setOrderServices(orderServices.filter((_, i) => i !== index))
  }

  const updateService = (index: number, field: keyof OrderService, value: string | number) => {
    const updated = [...orderServices]
    updated[index] = { ...updated[index], [field]: value }
    
    // Update price when service changes
    if (field === 'serviceId') {
      const service = services.find(s => s.id === value)
      updated[index].price = service?.price || 0
    }
    
    setOrderServices(updated)
  }

  const calculateTotal = () => {
    return orderServices.reduce((total, os) => total + (os.price * os.quantity), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Ensure user record exists before creating order
      await ensureUserRecord(user.id, user.email || '')

      if (!selectedClient) {
        alert('Please select a client')
        return
      }

      if (orderServices.length === 0) {
        alert('Please add at least one service')
        return
      }

      const totalAmount = calculateTotal()

      // Create work order
      const { data: order, error: orderError } = await supabase
        .from('work_orders')
        .insert({
          user_id: user.id,
          client_id: selectedClient,
          assigned_to_type: assignedToType,
          assigned_to_id: assignedToType === 'Worker' ? assignedToId : null,
          status,
          schedule_date_time: scheduleDateTime,
          order_amount: totalAmount,
          order_payment_status: paymentStatus,
          notes,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create work order services
      const workOrderServices = orderServices.map(os => ({
        work_order_id: order.id,
        service_id: os.serviceId,
        quantity: os.quantity,
      }))

      const { error: servicesError } = await supabase
        .from('work_order_services')
        .insert(workOrderServices)

      if (servicesError) throw servicesError

      // Create QuickBooks invoice if requested and connected
      if (createQuickBooksInvoice && quickbooksConnected) {
        try {
          const invoiceResponse = await fetch('/api/quickbooks/create-invoice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: order.id,
              clientId: selectedClient,
              services: orderServices,
              totalAmount
            })
          })

          if (invoiceResponse.ok) {
            const { invoiceId } = await invoiceResponse.json()
            console.log('QuickBooks invoice created:', invoiceId)
          } else {
            console.error('Failed to create QuickBooks invoice')
          }
        } catch (error) {
          console.error('QuickBooks invoice creation error:', error)
        }
      }

      router.push('/dashboard/orders')
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
        <p className="text-gray-600">Create a new work order for your client</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client and Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Client & Assignment</CardTitle>
              <CardDescription>Select client and assign the work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <Select value={assignedToType} onValueChange={(value: 'Self' | 'Worker') => setAssignedToType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Self">Self</SelectItem>
                    <SelectItem value="Worker">Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {assignedToType === 'Worker' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Worker
                  </label>
                  <Select value={assignedToId} onValueChange={setAssignedToId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name} ({worker.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule and Status */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Status</CardTitle>
              <CardDescription>Set schedule and current status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Pending Invoice">Pending Invoice</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Add services to this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderServices.map((service, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service
                  </label>
                  <Select 
                    value={service.serviceId} 
                    onValueChange={(value) => updateService(index, 'serviceId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} - ${s.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qty
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={service.quantity}
                    onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value))}
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={service.price}
                    onChange={(e) => updateService(index, 'price', parseFloat(e.target.value))}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeService(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button type="button" variant="outline" onClick={addService}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>

            {orderServices.length > 0 && (
              <div className="text-right">
                <p className="text-lg font-semibold">
                  Total: ${calculateTotal().toFixed(2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QuickBooks Integration */}
        {quickbooksConnected && (
          <Card>
            <CardHeader>
              <CardTitle>QuickBooks Integration</CardTitle>
              <CardDescription>Create invoice in QuickBooks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createInvoice"
                  checked={createQuickBooksInvoice}
                  onChange={(e) => setCreateQuickBooksInvoice(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="createInvoice" className="text-sm text-gray-700">
                  Create invoice in QuickBooks automatically
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Add notes to this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/orders')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  )
} 