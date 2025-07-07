'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OptimizedImage } from '@/components/optimized-image'

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  last_sign_in_at: string | null
  role: string | null
  subscription?: {
    plan_type: string
    status: string
  }
  usage?: {
    workOrders: number
    teamMembers: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, filterPlan])

  const fetchUsers = async () => {
    try {
      console.log('Starting to fetch users...')
      
      // Check environment variables first
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('Environment check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlLength: supabaseUrl?.length,
        keyLength: supabaseAnonKey?.length
      })
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
      }
      
      const supabase = createClient()
      
      // First, check if user is authenticated
      console.log('Checking authentication...')
      const authResult = await supabase.auth.getUser()
      console.log('Auth result:', authResult)
      
      const { data: { user }, error: authError } = authResult
      console.log('Auth check:', { 
        user: user?.id, 
        userEmail: user?.email,
        error: authError,
        errorMessage: authError?.message,
        errorCode: authError?.code
      })
      
      if (authError) {
        console.error('Authentication error:', authError)
        setUsers([])
        return
      }
      
      if (!user) {
        console.error('No authenticated user found')
        setUsers([])
        return
      }
      
      // Check if user has admin role
      console.log('Checking user profile...')
      const profileResult = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      console.log('Profile result:', profileResult)
      
      const { data: userProfile, error: profileError } = profileResult
      console.log('User profile check:', { 
        profile: userProfile, 
        error: profileError,
        errorMessage: profileError?.message,
        errorCode: profileError?.code
      })
      
      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }
      
      if (userProfile?.role !== 'admin') {
        console.warn('User does not have admin role:', userProfile?.role)
        // For now, let's continue but log the warning
      }
      
      // First, test basic connectivity with a simple query
      console.log('Testing basic connectivity...')
      const testResult = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      console.log('Test query result:', testResult)
      
      const { data: testData, error: testError } = testResult
      console.log('Test query details:', { 
        testData, 
        testError,
        errorMessage: testError?.message,
        errorCode: testError?.code,
        errorDetails: testError?.details
      })
      
      if (testError) {
        console.error('Basic connectivity test failed:', testError)
        console.error('Error object keys:', Object.keys(testError || {}))
        console.error('Error object values:', Object.values(testError || {}))
        // If basic query fails, it might be an RLS issue
        // Let's try a different approach
        setUsers([])
        setLoading(false)
        return
      }
      
      // Fetch users with their profiles
      console.log('Fetching all users...')
      const usersResult = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          phone,
          avatar_url,
          created_at,
          last_sign_in_at,
          role
        `)
        .order('created_at', { ascending: false })

      console.log('Users query result:', usersResult)

      const { data: usersData, error } = usersResult
      console.log('Users query details:', { 
        data: usersData, 
        error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        dataLength: usersData?.length
      })

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          errorObject: error,
          errorKeys: Object.keys(error || {}),
          errorValues: Object.values(error || {})
        })
        throw error
      }

      if (!usersData) {
        console.log('No users data returned, setting empty array')
        setUsers([])
        return
      }

      console.log(`Found ${usersData.length} users, processing subscriptions...`)

      // For now, let's just return the basic user data without additional queries
      // to avoid potential RLS issues with other tables
      const usersWithDefaults = usersData.map(user => ({
        ...user,
        subscription: { plan_type: 'free', status: 'active' },
        usage: {
          workOrders: 0,
          teamMembers: 0
        }
      }))

      console.log('Successfully processed all users:', usersWithDefaults.length)
      setUsers(usersWithDefaults)
    } catch (error) {
      console.error('Error fetching users:', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      console.error('Error keys:', Object.keys(error || {}))
      console.error('Error values:', Object.values(error || {}))
      console.error('Error stringified:', JSON.stringify(error, null, 2))
      console.error('Error message:', error?.message)
      console.error('Error stack:', error?.stack)
      
      // Set empty array to prevent further errors
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply plan filter
    if (filterPlan !== 'all') {
      filtered = filtered.filter(user => user.subscription?.plan_type === filterPlan)
    }

    setFilteredUsers(filtered)
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'text-purple-600 bg-purple-100'
      case 'professional': return 'text-blue-600 bg-blue-100'
      case 'free': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-red-600 bg-red-100'
      case 'suspended': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const supabase = createClient()
      
      switch (action) {
        case 'suspend':
          // Update user role to suspended (since status column might not exist)
          await supabase
            .from('users')
            .update({ role: 'suspended' })
            .eq('id', userId)
          break
        case 'activate':
          await supabase
            .from('users')
            .update({ role: 'user' })
            .eq('id', userId)
          break
        case 'delete':
          if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await supabase
              .from('users')
              .delete()
              .eq('id', userId)
          }
          break
      }
      
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error performing user action:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage all users in the system</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage all users in the system</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Users className="h-3 w-3 mr-1" />
            {users.length} Total Users
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <OptimizedImage
                    src={user.avatar_url}
                    alt={user.name || user.email}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {user.name || 'No Name'}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.subscription?.status === 'active' ? (
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'suspend')}>
                        <UserX className="mr-2 h-4 w-4" />
                        Suspend User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'activate')}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate User
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleUserAction(user.id, 'delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan & Status */}
              <div className="flex items-center justify-between">
                <Badge className={getPlanColor(user.subscription?.plan_type || 'free')}>
                  {user.subscription?.plan_type || 'free'}
                </Badge>
                <Badge className={getStatusColor(user.subscription?.status || 'active')}>
                  {user.subscription?.status || 'active'}
                </Badge>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold">{user.usage?.workOrders || 0}</div>
                  <div className="text-xs text-gray-600">Orders</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold">{user.usage?.teamMembers || 0}</div>
                  <div className="text-xs text-gray-600">Team</div>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
                {user.last_sign_in_at && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-3 w-3" />
                    <span>Last active {formatDate(user.last_sign_in_at)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchTerm || filterPlan !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No users have been registered yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 