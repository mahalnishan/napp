'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react'

interface Report {
  id: string
  name: string
  type: string
  status: 'generating' | 'completed' | 'failed'
  created_at: string
  download_url?: string
  data?: any
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState('')
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const supabase = createClient()
      
      // For now, we'll create mock reports since we don't have a reports table
      // In a real implementation, you'd fetch from a reports table
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Monthly Revenue Report',
          type: 'revenue',
          status: 'completed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          download_url: '#'
        },
        {
          id: '2',
          name: 'User Activity Report',
          type: 'users',
          status: 'completed',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          download_url: '#'
        },
        {
          id: '3',
          name: 'Order Performance Report',
          type: 'orders',
          status: 'generating',
          created_at: new Date().toISOString()
        }
      ]

      setReports(mockReports)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!selectedReportType) return

    setGenerating(true)
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newReport: Report = {
        id: Date.now().toString(),
        name: `${selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        type: selectedReportType,
        status: 'completed',
        created_at: new Date().toISOString(),
        download_url: '#'
      }
      
      setReports(prev => [newReport, ...prev])
      setSelectedReportType('')
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = (report: Report) => {
    if (report.status !== 'completed') return
    
    // In a real implementation, this would trigger a download
    alert(`Downloading ${report.name}...`)
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

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <DollarSign className="h-4 w-4" />
      case 'users': return <Users className="h-4 w-4" />
      case 'orders': return <FileText className="h-4 w-4" />
      case 'analytics': return <BarChart3 className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'generating': return 'text-blue-600 bg-blue-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const reportTypes = [
    { value: 'revenue', label: 'Revenue Report', description: 'Financial performance and revenue analytics' },
    { value: 'users', label: 'User Activity Report', description: 'User registration and activity metrics' },
    { value: 'orders', label: 'Order Performance Report', description: 'Order processing and completion rates' },
    { value: 'analytics', label: 'Analytics Report', description: 'Comprehensive system analytics' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and manage system reports</p>
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
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and manage system reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <FileText className="h-3 w-3 mr-1" />
            {reports.length} Reports
          </Badge>
        </div>
      </div>

      {/* Generate New Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generate New Report
          </CardTitle>
          <CardDescription>Create a new system report with custom parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select report type...</option>
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
          </div>
          
          {selectedReportType && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {reportTypes.find(t => t.value === selectedReportType)?.description}
              </p>
            </div>
          )}
          
          <Button 
            onClick={generateReport} 
            disabled={!selectedReportType || generating}
            className="w-full md:w-auto"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map(type => (
          <Card key={type.value} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getReportIcon(type.value)}
                <CardTitle className="text-sm">{type.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">{type.description}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedReportType(type.value)}
                className="w-full"
              >
                Generate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Reports
          </CardTitle>
          <CardDescription>Recently generated reports and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getReportIcon(report.type)}
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-sm text-gray-500">
                        Generated {formatDate(report.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                  
                  {report.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadReport(report)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  
                  {report.status === 'generating' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </div>
                  )}
                  
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {reports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated yet</h3>
              <p className="text-gray-500">Generate your first report to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-gray-500">Active schedules</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0 MB</p>
            <p className="text-xs text-gray-500">Report storage</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {reports.length > 0 ? formatDate(reports[0].created_at) : 'Never'}
            </p>
            <p className="text-xs text-gray-500">Most recent report</p>
            <Button variant="outline" size="sm" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 