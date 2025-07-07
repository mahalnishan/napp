'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Zap, 
  Key, 
  Activity, 
  Shield,
  Globe,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
  BarChart3,
  Users,
  Server,
  Lock,
  Unlock
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used: string | null
  usage_count: number
  rate_limit: number
  status: 'active' | 'inactive' | 'revoked'
  permissions: string[]
  user_id?: string
  user?: {
    name: string
    email: string
  }
}

interface ApiEndpoint {
  path: string
  method: string
  requests_24h: number
  avg_response_time: number
  error_rate: number
  status: 'healthy' | 'degraded' | 'down'
  last_error?: string
}

interface ApiStats {
  totalRequests: number
  totalKeys: number
  activeKeys: number
  avgResponseTime: number
  errorRate: number
  topEndpoints: ApiEndpoint[]
  requestsOverTime: Array<{
    timestamp: string
    requests: number
  }>
}

interface RateLimitRule {
  id: string
  name: string
  requests_per_minute: number
  requests_per_hour: number
  requests_per_day: number
  applies_to: 'all' | 'specific_keys' | 'user_tier'
  status: 'active' | 'inactive'
}

export default function AdminApiPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [rateLimits, setRateLimits] = useState<RateLimitRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [newKeyName, setNewKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchApiData()
  }, [])

  const fetchApiData = async () => {
    try {
      const supabase = createClient()
      
      // Fetch API keys from database
      const { data: keysData } = await supabase
        .from('api_keys')
        .select(`
          *,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false })

      // Mock API endpoints data
      const mockEndpoints: ApiEndpoint[] = [
        {
          path: '/api/v1/orders',
          method: 'GET',
          requests_24h: 1245,
          avg_response_time: 120,
          error_rate: 0.5,
          status: 'healthy'
        },
        {
          path: '/api/v1/orders',
          method: 'POST',
          requests_24h: 342,
          avg_response_time: 250,
          error_rate: 2.1,
          status: 'healthy'
        },
        {
          path: '/api/v1/clients',
          method: 'GET',
          requests_24h: 892,
          avg_response_time: 95,
          error_rate: 0.2,
          status: 'healthy'
        },
        {
          path: '/api/v1/services',
          method: 'GET',
          requests_24h: 567,
          avg_response_time: 180,
          error_rate: 1.8,
          status: 'degraded'
        },
        {
          path: '/api/v1/auth/login',
          method: 'POST',
          requests_24h: 234,
          avg_response_time: 450,
          error_rate: 5.2,
          status: 'degraded',
          last_error: 'Rate limit exceeded'
        }
      ]

      // Mock API stats
      const totalRequests = mockEndpoints.reduce((sum, endpoint) => sum + endpoint.requests_24h, 0)
      const avgResponseTime = mockEndpoints.reduce((sum, endpoint) => sum + endpoint.avg_response_time, 0) / mockEndpoints.length
      const errorRate = mockEndpoints.reduce((sum, endpoint) => sum + endpoint.error_rate, 0) / mockEndpoints.length

      const mockStats: ApiStats = {
        totalRequests,
        totalKeys: keysData?.length || 0,
        activeKeys: keysData?.filter(key => key.status === 'active').length || 0,
        avgResponseTime,
        errorRate,
        topEndpoints: mockEndpoints.slice(0, 5),
        requestsOverTime: [
          { timestamp: '00:00', requests: 120 },
          { timestamp: '04:00', requests: 80 },
          { timestamp: '08:00', requests: 200 },
          { timestamp: '12:00', requests: 350 },
          { timestamp: '16:00', requests: 420 },
          { timestamp: '20:00', requests: 280 }
        ]
      }

      // Mock rate limit rules
      const mockRateLimits: RateLimitRule[] = [
        {
          id: '1',
          name: 'Default Rate Limit',
          requests_per_minute: 60,
          requests_per_hour: 1000,
          requests_per_day: 10000,
          applies_to: 'all',
          status: 'active'
        },
        {
          id: '2',
          name: 'Premium Users',
          requests_per_minute: 120,
          requests_per_hour: 5000,
          requests_per_day: 50000,
          applies_to: 'user_tier',
          status: 'active'
        },
        {
          id: '3',
          name: 'Internal APIs',
          requests_per_minute: 1000,
          requests_per_hour: 50000,
          requests_per_day: 1000000,
          applies_to: 'specific_keys',
          status: 'active'
        }
      ]

      setApiKeys(keysData || [])
      setEndpoints(mockEndpoints)
      setStats(mockStats)
      setRateLimits(mockRateLimits)
    } catch (error) {
      console.error('Error fetching API data:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to fetch API data'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error({
        title: 'Error',
        description: 'Please enter a name for the API key'
      })
      return
    }

    setCreatingKey(true)
    try {
      const supabase = createClient()
      
      // Generate a new API key
      const newKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName,
          key: newKey,
          status: 'active',
          rate_limit: 1000,
          permissions: ['read', 'write'],
          usage_count: 0
        })
        .select()
        .single()

      if (error) throw error

      setApiKeys(prev => [data, ...prev])
      setNewKeyName('')
      
      toast.success({
        title: 'Success',
        description: 'API key created successfully'
      })
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to create API key'
      })
    } finally {
      setCreatingKey(false)
    }
  }

  const revokeApiKey = async (keyId: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', keyId)

      if (error) throw error

      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, status: 'revoked' as const } : key
      ))
      
      toast.success({
        title: 'Success',
        description: 'API key revoked successfully'
      })
    } catch (error) {
      console.error('Error revoking API key:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to revoke API key'
      })
    }
  }

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)

      if (error) throw error

      setApiKeys(prev => prev.filter(key => key.id !== keyId))
      
      toast.success({
        title: 'Success',
        description: 'API key deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to delete API key'
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success({
      title: 'Copied',
      description: 'API key copied to clipboard'
    })
  }

  const toggleKeyVisibility = (keyId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800', icon: XCircle },
      revoked: { label: 'Revoked', className: 'bg-red-100 text-red-800', icon: XCircle },
      healthy: { label: 'Healthy', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      degraded: { label: 'Degraded', className: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      down: { label: 'Down', className: 'bg-red-100 text-red-800', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    const IconComponent = config.icon
    
    return (
      <Badge className={config.className}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const maskApiKey = (key: string) => {
    return `${key.substring(0, 8)}${'*'.repeat(24)}${key.substring(-4)}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Management</h1>
          <p className="text-muted-foreground">Manage API keys, endpoints, and rate limiting</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">API Management</h1>
          <p className="text-muted-foreground">Manage API keys, endpoints, and rate limiting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchApiData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeKeys}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalKeys} total keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Across all endpoints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.errorRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          {/* Create New Key */}
          <Card>
            <CardHeader>
              <CardTitle>Create New API Key</CardTitle>
              <CardDescription>Generate a new API key for accessing the API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter API key name..."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={generateApiKey} disabled={creatingKey}>
                  {creatingKey ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Key
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Keys List */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage existing API keys and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <Card key={apiKey.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{apiKey.name}</h3>
                          <p className="text-sm text-gray-500">
                            {apiKey.user ? `${apiKey.user.name} (${apiKey.user.email})` : 'System Key'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(apiKey.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(apiKey.key)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Key
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {apiKey.status === 'active' ? (
                                <DropdownMenuItem 
                                  onClick={() => revokeApiKey(apiKey.id)}
                                  className="text-orange-600"
                                >
                                  <Lock className="mr-2 h-4 w-4" />
                                  Revoke Key
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-green-600">
                                  <Unlock className="mr-2 h-4 w-4" />
                                  Activate Key
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => deleteApiKey(apiKey.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Key
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">API Key:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono">
                              {showSecrets[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleKeyVisibility(apiKey.id)}
                            >
                              {showSecrets[apiKey.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(apiKey.key)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Usage Count:</span>
                            <p className="font-medium">{apiKey.usage_count.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Rate Limit:</span>
                            <p className="font-medium">{apiKey.rate_limit}/hour</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <p className="font-medium">{formatDate(apiKey.created_at)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Used:</span>
                            <p className="font-medium">
                              {apiKey.last_used ? formatDate(apiKey.last_used) : 'Never'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-gray-500">Permissions:</span>
                          <div className="flex gap-2 mt-1">
                            {apiKey.permissions.map((permission) => (
                              <Badge key={permission} variant="outline">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {apiKeys.length === 0 && (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No API keys found</h3>
                  <p className="text-gray-500">Create your first API key to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Monitor API endpoint performance and health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{endpoint.method}</Badge>
                          <code className="text-sm">{endpoint.path}</code>
                        </div>
                        {getStatusBadge(endpoint.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Requests (24h):</span>
                          <p className="font-medium">{endpoint.requests_24h.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg Response:</span>
                          <p className="font-medium">{endpoint.avg_response_time}ms</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Error Rate:</span>
                          <p className="font-medium">{endpoint.error_rate}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <p className="font-medium">{endpoint.last_error || 'All good'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting Rules</CardTitle>
              <CardDescription>Configure API rate limits and throttling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rateLimits.map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{rule.name}</h3>
                          <p className="text-sm text-gray-500">
                            Applies to: {rule.applies_to.replace('_', ' ')}
                          </p>
                        </div>
                        {getStatusBadge(rule.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Per Minute:</span>
                          <p className="font-medium">{rule.requests_per_minute} requests</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Per Hour:</span>
                          <p className="font-medium">{rule.requests_per_hour.toLocaleString()} requests</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Per Day:</span>
                          <p className="font-medium">{rule.requests_per_day.toLocaleString()} requests</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Analytics</CardTitle>
              <CardDescription>Detailed analytics and usage patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-500">
                  Detailed analytics charts and reports will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 