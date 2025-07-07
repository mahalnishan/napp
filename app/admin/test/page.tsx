'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }])
  }

  const runTests = async () => {
    setLoading(true)
    setTestResults([])

    try {
      // Test 1: Environment variables
      addResult('Environment Variables', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
      })

      // Test 2: Client creation
      let supabase
      try {
        supabase = createClient()
        addResult('Client Creation', { success: true })
      } catch (error) {
        addResult('Client Creation', { success: false, error: error?.message })
        return
      }

      // Test 3: Authentication
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        addResult('Authentication', { 
          success: !error, 
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          error: error?.message
        })
      } catch (error) {
        addResult('Authentication', { success: false, error: error?.message })
      }

      // Test 4: Basic query
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .limit(1)
        
        addResult('Basic Query', { 
          success: !error, 
          hasData: !!data,
          dataLength: data?.length,
          error: error?.message,
          errorCode: error?.code
        })
      } catch (error) {
        addResult('Basic Query', { success: false, error: error?.message })
      }

      // Test 5: Count query
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
        
        addResult('Count Query', { 
          success: !error, 
          count,
          error: error?.message,
          errorCode: error?.code
        })
      } catch (error) {
        addResult('Count Query', { success: false, error: error?.message })
      }

      // Test 6: Full users query
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, role')
          .limit(5)
        
        addResult('Full Users Query', { 
          success: !error, 
          hasData: !!data,
          dataLength: data?.length,
          firstUser: data?.[0],
          error: error?.message,
          errorCode: error?.code
        })
      } catch (error) {
        addResult('Full Users Query', { success: false, error: error?.message })
      }

    } catch (error) {
      addResult('General Error', { error: error?.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supabase Connection Test</h1>
        <p className="text-muted-foreground">Debug Supabase connection issues</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading}>
            {loading ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{result.test}</h3>
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
                <p className="text-xs text-gray-500 mt-1">{result.timestamp}</p>
              </div>
            ))}
            {testResults.length === 0 && (
              <p className="text-muted-foreground">No tests run yet. Click "Run Tests" to start.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 