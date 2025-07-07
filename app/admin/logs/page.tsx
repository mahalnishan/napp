'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  User,
  Activity,
  FileText,
  Eye,
  Trash2,
  Archive,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  source: string
  user_id?: string
  user_email?: string
  metadata?: Record<string, any>
  stack_trace?: string
  request_id?: string
  ip_address?: string
  user_agent?: string
}

interface LogStats {
  totalLogs: number
  errorCount: number
  warningCount: number
  infoCount: number
  debugCount: number
  topSources: Array<{
    source: string
    count: number
  }>
  hourlyDistribution: Array<{
    hour: string
    count: number
  }>
  recentErrors: LogEntry[]
}

interface LogFilter {
  level: string
  source: string
  timeRange: string
  searchTerm: string
  userId?: string
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LogFilter>({
    level: 'all',
    source: 'all',
    timeRange: '24h',
    searchTerm: ''
  })
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchLogs()
  }, [filter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      
      // Mock log data - in real app, this would come from logging service
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Database connection failed',
          source: 'database',
          user_id: 'user123',
          user_email: 'user@example.com',
          metadata: { connection_pool: 'primary', retry_count: 3 },
          stack_trace: 'Error: Connection timeout\n  at Database.connect (db.js:45)\n  at async handler (api.js:12)',
          request_id: 'req_abc123',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'warning',
          message: 'Rate limit approaching for API key',
          source: 'api',
          metadata: { api_key: 'sk_test_...', current_usage: 950, limit: 1000 },
          request_id: 'req_def456',
          ip_address: '10.0.0.1'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          level: 'info',
          message: 'User successfully logged in',
          source: 'auth',
          user_id: 'user456',
          user_email: 'admin@example.com',
          metadata: { login_method: 'email', session_id: 'sess_xyz789' },
          ip_address: '203.0.113.1'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          level: 'error',
          message: 'Payment processing failed',
          source: 'payment',
          user_id: 'user789',
          user_email: 'customer@example.com',
          metadata: { 
            payment_id: 'pay_123456',
            amount: 2400,
            currency: 'USD',
            error_code: 'card_declined'
          },
          stack_trace: 'PaymentError: Card declined\n  at StripeService.charge (stripe.js:78)',
          request_id: 'req_ghi789'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          level: 'debug',
          message: 'Cache miss for user profile',
          source: 'cache',
          user_id: 'user123',
          metadata: { cache_key: 'user_profile_123', ttl: 3600 }
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 1500000).toISOString(),
          level: 'info',
          message: 'Backup completed successfully',
          source: 'backup',
          metadata: { 
            backup_id: 'backup_20240115',
            size: '2.4GB',
            duration: '45 minutes'
          }
        },
        {
          id: '7',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          level: 'warning',
          message: 'High memory usage detected',
          source: 'system',
          metadata: { 
            memory_usage: '85%',
            available_memory: '1.2GB',
            threshold: '80%'
          }
        },
        {
          id: '8',
          timestamp: new Date(Date.now() - 2100000).toISOString(),
          level: 'error',
          message: 'Email delivery failed',
          source: 'email',
          user_id: 'user456',
          user_email: 'user@example.com',
          metadata: {
            email_type: 'order_confirmation',
            smtp_error: 'Connection refused',
            retry_count: 2
          },
          stack_trace: 'SMTPError: Connection refused\n  at EmailService.send (email.js:34)'
        }
      ]

      // Apply filters
      let filteredLogs = mockLogs

      if (filter.level !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level)
      }

      if (filter.source !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.source === filter.source)
      }

      if (filter.searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
          log.source.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
          log.user_email?.toLowerCase().includes(filter.searchTerm.toLowerCase())
        )
      }

      // Apply time range filter
      const now = Date.now()
      const timeRangeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }[filter.timeRange] || 24 * 60 * 60 * 1000

      filteredLogs = filteredLogs.filter(log => 
        now - new Date(log.timestamp).getTime() <= timeRangeMs
      )

      // Calculate stats
      const stats: LogStats = {
        totalLogs: mockLogs.length,
        errorCount: mockLogs.filter(log => log.level === 'error').length,
        warningCount: mockLogs.filter(log => log.level === 'warning').length,
        infoCount: mockLogs.filter(log => log.level === 'info').length,
        debugCount: mockLogs.filter(log => log.level === 'debug').length,
        topSources: [
          { source: 'api', count: 145 },
          { source: 'auth', count: 89 },
          { source: 'database', count: 67 },
          { source: 'payment', count: 34 },
          { source: 'email', count: 23 }
        ],
        hourlyDistribution: [
          { hour: '00:00', count: 12 },
          { hour: '04:00', count: 8 },
          { hour: '08:00', count: 45 },
          { hour: '12:00', count: 78 },
          { hour: '16:00', count: 92 },
          { hour: '20:00', count: 56 }
        ],
        recentErrors: mockLogs.filter(log => log.level === 'error').slice(0, 5)
      }

      setLogs(filteredLogs)
      setStats(stats)
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to fetch logs'
      })
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return
    }

    try {
      // In real app, this would clear logs from the logging service
      setLogs([])
      toast.success({
        title: 'Success',
        description: 'Logs cleared successfully'
      })
    } catch (error) {
      console.error('Error clearing logs:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to clear logs'
      })
    }
  }

  const exportLogs = async () => {
    try {
      // In real app, this would export logs to a file
      const logData = logs.map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        source: log.source,
        message: log.message,
        user_email: log.user_email,
        metadata: JSON.stringify(log.metadata)
      }))

      const csvContent = [
        'Timestamp,Level,Source,Message,User,Metadata',
        ...logData.map(log => 
          `${log.timestamp},${log.level},${log.source},"${log.message}",${log.user_email || ''},${log.metadata}`
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.success({
        title: 'Success',
        description: 'Logs exported successfully'
      })
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to export logs'
      })
    }
  }

  const getLevelBadge = (level: string) => {
    const levelConfig = {
      error: { label: 'Error', className: 'bg-red-100 text-red-800', icon: XCircle },
      warning: { label: 'Warning', className: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      info: { label: 'Info', className: 'bg-blue-100 text-blue-800', icon: Info },
      debug: { label: 'Debug', className: 'bg-gray-100 text-gray-800', icon: CheckCircle }
    }
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.info
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
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatMetadata = (metadata: Record<string, any>) => {
    return JSON.stringify(metadata, null, 2)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground">Monitor system activity and troubleshoot issues</p>
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
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground">Monitor system activity and troubleshoot issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={clearLogs} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLogs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.errorCount}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.warningCount}</div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.infoCount}</div>
            <p className="text-xs text-muted-foreground">
              Normal activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debug</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats?.debugCount}</div>
            <p className="text-xs text-muted-foreground">
              Development logs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">All Logs</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter logs by level, source, and time range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search logs..."
                      value={filter.searchTerm}
                      onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Level</label>
                  <Select value={filter.level} onValueChange={(value) => setFilter(prev => ({ ...prev, level: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Source</label>
                  <Select value={filter.source} onValueChange={(value) => setFilter(prev => ({ ...prev, source: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="auth">Auth</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Time Range</label>
                  <Select value={filter.timeRange} onValueChange={(value) => setFilter(prev => ({ ...prev, timeRange: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card>
            <CardHeader>
              <CardTitle>Log Entries</CardTitle>
              <CardDescription>
                Showing {logs.length} log entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <Card key={log.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedLog(log)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getLevelBadge(log.level)}
                          <Badge variant="outline">{log.source}</Badge>
                          <span className="text-sm text-gray-500">{formatDate(log.timestamp)}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">{log.message}</p>
                        {log.user_email && (
                          <p className="text-sm text-gray-500">
                            <User className="h-4 w-4 inline mr-1" />
                            {log.user_email}
                          </p>
                        )}
                        {log.request_id && (
                          <p className="text-sm text-gray-500">
                            Request ID: <code className="text-xs bg-gray-100 px-1 rounded">{log.request_id}</code>
                          </p>
                        )}
                        {log.metadata && (
                          <div className="text-sm text-gray-500">
                            <details className="cursor-pointer">
                              <summary className="font-medium">Metadata</summary>
                              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                {formatMetadata(log.metadata)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {logs.length === 0 && (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No logs found</h3>
                  <p className="text-gray-500">No logs match your current filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Critical errors that require immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentErrors.map((error) => (
                  <Card key={error.id} className="border-red-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-semibold text-red-900">{error.message}</p>
                            <p className="text-sm text-red-700">{error.source} • {formatDate(error.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {error.stack_trace && (
                        <div className="bg-red-50 p-3 rounded">
                          <p className="text-sm font-medium text-red-900 mb-2">Stack Trace:</p>
                          <pre className="text-xs text-red-800 overflow-auto">{error.stack_trace}</pre>
                        </div>
                      )}
                      {error.metadata && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">Error Details:</p>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                            {formatMetadata(error.metadata)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Log Sources</CardTitle>
                <CardDescription>Most active components generating logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topSources.map((source, index) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <span className="font-medium">{source.source}</span>
                      </div>
                      <Badge variant="outline">{source.count} logs</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Distribution</CardTitle>
                <CardDescription>Log activity throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.hourlyDistribution.map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{hour.hour}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(hour.count / 100) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{hour.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Log Details</h2>
              <Button variant="ghost" onClick={() => setSelectedLog(null)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Level</label>
                  <div className="mt-1">{getLevelBadge(selectedLog.level)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Source</label>
                  <p className="mt-1">{selectedLog.source}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <p className="mt-1">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Request ID</label>
                  <p className="mt-1 font-mono text-sm">{selectedLog.request_id || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Message</label>
                <p className="mt-1 p-3 bg-gray-50 rounded">{selectedLog.message}</p>
              </div>
              
              {selectedLog.stack_trace && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Stack Trace</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-sm overflow-auto">
                    {selectedLog.stack_trace}
                  </pre>
                </div>
              )}
              
              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Metadata</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-sm overflow-auto">
                    {formatMetadata(selectedLog.metadata)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 