'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw, Wifi, Database, Clock } from 'lucide-react'

export default function MaintenancePage() {
  const [lastCheck, setLastCheck] = useState<Date>(new Date())
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState<'down' | 'checking' | 'up'>('down')

  const checkHealth = async () => {
    setIsChecking(true)
    setStatus('checking')
    
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      
      if (data.status === 'healthy' || data.status === 'degraded') {
        setStatus('up')
        // Redirect back to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        setStatus('down')
      }
    } catch (error) {
      setStatus('down')
    } finally {
      setIsChecking(false)
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    // Auto-check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Service Temporarily Unavailable
            </CardTitle>
            <CardDescription className="text-slate-600">
              We're experiencing technical difficulties with our database connection. 
              Our team has been notified and is working to resolve this issue.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status Indicator */}
            <div className="flex items-center justify-center space-x-2">
              <Badge 
                variant={status === 'up' ? 'default' : status === 'checking' ? 'secondary' : 'destructive'}
                className="text-sm"
              >
                {status === 'up' ? 'Service Restored' : status === 'checking' ? 'Checking...' : 'Service Down'}
              </Badge>
              {status === 'checking' && <RefreshCw className="h-4 w-4 animate-spin" />}
            </div>

            {/* Service Status */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Database</span>
                </div>
                <Badge variant={status === 'up' ? 'default' : 'destructive'} className="text-xs">
                  {status === 'up' ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Network</span>
                </div>
                <Badge variant="default" className="text-xs">Connected</Badge>
              </div>
            </div>

            {/* Estimated Resolution */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Estimated Resolution</span>
              </div>
              <p className="text-sm text-slate-600">
                We expect to have this resolved within 5-10 minutes. 
                Thank you for your patience.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={checkHealth} 
                disabled={isChecking}
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>

            {/* Last Check */}
            <div className="text-xs text-slate-500">
              Last checked: {lastCheck.toLocaleTimeString()}
            </div>

            {/* Contact Info */}
            <div className="border-t pt-4">
              <p className="text-xs text-slate-500">
                If this issue persists, please contact support at{' '}
                <a href="mailto:support@effortless.com" className="text-blue-600 hover:underline">
                  support@effortless.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 