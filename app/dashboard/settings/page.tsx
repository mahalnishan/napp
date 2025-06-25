'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Save, X, User, CheckCircle, Settings, Users, Building2, FileText, Unlink, AlertCircle, Link as LinkIcon, Key } from 'lucide-react'
import { Worker } from '@/lib/types'
import { ThemeToggle } from '@/components/theme-toggle'
import Image from 'next/image'

interface UserProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  avatar_url: string | null
}

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [showWorkerForm, setShowWorkerForm] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [workerFormData, setWorkerFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [quickbooksConnected, setQuickbooksConnected] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    phone: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [workersData, integrationData, profileData] = await Promise.all([
        supabase.from('workers').select('*').eq('user_id', user.id),
        supabase.from('quickbooks_integrations').select('*').eq('user_id', user.id).single(),
        supabase.from('users').select('*').eq('id', user.id).single()
      ])

      setWorkers(workersData.data || [])
      setQuickbooksConnected(!!integrationData.data)
      setUserProfile(profileData.data)
      
      if (profileData.data) {
        setProfileFormData({
          name: profileData.data.name || '',
          phone: profileData.data.phone || ''
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleQuickBooksConnect = async () => {
    try {
      const response = await fetch('/api/quickbooks/auth', {
        method: 'POST'
      })
      
      if (response.ok) {
        const { authUrl } = await response.json()
        window.location.href = authUrl
      } else {
        setError('Failed to initiate QuickBooks connection')
      }
    } catch (error) {
      console.error('QuickBooks connection error:', error)
      setError('Failed to connect to QuickBooks')
    }
  }

  const handleQuickBooksDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect QuickBooks?')) return

    try {
      const { error } = await supabase
        .from('quickbooks_integrations')
        .delete()
        .eq('user_id', userProfile?.id)

      if (error) throw error

      setQuickbooksConnected(false)
      setMessage('QuickBooks disconnected successfully')
    } catch (error) {
      console.error('Error disconnecting QuickBooks:', error)
      setError('Failed to disconnect QuickBooks')
    }
  }

  const handleTestInvoice = async () => {
    try {
      // Create a test order first
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const testOrder = {
        user_id: authUser.id,
        client_id: 'test-client',
        assigned_to_type: 'Self' as const,
        status: 'Pending' as const,
        schedule_date_time: new Date().toISOString(),
        order_amount: 100,
        order_payment_status: 'Unpaid' as const,
        notes: 'Test order for QuickBooks integration'
      }

      const { data: order, error: orderError } = await supabase
        .from('work_orders')
        .insert(testOrder)
        .select()
        .single()

      if (orderError) throw orderError

      // Create test invoice
      const response = await fetch('/api/quickbooks/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          clientId: 'test-client',
          services: [{ serviceId: 'test-service', quantity: 1, price: 100 }],
          totalAmount: 100
        })
      })

      if (response.ok) {
        const { invoiceId } = await response.json()
        setMessage(`Test invoice created successfully! Invoice ID: ${invoiceId}`)
      } else {
        const errorData = await response.json()
        setError(`Failed to create test invoice: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Test invoice error:', error)
      setError('Failed to create test invoice')
    }
  }

  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    try {
      const workerData = {
        user_id: userProfile.id,
        name: workerFormData.name.trim(),
        email: workerFormData.email.trim(),
        phone: workerFormData.phone.trim() || null
      }

      if (editingWorker) {
        const { error } = await supabase
          .from('workers')
          .update(workerData)
          .eq('id', editingWorker.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('workers')
          .insert(workerData)

        if (error) throw error
      }

      resetWorkerForm()
      fetchData()
      setMessage(editingWorker ? 'Worker updated successfully' : 'Worker added successfully')
    } catch (error) {
      console.error('Error saving worker:', error)
      setError('Failed to save worker')
    }
  }

  const handleWorkerEdit = (worker: Worker) => {
    setEditingWorker(worker)
    setWorkerFormData({
      name: worker.name,
      email: worker.email,
      phone: worker.phone || ''
    })
    setShowWorkerForm(true)
  }

  const handleWorkerDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this worker?')) return

    try {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
      setMessage('Worker deleted successfully')
    } catch (error) {
      console.error('Error deleting worker:', error)
      setError('Failed to delete worker')
    }
  }

  const resetWorkerForm = () => {
    setWorkerFormData({ name: '', email: '', phone: '' })
    setEditingWorker(null)
    setShowWorkerForm(false)
  }

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileFormData({ ...profileFormData, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    setUploading(true)
    setError('')
    setMessage('')

    try {
      let avatarUrl = userProfile.avatar_url

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          if (uploadError.message.includes('Bucket not found')) {
            throw new Error('Avatar storage not configured. Please create an "avatars" bucket in your Supabase Storage.')
          } else if (uploadError.message.includes('new row violates row-level security policy')) {
            throw new Error('Storage permissions not configured. Please set up RLS policies for the avatars bucket.')
          } else {
            throw new Error(`Upload failed: ${uploadError.message}`)
          }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = urlData.publicUrl
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: profileFormData.name || null,
          phone: profileFormData.phone || null,
          avatar_url: avatarUrl
        })
        .eq('id', userProfile.id)

      if (updateError) throw updateError

      setMessage('Profile updated successfully')
      setAvatarFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setUploading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!userProfile?.email) return

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userProfile.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`
      })

      if (error) throw error
      setMessage('Password reset email sent! Check your inbox.')
    } catch (error) {
      console.error('Password reset error:', error)
      setError('Failed to send password reset email')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return

    try {
      const { error } = await supabase.auth.admin.deleteUser(userProfile?.id || '')
      if (error) throw error
      
      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Account deletion error:', error)
      setError('Failed to delete account')
    }
  }

  const testStorageConnection = async () => {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1 })

      if (error) {
        if (error.message.includes('Bucket not found')) {
          setError('Avatar storage bucket not found. Please create an "avatars" bucket in your Supabase Storage.')
        } else {
          setError(`Storage test failed: ${error.message}`)
        }
      } else {
        setMessage('Storage connection successful! Avatar uploads should work.')
      }
    } catch (error) {
      console.error('Storage test error:', error)
      setError('Failed to test storage connection')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500">User not found. Please log in again.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleProfileSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    name="name"
                    value={profileFormData.name}
                    onChange={handleProfileInputChange}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input
                    name="phone"
                    value={profileFormData.phone}
                    onChange={handleProfileInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Profile Picture</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt="Avatar"
                          width={64}
                          height={64}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Avatar
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={uploading}>
                    <Save className="mr-2 h-4 w-4" />
                    {uploading ? 'Saving...' : 'Save Profile'}
                  </Button>
                  <Button type="button" variant="outline" onClick={testStorageConnection}>
                    Test Storage
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* QuickBooks Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              QuickBooks Integration
            </CardTitle>
            <CardDescription>Connect your QuickBooks account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickbooksConnected ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Connected to QuickBooks</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleTestInvoice}>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Test Invoice
                  </Button>
                  <Button variant="outline" onClick={handleQuickBooksDisconnect}>
                    <Unlink className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">Not connected to QuickBooks</span>
                </div>
                <Button onClick={handleQuickBooksConnect}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connect QuickBooks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workers Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Workers Management
            </CardTitle>
            <CardDescription>Manage your team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showWorkerForm ? (
              <Button onClick={() => setShowWorkerForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            ) : (
              <form onSubmit={handleWorkerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      value={workerFormData.name}
                      onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                      placeholder="Worker name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={workerFormData.email}
                      onChange={(e) => setWorkerFormData({ ...workerFormData, email: e.target.value })}
                      placeholder="Worker email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input
                    value={workerFormData.phone}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, phone: e.target.value })}
                    placeholder="Worker phone"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {editingWorker ? 'Update Worker' : 'Add Worker'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetWorkerForm}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {workers.map((worker) => (
                <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-sm text-muted-foreground">{worker.email}</p>
                    {worker.phone && <p className="text-sm text-muted-foreground">{worker.phone}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWorkerEdit(worker)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWorkerDelete(worker.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Account Preferences
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <ThemeToggle />
            </div>
            <div className="space-y-2">
              <Button variant="outline" onClick={handleResetPassword}>
                <Key className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              <Button variant="outline" onClick={handleDeleteAccount} className="text-red-600 hover:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 