import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get QuickBooks tokens from database
    const { data: integration, error: integrationError } = await supabase
      .from('quickbooks_integrations')
      .select('access_token, refresh_token, realm_id')
      .eq('user_id', user.id)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'QuickBooks integration not found' }, { status: 404 })
    }

    if (!integration.access_token || !integration.realm_id) {
      return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 })
    }

    console.log('=== QUICKBOOKS ENDPOINT VALIDATION TEST ===')
    
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
    const realmId = integration.realm_id
    const accessToken = integration.access_token

    // Test different endpoint variations
    const endpointTests = [
      {
        name: 'Standard customer endpoint (singular)',
        endpoint: `/v3/company/${realmId}/customer`,
        method: 'POST'
      },
      {
        name: 'Plural customer endpoint', 
        endpoint: `/v3/company/${realmId}/customers`,
        method: 'POST'
      },
      {
        name: 'GET customer endpoint (to verify it exists)',
        endpoint: `/v3/company/${realmId}/customer`,
        method: 'GET'
      },
      {
        name: 'GET customers endpoint (to verify it exists)',
        endpoint: `/v3/company/${realmId}/customers`,
        method: 'GET'
      },
      {
        name: 'Test Item creation (working endpoint)',
        endpoint: `/v3/company/${realmId}/item`,
        method: 'POST'
      }
    ]

    const results = []

    for (const test of endpointTests) {
      console.log(`\n--- Testing: ${test.name} ---`)
      
      const url = `${baseUrl}${test.endpoint}?minorversion=40`
      
      const requestOptions: any = {
        method: test.method,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }

      // Only add body for POST requests
      if (test.method === 'POST') {
        requestOptions.headers['Content-Type'] = 'application/json'
        
        if (test.endpoint.includes('/item')) {
          // Test item creation (we know this works)
          requestOptions.body = JSON.stringify({
            Item: {
              Name: "EndpointTestItem",
              Type: "Service"
            }
          })
        } else {
          // Test customer creation
          requestOptions.body = JSON.stringify({
            Customer: {
              Name: "EndpointTest"
            }
          })
        }
      }

      try {
        const response = await fetch(url, requestOptions)
        const responseText = await response.text()
        
        let parsedResponse = null
        try {
          parsedResponse = JSON.parse(responseText)
        } catch (e) {
          // Response might not be JSON
        }

        const result = {
          testCase: test.name,
          endpoint: test.endpoint,
          method: test.method,
          url,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          response: responseText,
          parsedResponse,
          headers: Object.fromEntries(response.headers.entries())
        }

        results.push(result)
        
        console.log(`${test.name} Result:`, {
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          responseLength: responseText?.length
        })

      } catch (error) {
        const result = {
          testCase: test.name,
          endpoint: test.endpoint,
          method: test.method,
          url,
          error: error instanceof Error ? error.message : String(error),
          success: false
        }
        
        results.push(result)
        console.error(`${test.name} Error:`, error)
      }
    }

    // Summary
    const summary = {
      totalTests: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      successfulTests: results.filter(r => r.success).map(r => r.testCase),
      failedTests: results.filter(r => !r.success).map(r => r.testCase)
    }

    return NextResponse.json({
      success: true,
      message: 'Endpoint validation testing completed',
      results,
      summary
    })

  } catch (error) {
    console.error('Endpoint validation test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 