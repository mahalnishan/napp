'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Save, X, Settings, LinkIcon, Unlink, CheckCircle, AlertCircle, Building2, User, Key, Users, Bell, Shield, Upload, Download, Crown, Zap, Database, Palette, Globe, Code, MapPin, BarChart3, Webhook, XCircle, AlertTriangle, ArrowUpRight, CreditCard, FileText, Home, CreditCard as CreditCardIcon, Star, Shield as ShieldIcon, Link } from 'lucide-react'
import { Worker } from '@/lib/types'
import { ThemeToggle } from '@/components/theme-toggle'
import { BulkEditModal } from '@/components/bulk-edit-modal'
import QuickBooksIntegration from '@/components/quickbooks-integration'
import { subscriptionClientService } from '@/lib/subscription-client'
import { PlanType, PLAN_LIMITS } from '@/lib/plan-constants'
import { PaymentHandler } from '@/components/payment-handler'

interface UserProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  avatar_url: string | null
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [showWorkerForm, setShowWorkerForm] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [workerFormData, setWorkerFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    avatar_url: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [usageSummary, setUsageSummary] = useState<any>(null)
  const [userSettings, setUserSettings] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        setUser(profile)
        setProfileData({
          name: profile.name || '',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || ''
        })
        setAvatarPreview(profile.avatar_url || '')
      }

      // Fetch workers
      const { data: workersData } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', authUser.id)
        .order('name')

      setWorkers(workersData || [])

      try {
        const summary = await subscriptionClientService.getUsageSummary()
        const settings = await subscriptionClientService.getUserSettings()
        
        setUsageSummary(summary)
        setUserSettings(settings)
      } catch (subscriptionError) {
        console.error('Error fetching subscription data:', subscriptionError)
        // Set default values if subscription data fails to load
        setUsageSummary({
          plan: 'free',
          limits: PLAN_LIMITS.free,
          currentUsage: {
            workOrders: 0,
            teamMembers: 0,
            apiCalls: 0,
            storageMB: 0
          },
          remaining: {
            workOrders: 1000,
            teamMembers: 3,
            apiCalls: 0,
            storageMB: 1024
          }
        })
        setUserSettings({
          custom_branding_enabled: false,
          white_label_enabled: false,
          api_access_enabled: false,
          advanced_automation_enabled: false,
          multi_location_enabled: false,
          advanced_reporting_enabled: false,
          webhooks_enabled: false,
          custom_integrations_enabled: false
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const supabase = createClient()
      const workerData = {
        user_id: user.id,
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
      const supabase = createClient()
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
    setProfileData({ ...profileData, [e.target.name]: e.target.value })
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
    if (!user) return

    setUploading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()
      let avatarUrl = profileData.avatar_url

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
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
          name: profileData.name || null,
          phone: profileData.phone || null,
          avatar_url: avatarUrl
        })
        .eq('id', user.id)

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
    if (!user?.email) return

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
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
    if (!confirm('Are you sure you want to delete your account? This will permanently delete all your data including orders, clients, services, and workers. This action cannot be undone.')) return

    try {
      setLoading(true)
      setError('')
      setMessage('')

      // Get the current session to get the access token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No active session found. Please log in again.')
      }

      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      // Success - show message and redirect
      setMessage('Account deleted successfully. Redirecting...')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      
    } catch (error) {
      console.error('Account deletion error:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete account. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  const testStorageConnection = async () => {
    try {
      const supabase = createClient()
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

  const getPlanIcon = (plan: PlanType) => {
    switch (plan) {
      case 'free':
        return <Settings className="h-5 w-5" />
      case 'professional':
        return <Crown className="h-5 w-5" />
      case 'enterprise':
        return <Crown className="h-5 w-5 text-purple-500" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  const getPlanColor = (plan: PlanType) => {
    switch (plan) {
      case 'free':
        return 'bg-gray-100 text-gray-800'
      case 'professional':
        return 'bg-blue-100 text-blue-800'
      case 'enterprise':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatUsage = (current: number | undefined, limit: number | null | undefined) => {
    const safeCurrent = current || 0
    if (limit === null || limit === undefined) return `${safeCurrent} (unlimited)`
    return `${safeCurrent} / ${limit}`
  }

  const getUsagePercentage = (current: number | undefined, limit: number | null | undefined) => {
    const safeCurrent = current || 0
    if (limit === null || limit === undefined || limit === 0) return 0
    return Math.min((safeCurrent / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const handleBillingPortal = async () => {
    try {
      const { url } = await subscriptionClientService.createBillingPortalSession()
      window.location.href = url
    } catch (error) {
      console.error('Error opening billing portal:', error)
      setError('Failed to open billing portal')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and subscription</p>
          </div>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
              </div>
            </CardContent>
                   </Card>
       </div>

       {/* Payment Modal */}
       {showPaymentModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
             <CardHeader>
               <div className="flex items-center justify-between">
                 <CardTitle>Upgrade Your Plan</CardTitle>
                 <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => setShowPaymentModal(false)}
                 >
                   <X className="h-4 w-4" />
                 </Button>
               </div>
             </CardHeader>
             <CardContent>
               <PaymentHandler 
                 currentPlan={usageSummary?.plan || 'free'}
                 onSuccess={() => {
                   setShowPaymentModal(false)
                   fetchData() // Refresh data
                 }}
                 onError={(error) => {
                   setError(error)
                   setShowPaymentModal(false)
                 }}
               />
             </CardContent>
           </Card>
         </div>
       )}
     </div>
   )
 }

  if (!user) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and subscription</p>
        </div>
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-xs md:text-sm"><Home className="h-4 w-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2 text-xs md:text-sm"><User className="h-4 w-4" /><span className="hidden sm:inline">Profile</span></TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2 text-xs md:text-sm"><Users className="h-4 w-4" /><span className="hidden sm:inline">Team</span></TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2 text-xs md:text-sm"><CreditCardIcon className="h-4 w-4" /><span className="hidden sm:inline">Billing</span></TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2 text-xs md:text-sm"><Link className="h-4 w-4" /><span className="hidden sm:inline">Integrations</span></TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 text-xs md:text-sm"><ShieldIcon className="h-4 w-4" /><span className="hidden sm:inline">Security</span></TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {/* Welcome Banner, Plan Overview, Quick Usage Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Welcome to your Settings Dashboard</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Here you can manage your subscription, team members, profile, and access all the features available with your current plan.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Plan: {(usageSummary?.plan || 'free').charAt(0).toUpperCase() + (usageSummary?.plan || 'free').slice(1)}</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Status: Active</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Team: {workers.length} member{workers.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getPlanIcon(usageSummary?.plan)}
                  Current Plan
                </CardTitle>
                <CardDescription>
                  Your current subscription details
                </CardDescription>
              </div>
              <Badge className={getPlanColor(usageSummary?.plan || 'free')}>
                {(usageSummary?.plan || 'free').charAt(0).toUpperCase() + (usageSummary?.plan || 'free').slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plan</span>
                <span className="text-sm text-muted-foreground">
                  {(usageSummary?.plan || 'free') === 'free' ? 'Free' : 
                   (usageSummary?.plan || 'free') === 'professional' ? '$24/month' : '$59/month'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next Billing</span>
                <span className="text-sm text-muted-foreground">
                  {(usageSummary?.plan || 'free') === 'free' ? 'Never' : 'Monthly'}
                </span>
              </div>
              <Separator />
              <div className="flex gap-2">
                {(usageSummary?.plan || 'free') === 'free' && (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                )}
                {(usageSummary?.plan || 'free') === 'professional' && (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Upgrade to Enterprise
                  </Button>
                )}
                {(usageSummary?.plan || 'free') !== 'free' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleBillingPortal}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Usage Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Usage Overview
            </CardTitle>
            <CardDescription>
              Your current usage this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Work Orders */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {usageSummary?.currentUsage?.workOrders || 0}
                </div>
                <div className="text-sm text-gray-600">Work Orders</div>
                <div className="text-xs text-gray-500">
                  {usageSummary?.remaining?.workOrders === null ? 'Unlimited' : 
                   `${usageSummary?.remaining?.workOrders || 0} remaining`}
                </div>
              </div>

              {/* Team Members */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {usageSummary?.currentUsage?.teamMembers || 0}
                </div>
                <div className="text-sm text-gray-600">Team Members</div>
                <div className="text-xs text-gray-500">
                  {usageSummary?.remaining?.teamMembers === null ? 'Unlimited' : 
                   `${usageSummary?.remaining?.teamMembers || 0} remaining`}
                </div>
              </div>

              {/* API Calls */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {usageSummary?.currentUsage?.apiCalls || 0}
                </div>
                <div className="text-sm text-gray-600">API Calls</div>
                <div className="text-xs text-gray-500">
                  {(usageSummary?.plan || 'free') === 'free' ? 'Not available' :
                   usageSummary?.remaining?.apiCalls === null ? 'Unlimited' : 
                   `${usageSummary?.remaining?.apiCalls || 0} remaining`}
                </div>
              </div>

              {/* Storage */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((usageSummary?.currentUsage?.storageMB || 0) / 1024 * 100) / 100}
                </div>
                <div className="text-sm text-gray-600">Storage (GB)</div>
                <div className="text-xs text-gray-500">
                  {usageSummary?.remaining?.storageMB === null ? 'Unlimited' : 
                   `${Math.round((usageSummary?.remaining?.storageMB || 0) / 1024 * 100) / 100} GB remaining`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-400">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      aria-label="Upload avatar"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileInputChange}
                      placeholder="Your name"
                      required
                    />
                    <label className="block text-sm font-medium mt-3 mb-1">Phone</label>
                    <Input
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileInputChange}
                      placeholder="Your phone (optional)"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={uploading} className="mt-2">
                  {uploading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
              <Separator className="my-6" />
              <div>
                <label className="block text-sm font-medium mb-3">Theme</label>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Management
                  </CardTitle>
                  <CardDescription>
                    Manage your team members and workers
                  </CardDescription>
                </div>
                <Button onClick={() => setShowWorkerForm(true)} disabled={showWorkerForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showWorkerForm && (
                <form onSubmit={handleWorkerSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        value={workerFormData.name}
                        onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                        placeholder="Enter team member name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={workerFormData.email}
                        onChange={(e) => setWorkerFormData({ ...workerFormData, email: e.target.value })}
                        placeholder="Enter team member email"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
                    <Input
                      value={workerFormData.phone}
                      onChange={(e) => setWorkerFormData({ ...workerFormData, phone: e.target.value })}
                      placeholder="Enter team member phone"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={loading}>
                      <Save className="mr-2 h-4 w-4" />
                      {editingWorker ? 'Update Team Member' : 'Add Team Member'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetWorkerForm}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {workers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Your Team</h4>
                    <span className="text-xs text-gray-500">
                      {workers.length} member{workers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {workers.map((worker) => (
                      <div key={worker.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {worker.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{worker.name}</div>
                            <div className="text-sm text-gray-600">{worker.email}</div>
                            {worker.phone && <div className="text-sm text-gray-500">{worker.phone}</div>}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWorkerEdit(worker)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWorkerDelete(worker.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workers.length === 0 && !showWorkerForm && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No team members yet</p>
                  <p className="text-xs">Add your first team member to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subscription">
          <div className="grid gap-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getPlanIcon(usageSummary?.plan)}
                      Current Plan
                    </CardTitle>
                    <CardDescription>
                      Manage your subscription and billing
                    </CardDescription>
                  </div>
                  <Badge className={getPlanColor(usageSummary?.plan || 'free')}>
                    {(usageSummary?.plan || 'free').charAt(0).toUpperCase() + (usageSummary?.plan || 'free').slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Plan</span>
                    <span className="text-sm text-muted-foreground">
                      {(usageSummary?.plan || 'free') === 'free' ? 'Free' : 
                       (usageSummary?.plan || 'free') === 'professional' ? '$24/month' : '$59/month'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    {(usageSummary?.plan || 'free') === 'free' && (
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    )}
                    {(usageSummary?.plan || 'free') === 'professional' && (
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Upgrade to Enterprise
                      </Button>
                    )}
                    {(usageSummary?.plan || 'free') !== 'free' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleBillingPortal}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Billing
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Detailed Usage Limits
                </CardTitle>
                <CardDescription>
                  Track your current usage against plan limits with visual indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {/* Work Orders */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Work Orders</span>
                          <p className="text-xs text-gray-500">Create and manage work orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {usageSummary?.currentUsage?.workOrders || 0}
                        </span>
                        <div className="text-xs text-gray-500">
                          of {usageSummary?.remaining?.workOrders === null ? '∞' : (usageSummary?.currentUsage?.workOrders || 0) + (usageSummary?.remaining?.workOrders || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(getUsagePercentage(usageSummary?.currentUsage?.workOrders || 0, usageSummary?.remaining?.workOrders))}`}
                        style={{ width: `${getUsagePercentage(usageSummary?.currentUsage?.workOrders || 0, usageSummary?.remaining?.workOrders)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Team Members</span>
                          <p className="text-xs text-gray-500">Add workers to your team</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {usageSummary?.currentUsage?.teamMembers || 0}
                        </span>
                        <div className="text-xs text-gray-500">
                          of {usageSummary?.remaining?.teamMembers === null ? '∞' : (usageSummary?.currentUsage?.teamMembers || 0) + (usageSummary?.remaining?.teamMembers || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(getUsagePercentage(usageSummary?.currentUsage?.teamMembers || 0, usageSummary?.remaining?.teamMembers))}`}
                        style={{ width: `${getUsagePercentage(usageSummary?.currentUsage?.teamMembers || 0, usageSummary?.remaining?.teamMembers)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* API Calls */}
                  {(usageSummary?.plan || 'free') !== 'free' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Zap className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">API Calls</span>
                            <p className="text-xs text-gray-500">Integrate with external systems</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">
                            {usageSummary?.currentUsage?.apiCalls || 0}
                          </span>
                          <div className="text-xs text-gray-500">
                            of {usageSummary?.remaining?.apiCalls === null ? '∞' : (usageSummary?.currentUsage?.apiCalls || 0) + (usageSummary?.remaining?.apiCalls || 0)}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(getUsagePercentage(usageSummary?.currentUsage?.apiCalls || 0, usageSummary?.remaining?.apiCalls))}`}
                          style={{ width: `${getUsagePercentage(usageSummary?.currentUsage?.apiCalls || 0, usageSummary?.remaining?.apiCalls)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Storage */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Database className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Storage</span>
                          <p className="text-xs text-gray-500">File storage and attachments</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {Math.round((usageSummary?.currentUsage?.storageMB || 0) / 1024 * 100) / 100} GB
                        </span>
                        <div className="text-xs text-gray-500">
                          of {usageSummary?.remaining?.storageMB === null ? '∞' : Math.round(((usageSummary?.currentUsage?.storageMB || 0) + (usageSummary?.remaining?.storageMB || 0)) / 1024 * 100) / 100} GB
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(getUsagePercentage(usageSummary?.currentUsage?.storageMB || 0, usageSummary?.remaining?.storageMB))}`}
                        style={{ width: `${getUsagePercentage(usageSummary?.currentUsage?.storageMB || 0, usageSummary?.remaining?.storageMB)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="integrations">
          <div className="grid gap-6">
            {/* QuickBooks Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  QuickBooks Integration
                </CardTitle>
                <CardDescription>
                  Connect your QuickBooks account to sync customers, invoices, and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuickBooksIntegration />
              </CardContent>
            </Card>

            {/* API Access */}
            {(usageSummary?.plan || 'free') !== 'free' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    API Access
                  </CardTitle>
                  <CardDescription>
                    Access your data programmatically with our REST API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">API Status</h4>
                        <p className="text-sm text-gray-600">Available for Professional and Enterprise plans</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">API Endpoints</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>• GET /api/orders - List work orders</div>
                        <div>• POST /api/orders - Create work order</div>
                        <div>• GET /api/clients - List clients</div>
                        <div>• GET /api/services - List services</div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Code className="mr-2 h-4 w-4" />
                      View API Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Webhooks */}
            {(usageSummary?.plan || 'free') === 'enterprise' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhooks
                  </CardTitle>
                  <CardDescription>
                    Receive real-time notifications when events occur
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Webhook Status</h4>
                        <p className="text-sm text-gray-600">Available for Enterprise plan</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Available Events</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>• order.created - When a work order is created</div>
                        <div>• order.updated - When a work order is updated</div>
                        <div>• order.completed - When a work order is completed</div>
                        <div>• client.created - When a client is created</div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Webhook className="mr-2 h-4 w-4" />
                      Configure Webhooks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="security">
          <div className="grid gap-6">
            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldIcon className="h-5 w-5" />
                  Account Security
                </CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Password</label>
                  <Button variant="outline" onClick={handleResetPassword} className="justify-start">
                    <Key className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    We'll send a password reset link to your email address
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Danger Zone</h4>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="font-medium text-red-800 mb-2">Delete Account</h5>
                    <p className="text-sm text-red-700 mb-3">
                      This will permanently delete your account and all associated data including orders, clients, services, and workers. This action cannot be undone.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleDeleteAccount} 
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-300"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {loading ? 'Deleting Account...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upgrade Your Plan</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PaymentHandler 
                currentPlan={usageSummary?.plan || 'free'}
                onSuccess={() => {
                  setShowPaymentModal(false)
                  fetchData() // Refresh data
                }}
                onError={(error) => {
                  setError(error)
                  setShowPaymentModal(false)
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 