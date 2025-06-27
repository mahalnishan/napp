'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Search, Save, X, Mail, Phone, MapPin, Building2, User, CheckCircle, XCircle } from 'lucide-react'
import { Client } from '@/lib/types'
import { ensureUserRecord } from '@/lib/utils'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    client_type: 'Individual',
    is_active: true
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) {
        console.error('Error fetching clients:', error)
        return
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Ensure user record exists before creating client
      await ensureUserRecord(user.id, user.email || '')

      const clientData = {
        user_id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        client_type: formData.client_type,
        is_active: formData.is_active
      }

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id)

        if (error) {
          console.error('Supabase update error:', error)
          throw new Error(error.message || 'Failed to update client')
        }
      } else {
        const { error } = await supabase
          .from('clients')
          .insert(clientData)

        if (error) {
          console.error('Supabase insert error:', error)
          throw new Error(error.message || 'Failed to create client')
        }
      }

      resetForm()
      fetchClients()
    } catch (error) {
      console.error('Error saving client:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save client'
      alert(`Failed to save client: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      client_type: client.client_type,
      is_active: client.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated orders. This action cannot be undone.')) return

    try {
      const supabase = createClient()
      
      // First, delete all work order services for orders belonging to this client
      const { data: orders } = await supabase
        .from('work_orders')
        .select('id')
        .eq('client_id', id)

      if (orders && orders.length > 0) {
        const orderIds = orders.map(order => order.id)
        
        // Delete work order services for all orders of this client
        const { error: servicesError } = await supabase
          .from('work_order_services')
          .delete()
          .in('work_order_id', orderIds)

        if (servicesError) {
          console.error('Error deleting order services:', servicesError)
          alert('Failed to delete associated order services')
          return
        }

        // Delete all orders for this client
        const { error: ordersError } = await supabase
          .from('work_orders')
          .delete()
          .eq('client_id', id)

        if (ordersError) {
          console.error('Error deleting orders:', ordersError)
          alert('Failed to delete associated orders')
          return
        }
      }

      // Finally, delete the client
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase delete error:', error)
        throw new Error(error.message || 'Failed to delete client')
      }
      
      fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete client'
      alert(`Failed to delete client: ${errorMessage}`)
    }
  }

  const handleToggleStatus = async (client: Client) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !client.is_active })
        .eq('id', client.id)

      if (error) {
        console.error('Error toggling client status:', error)
        alert('Failed to update client status')
        return
      }

      fetchClients()
    } catch (error) {
      console.error('Error toggling client status:', error)
      alert('Failed to update client status')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      client_type: 'Individual',
      is_active: true
    })
    setEditingClient(null)
    setShowForm(false)
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm))
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && client.is_active) ||
      (statusFilter === 'inactive' && !client.is_active)
    
    return matchesSearch && matchesStatus
  })

  const clientTypeOptions = [
    'Individual',
    'Company',
    'Cash',
    'Contractor',
    'Residential',
    'Commercial',
    'Government',
    'Non-Profit',
    'Other'
  ]

  if (loading && clients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600">Manage your client contacts</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-600">Manage your client contacts</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search clients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</CardTitle>
                <CardDescription>
                  {editingClient ? 'Update client information' : 'Add a new client to your contacts'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter client name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Type
                  </label>
                  <Select value={formData.client_type} onValueChange={(value) => setFormData({ ...formData, client_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active client
                </label>
              </div>
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : (editingClient ? 'Update Client' : 'Add Client')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Clients List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 text-sm font-medium">Name</th>
                  <th className="text-left p-3 text-sm font-medium">Email</th>
                  <th className="text-left p-3 text-sm font-medium">Phone</th>
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className={`border-b hover:bg-muted/30 ${!client.is_active ? 'opacity-75' : ''}`}>
                    <td className="p-3">
                      <div className="font-medium text-sm">{client.name}</div>
                      {client.address && (
                        <div className="text-xs text-muted-foreground truncate max-w-48" title={client.address}>
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {client.address}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {client.email && (
                        <a href={`mailto:${client.email}`} className="text-sm hover:text-blue-600">
                          {client.email}
                        </a>
                      )}
                    </td>
                    <td className="p-3">
                      {client.phone && (
                        <a href={`tel:${client.phone}`} className="text-sm hover:text-blue-600">
                          {client.phone}
                        </a>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1">
                        {client.client_type === 'Individual' ? (
                          <User className="h-3 w-3 text-gray-400" />
                        ) : (
                          <Building2 className="h-3 w-3 text-gray-400" />
                        )}
                        <span className="text-xs text-muted-foreground">{client.client_type}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${client.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      `}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(client)}
                          className="h-7 px-2 text-xs"
                        >
                          {client.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                          className="h-7 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">
                  {searchTerm || statusFilter !== 'all' ? 'No clients found matching your criteria' : 'No clients yet'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => setShowForm(true)} className="mt-4" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Client
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 