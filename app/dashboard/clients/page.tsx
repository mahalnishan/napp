'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Search, Save, X, Mail, Phone, MapPin, Building2, User, CheckCircle, XCircle, CheckSquare, Square } from 'lucide-react'
import { Client } from '@/lib/types'
import { ensureUserRecord } from '@/lib/utils'
import { BulkEditModal } from '@/components/bulk-edit-modal'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [clientTypeFilter, setClientTypeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [bulkEditLoading, setBulkEditLoading] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalClients, setTotalClients] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
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

  // Refetch when filters or pagination change
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
    fetchClients()
  }, [statusFilter, clientTypeFilter, searchTerm, pageSize])

  // Refetch when page changes
  useEffect(() => {
    fetchClients()
  }, [currentPage])

  const fetchClients = async () => {
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

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (clientTypeFilter !== 'all') {
        params.append('clientType', clientTypeFilter)
      }

      // Use the API endpoint for pagination and filtering
      const response = await fetch(`/api/clients?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setClients(data.clients || [])
        setTotalClients(data.pagination.total || 0)
        setTotalPages(data.pagination.totalPages || 0)
      } else {
        console.error('Error fetching clients:', data.error)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set())
    } else {
      setSelectedClients(new Set(filteredClients.map(client => client.id)))
    }
  }

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedClients(newSelected)
  }

  const handleBulkEdit = async (updates: any) => {
    setBulkEditLoading(true)
    try {
      const supabase = createClient()
      
      // Map form field names to database field names
      const dbUpdates: any = {}
      if (updates.client_type) dbUpdates.client_type = updates.client_type
      if (updates.is_active !== null) dbUpdates.is_active = updates.is_active
      
      if (Object.keys(dbUpdates).length === 0) {
        alert('No valid fields to update')
        return
      }
      
      const { error } = await supabase
        .from('clients')
        .update(dbUpdates)
        .in('id', Array.from(selectedClients))

      if (error) {
        console.error('Error updating clients:', error)
        alert('Failed to update clients')
        return
      }

      // Refresh clients and clear selection
      await fetchClients()
      setSelectedClients(new Set())
      setBulkAction('')
    } catch (error) {
      console.error('Bulk edit error:', error)
      alert('Failed to update clients')
    } finally {
      setBulkEditLoading(false)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedClients.size === 0) return

    try {
      const supabase = createClient()
      
      switch (bulkAction) {
        case 'edit':
          setShowBulkEditModal(true)
          return

        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedClients.size} client(s)? This will also delete all associated orders. This action cannot be undone.`)) {
            return
          }
          
          // First, delete all work order services for orders belonging to these clients
          const { data: orders } = await supabase
            .from('work_orders')
            .select('id')
            .in('client_id', Array.from(selectedClients))

          if (orders && orders.length > 0) {
            const orderIds = orders.map(order => order.id)
            
            // Delete work order services for all orders of these clients
            const { error: servicesError } = await supabase
              .from('work_order_services')
              .delete()
              .in('work_order_id', orderIds)

            if (servicesError) {
              console.error('Error deleting order services:', servicesError)
              alert('Failed to delete associated order services')
              return
            }

            // Delete all orders for these clients
            const { error: ordersError } = await supabase
              .from('work_orders')
              .delete()
              .in('client_id', Array.from(selectedClients))

            if (ordersError) {
              console.error('Error deleting orders:', ordersError)
              alert('Failed to delete associated orders')
              return
            }
          }

          // Finally, delete the clients
          const { error } = await supabase
            .from('clients')
            .delete()
            .in('id', Array.from(selectedClients))

          if (error) {
            console.error('Error deleting clients:', error)
            alert('Failed to delete clients')
            return
          }
          break

        case 'activate':
          const { error: activateError } = await supabase
            .from('clients')
            .update({ is_active: true })
            .in('id', Array.from(selectedClients))

          if (activateError) {
            console.error('Error activating clients:', activateError)
            alert('Failed to activate clients')
            return
          }
          break

        case 'deactivate':
          const { error: deactivateError } = await supabase
            .from('clients')
            .update({ is_active: false })
            .in('id', Array.from(selectedClients))

          if (deactivateError) {
            console.error('Error deactivating clients:', deactivateError)
            alert('Failed to deactivate clients')
            return
          }
          break
      }

      // Refresh clients and clear selection
      await fetchClients()
      setSelectedClients(new Set())
      setBulkAction('')
    } catch (error) {
      console.error('Bulk action error:', error)
      alert('Failed to perform bulk action')
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
    // Only filter by client type on client side since other filters are handled server-side
    const matchesClientType = clientTypeFilter === 'all' || client.client_type === clientTypeFilter
    return matchesClientType
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
        <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <SelectValue placeholder="Filter by type" />
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
      {selectedClients.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedClients.size} client(s) selected
                </span>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="edit">Edit Selected</SelectItem>
                    <SelectItem value="activate">Activate Selected</SelectItem>
                    <SelectItem value="deactivate">Deactivate Selected</SelectItem>
                    <SelectItem value="delete">Delete Selected</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkAction} disabled={!bulkAction}>
                  Apply
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedClients(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <th className="text-left p-3 text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-6 w-6 p-0"
                    >
                      {selectedClients.size === filteredClients.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </th>
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
                  <tr key={client.id} className={`border-b hover:bg-muted/30 ${!client.is_active ? 'opacity-75' : ''} ${selectedClients.has(client.id) ? 'bg-blue-50' : ''}`}>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectClient(client.id)}
                        className="h-6 w-6 p-0"
                      >
                        {selectedClients.has(client.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
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
                  {searchTerm || statusFilter !== 'all' || clientTypeFilter !== 'all' ? 'No clients found matching your criteria' : 'No clients yet'}
                </p>
                {!searchTerm && statusFilter === 'all' && clientTypeFilter === 'all' && (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalClients)} of {totalClients} clients
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
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
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        onSave={handleBulkEdit}
        type="clients"
        selectedCount={selectedClients.size}
        loading={bulkEditLoading}
      />
    </div>
  )
} 