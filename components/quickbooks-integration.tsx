'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, RefreshCw, CheckCircle, AlertCircle, Loader2, ExternalLink, X } from 'lucide-react'

interface QuickBooksStatus {
  connected: boolean
  isExpired?: boolean
  expiresAt?: string
  realmId?: string
  message: string
}

interface SyncResults {
  customers: number
  services: number
  invoices: number
  errors: string[]
}

const QuickBooksIntegration = () => {
  const [status, setStatus] = useState<QuickBooksStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResults, setSyncResults] = useState<SyncResults | null>(null)
  const [message, setMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [debugLoading, setDebugLoading] = useState(false)
  const [debugError, setDebugError] = useState('')

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/quickbooks/status')
      const data = await res.json()
      
      if (data.error) {
        setStatus({
          connected: false,
          message: data.error
        })
      } else {
        setStatus(data)
      }
    } catch (error) {
      setStatus({
        connected: false,
        message: 'Failed to check QuickBooks status'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleConnect = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/quickbooks/auth')
      const data = await res.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        setMessage(data.error || 'Failed to start QuickBooks connection')
      }
    } catch (error) {
      setMessage('Failed to start QuickBooks connection')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    setMessage('Refreshing tokens...')
    try {
      const res = await fetch('/api/quickbooks/refresh', {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage('Tokens refreshed successfully!')
        await fetchStatus()
      } else {
        setMessage(data.error || 'Failed to refresh tokens')
      }
    } catch (error) {
      setMessage('Failed to refresh tokens')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect QuickBooks? This will require you to reconnect.')) {
      return
    }
    
    setLoading(true)
    setMessage('Disconnecting...')
    try {
      const res = await fetch('/api/quickbooks/disconnect', {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage('QuickBooks disconnected successfully!')
        setStatus(null)
        setSyncResults(null)
      } else {
        setMessage(data.error || 'Failed to disconnect')
      }
    } catch (error) {
      setMessage('Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setLoading(true)
    setMessage('Testing connection...')
    try {
      const res = await fetch('/api/quickbooks/test')
      const data = await res.json()
      
      if (data.success) {
        setMessage(`Connection test successful! Found ${data.customerCount} customers in QuickBooks.`)
      } else {
        if (data.error && data.error.includes('revoked')) {
          setMessage('QuickBooks tokens have been revoked. Please reconnect to QuickBooks.')
          // Update status to show as expired
          setStatus(prev => prev ? { ...prev, isExpired: true } : null)
        } else {
          setMessage(`Connection test failed: ${data.error}`)
        }
      }
    } catch (error) {
      setMessage('Connection test failed - network error')
    } finally {
      setLoading(false)
    }
  }

  const handleDebugConfig = async () => {
    setLoading(true)
    setMessage('Checking configuration...')
    try {
      const res = await fetch('/api/quickbooks/debug')
      const data = await res.json()
      
      if (data.success) {
        setMessage('Configuration check completed. Check browser console for details.')
      } else {
        setMessage(`Configuration check failed: ${data.error}`)
      }
    } catch (error) {
      setMessage('Configuration check failed - network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (syncType?: 'customers' | 'services' | 'invoices') => {
    setSyncLoading(true)
    setMessage('Syncing...')
    setSyncResults(null)
    
    try {
      const res = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType })
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage(data.message)
        setSyncResults(data.results)
      } else {
        if (data.error && data.error.includes('revoked')) {
          setMessage('QuickBooks tokens have been revoked. Please reconnect to QuickBooks.')
          // Update status to show as expired
          setStatus(prev => prev ? { ...prev, isExpired: true } : null)
        } else {
          setMessage(data.error || 'Sync failed')
        }
      }
    } catch (error) {
      setMessage('Sync failed - network error')
    } finally {
      setSyncLoading(false)
    }
  }

  const handleShowDebugInfo = async () => {
    setDebugLoading(true)
    setDebugError('')
    setDebugInfo(null)
    try {
      const res = await fetch('/api/quickbooks/debug')
      const data = await res.json()
      if (data.success) {
        setDebugInfo(data)
      } else {
        setDebugError(data.error || 'Failed to fetch debug info')
      }
    } catch (error) {
      setDebugError('Failed to fetch debug info')
    } finally {
      setDebugLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!status) return null
    
    if (status.connected) {
      if (status.isExpired) {
        return <Badge variant="destructive">Expired</Badge>
      }
      return <Badge variant="default">Connected</Badge>
    }
    return <Badge variant="secondary">Disconnected</Badge>
  }

  const getStatusIcon = () => {
    if (!status) return <Loader2 className="h-4 w-4 animate-spin" />
    
    if (status.connected) {
      if (status.isExpired) {
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      }
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    return <AlertCircle className="h-4 w-4 text-red-600" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          QuickBooks Integration
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Connect your account to QuickBooks for automatic customer, service, and invoice synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">
              {status?.message || 'Checking status...'}
            </span>
          </div>
          {status?.expiresAt && status.connected && (
            <span className="text-xs text-muted-foreground">
              Expires: {new Date(status.expiresAt).toLocaleString()}
            </span>
          )}
        </div>

        {/* Connection Actions */}
        <div className="flex gap-2">
          {(!status?.connected || status?.isExpired) && (
            <Button 
              onClick={handleConnect} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              {loading ? 'Connecting...' : 'Connect to QuickBooks'}
            </Button>
          )}
          
          {status?.isExpired && (
            <Button 
              onClick={handleRefresh} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {loading ? 'Refreshing...' : 'Refresh Tokens'}
            </Button>
          )}
          
          {status?.connected && (
            <>
              <Button 
                onClick={handleTestConnection} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {loading ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button 
                onClick={handleDebugConfig} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {loading ? 'Checking...' : 'Debug Config'}
              </Button>
              <Button 
                onClick={handleDisconnect} 
                disabled={loading}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {loading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </>
          )}
          
          <Button 
            onClick={() => fetchStatus()} 
            disabled={loading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Sync Actions */}
        {status?.connected && !status?.isExpired && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">Sync Data</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button
                onClick={() => handleSync('customers')}
                disabled={syncLoading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {syncLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Sync Customers
              </Button>
              
              <Button
                onClick={() => handleSync('services')}
                disabled={syncLoading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {syncLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Sync Services
              </Button>
              
              <Button
                onClick={() => handleSync('invoices')}
                disabled={syncLoading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {syncLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Sync Invoices
              </Button>
            </div>
            
            <Button
              onClick={() => handleSync()}
              disabled={syncLoading}
              className="w-full flex items-center gap-2"
            >
              {syncLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {syncLoading ? 'Syncing All...' : 'Sync All Data'}
            </Button>
          </div>
        )}

        {/* Sync Results */}
        {syncResults && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <h4 className="text-sm font-medium">Last Sync Results</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-green-600">{syncResults.customers}</div>
                <div className="text-muted-foreground">Customers</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-600">{syncResults.services}</div>
                <div className="text-muted-foreground">Services</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600">{syncResults.invoices}</div>
                <div className="text-muted-foreground">Invoices</div>
              </div>
            </div>
            {syncResults.errors.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-red-600 mb-1">Errors:</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {syncResults.errors.slice(0, 3).map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                  {syncResults.errors.length > 3 && (
                    <div>• ... and {syncResults.errors.length - 3} more</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('success') || message.includes('completed')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div>
          <Button onClick={handleShowDebugInfo} disabled={debugLoading} variant="outline" size="sm">
            {debugLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {debugLoading ? 'Loading Debug Info...' : 'Show Debug Info'}
          </Button>
          {debugError && (
            <div className="mt-2 text-sm text-red-600">{debugError}</div>
          )}
          {debugInfo && (
            <div className="mt-2 p-3 bg-muted rounded-lg text-xs space-y-1">
              <div><span className="font-medium">Environment:</span> {debugInfo.environment}</div>
              <div><span className="font-medium">Realm ID:</span> {debugInfo.realmId}</div>
              <div><span className="font-medium">Company Name:</span> {debugInfo.companyName || <span className="italic text-muted-foreground">(not available)</span>}</div>
              <div><span className="font-medium">User ID:</span> {debugInfo.userId}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickBooksIntegration 