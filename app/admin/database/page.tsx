'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Database, 
  HardDrive, 
  Activity, 
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Settings,
  Play,
  Pause,
  Search,
  Filter,
  Eye,
  Edit,
  Copy,
  Save
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

interface DatabaseStats {
  totalTables: number
  totalRows: number
  databaseSize: string
  activeConnections: number
  queriesPerSecond: number
  avgQueryTime: number
  lastBackup: string
  uptime: string
}

interface TableInfo {
  name: string
  rowCount: number
  size: string
  lastModified: string
  schema: string
}

interface QueryLog {
  id: string
  query: string
  duration: number
  timestamp: string
  status: 'success' | 'error'
  user: string
}

interface BackupInfo {
  id: string
  name: string
  size: string
  created_at: string
  type: 'manual' | 'automatic'
  status: 'completed' | 'in_progress' | 'failed'
}

export default function AdminDatabasePage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([])
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [customQuery, setCustomQuery] = useState('')
  const [queryResult, setQueryResult] = useState<any>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDatabaseInfo()
  }, [])

  const fetchDatabaseInfo = async () => {
    try {
      const supabase = createClient()
      
      // Fetch table information
      const { data: tablesData } = await supabase.rpc('get_table_info')
      
      // Mock database stats - in real app, these would come from database monitoring
      const mockStats: DatabaseStats = {
        totalTables: 12,
        totalRows: 15420,
        databaseSize: '2.4 GB',
        activeConnections: 8,
        queriesPerSecond: 45,
        avgQueryTime: 12.5,
        lastBackup: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
        uptime: '15 days, 4 hours'
      }

      // Mock table info
      const mockTables: TableInfo[] = [
        { name: 'users', rowCount: 1245, size: '45.2 MB', lastModified: new Date().toISOString(), schema: 'public' },
        { name: 'work_orders', rowCount: 3420, size: '128.5 MB', lastModified: new Date().toISOString(), schema: 'public' },
        { name: 'clients', rowCount: 892, size: '32.1 MB', lastModified: new Date().toISOString(), schema: 'public' },
        { name: 'services', rowCount: 156, size: '8.7 MB', lastModified: new Date().toISOString(), schema: 'public' },
        { name: 'subscriptions', rowCount: 324, size: '12.3 MB', lastModified: new Date().toISOString(), schema: 'public' },
        { name: 'invoices', rowCount: 1876, size: '67.8 MB', lastModified: new Date().toISOString(), schema: 'public' },
        { name: 'payments', rowCount: 2103, size: '89.4 MB', lastModified: new Date().toISOString(), schema: 'public' },
        { name: 'notifications', rowCount: 5432, size: '156.2 MB', lastModified: new Date().toISOString(), schema: 'public' }
      ]

      // Mock query logs
      const mockQueryLogs: QueryLog[] = [
        {
          id: '1',
          query: 'SELECT * FROM users WHERE created_at > NOW() - INTERVAL \'1 day\'',
          duration: 25.6,
          timestamp: new Date().toISOString(),
          status: 'success',
          user: 'system'
        },
        {
          id: '2',
          query: 'UPDATE work_orders SET status = \'completed\' WHERE id = $1',
          duration: 8.2,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          status: 'success',
          user: 'api'
        },
        {
          id: '3',
          query: 'SELECT COUNT(*) FROM subscriptions WHERE status = \'active\'',
          duration: 156.7,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          status: 'error',
          user: 'admin'
        }
      ]

      // Mock backups
      const mockBackups: BackupInfo[] = [
        {
          id: '1',
          name: 'daily_backup_2024_01_15',
          size: '2.1 GB',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          type: 'automatic',
          status: 'completed'
        },
        {
          id: '2',
          name: 'manual_backup_2024_01_14',
          size: '2.0 GB',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          type: 'manual',
          status: 'completed'
        },
        {
          id: '3',
          name: 'daily_backup_2024_01_13',
          size: '1.9 GB',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          type: 'automatic',
          status: 'completed'
        }
      ]

      setStats(mockStats)
      setTables(mockTables)
      setQueryLogs(mockQueryLogs)
      setBackups(mockBackups)
    } catch (error) {
      console.error('Error fetching database info:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to fetch database information'
      })
    } finally {
      setLoading(false)
    }
  }

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) {
      toast.error({
        title: 'Error',
        description: 'Please enter a query to execute'
      })
      return
    }

    setQueryLoading(true)
    try {
      const supabase = createClient()
      
      // For safety, only allow SELECT queries in the admin interface
      if (!customQuery.trim().toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT queries are allowed for security reasons')
      }

      const { data, error } = await supabase.rpc('execute_custom_query', {
        query_text: customQuery
      })

      if (error) throw error
      
      setQueryResult(data)
      toast.success({
        title: 'Success',
        description: 'Query executed successfully'
      })
    } catch (error) {
      console.error('Error executing query:', error)
      toast.error({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute query'
      })
      setQueryResult(null)
    } finally {
      setQueryLoading(false)
    }
  }

  const createBackup = async () => {
    try {
      // In a real app, this would trigger a database backup
      toast.success({
        title: 'Backup Started',
        description: 'Database backup has been initiated'
      })
      
      // Add a new backup entry
      const newBackup: BackupInfo = {
        id: Date.now().toString(),
        name: `manual_backup_${new Date().toISOString().split('T')[0]}`,
        size: 'In Progress...',
        created_at: new Date().toISOString(),
        type: 'manual',
        status: 'in_progress'
      }
      
      setBackups(prev => [newBackup, ...prev])
      
      // Simulate backup completion after 3 seconds
      setTimeout(() => {
        setBackups(prev => prev.map(backup => 
          backup.id === newBackup.id 
            ? { ...backup, status: 'completed' as const, size: '2.4 GB' }
            : backup
        ))
        toast.success({
          title: 'Backup Completed',
          description: 'Database backup completed successfully'
        })
      }, 3000)
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to create backup'
      })
    }
  }

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
      return
    }

    try {
      // In a real app, this would restore from backup
      toast.success({
        title: 'Restore Started',
        description: 'Database restore has been initiated'
      })
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to restore backup'
      })
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return
    }

    try {
      setBackups(prev => prev.filter(backup => backup.id !== backupId))
      toast.success({
        title: 'Success',
        description: 'Backup deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast.error({
        title: 'Error',
        description: 'Failed to delete backup'
      })
    }
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { label: 'Success', className: 'bg-green-100 text-green-800' },
      error: { label: 'Error', className: 'bg-red-100 text-red-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground">Monitor and manage database operations</p>
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
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground">Monitor and manage database operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchDatabaseInfo}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={createBackup}>
            <Download className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.databaseSize}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalTables} tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRows.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.queriesPerSecond} queries/sec
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgQueryTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Performance metric
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="queries">Query Console</TabsTrigger>
          <TabsTrigger value="logs">Query Logs</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Health
                </CardTitle>
                <CardDescription>Current database status and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Connection Status</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uptime</span>
                  <span className="text-sm font-medium">{stats?.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Backup</span>
                  <span className="text-sm font-medium">{stats?.lastBackup ? formatDate(stats.lastBackup) : 'Never'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common database operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex-col">
                    <Download className="h-6 w-6 mb-2" />
                    <span>Backup Database</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col">
                    <Upload className="h-6 w-6 mb-2" />
                    <span>Restore Database</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col">
                    <RefreshCw className="h-6 w-6 mb-2" />
                    <span>Refresh Stats</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col">
                    <Eye className="h-6 w-6 mb-2" />
                    <span>View Logs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>Overview of all database tables and their statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tables.map((table) => (
                  <Card key={table.name}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{table.name}</h3>
                          <p className="text-sm text-gray-500">Schema: {table.schema}</p>
                        </div>
                        <Badge variant="outline">{table.rowCount.toLocaleString()} rows</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Size:</span>
                          <p className="font-medium">{table.size}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Modified:</span>
                          <p className="font-medium">{formatDate(table.lastModified)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Query Console</CardTitle>
              <CardDescription>Execute custom SQL queries (SELECT only for security)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your SQL query here... (SELECT statements only)"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                rows={6}
                className="font-mono"
              />
              <div className="flex gap-2">
                <Button onClick={executeCustomQuery} disabled={queryLoading}>
                  {queryLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute Query
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setCustomQuery('')}>
                  Clear
                </Button>
              </div>
              
              {queryResult && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Query Result:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
                    <pre className="text-sm">{JSON.stringify(queryResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Query Logs</CardTitle>
              <CardDescription>Recent database query activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queryLogs.map((log) => (
                  <Card key={log.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          <span className="text-sm text-gray-500">{log.user}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.duration}ms • {formatDate(log.timestamp)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                        {log.query}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Backups</CardTitle>
              <CardDescription>Manage database backups and restore points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.map((backup) => (
                  <Card key={backup.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{backup.name}</h3>
                          <p className="text-sm text-gray-500">
                            {backup.type === 'automatic' ? 'Automatic' : 'Manual'} backup
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(backup.status)}
                          <Badge variant="outline">{backup.size}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Created: {formatDate(backup.created_at)}
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => restoreBackup(backup.id)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={backup.status !== 'completed'}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteBackup(backup.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 