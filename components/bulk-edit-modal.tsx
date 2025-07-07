'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save, AlertCircle } from 'lucide-react'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updates: any) => Promise<void>
  type: 'orders' | 'clients'
  selectedCount: number
  loading?: boolean
}

export function BulkEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  type, 
  selectedCount, 
  loading = false 
}: BulkEditModalProps) {
  const [formData, setFormData] = useState({
    status: '',
    payment_status: '',
    notes: '',
    client_type: '',
    is_active: null as boolean | null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out empty values
    const updates = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    )
    
    if (Object.keys(updates).length === 0) {
      alert('Please fill in at least one field to update')
      return
    }
    
    await onSave(updates)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setFormData({
      status: '',
      payment_status: '',
      notes: '',
      client_type: '',
      is_active: null
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bulk Edit {type === 'orders' ? 'Orders' : 'Clients'}</CardTitle>
              <CardDescription>
                Update {selectedCount} selected {type === 'orders' ? 'order(s)' : 'client(s)'}
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              aria-label="Close bulk edit modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Bulk Update Warning</p>
                  <p>This will update all {selectedCount} selected {type === 'orders' ? 'orders' : 'clients'}. Only filled fields will be updated.</p>
                </div>
              </div>
            </div>

            {type === 'orders' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="pending_invoice">Pending Invoice</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add notes to all selected orders (optional)"
                    rows={3}
                  />
                </div>
              </>
            )}

            {type === 'clients' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Type
                  </label>
                  <Select value={formData.client_type} onValueChange={(value) => setFormData({ ...formData, client_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active Status
                  </label>
                  <Select 
                    value={formData.is_active === null ? '' : formData.is_active.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === '' ? null : value === 'true' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select active status (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Updating...' : `Update ${selectedCount} ${type === 'orders' ? 'Orders' : 'Clients'}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 