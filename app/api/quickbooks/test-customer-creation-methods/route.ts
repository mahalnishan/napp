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

    console.log('=== CUSTOMER CREATION METHODS TEST ===')
    
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
    const realmId = integration.realm_id
    const accessToken = integration.access_token

    // Test different customer creation methods
    const testMethods = [
      {
        name: 'POST to /customer (our current approach)',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=40`,
        method: 'POST',
        body: { Customer: { Name: 'TestCustomer1' } }
      },
      {
        name: 'POST to /customers (plural)',
        url: `${baseUrl}/v3/company/${realmId}/customers?minorversion=40`,
        method: 'POST',
        body: { Customer: { Name: 'TestCustomer2' } }
      },
      {
        name: 'POST to /customer with different payload structure',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=40`,
        method: 'POST',
        body: { Name: 'TestCustomer3' }  // Without Customer wrapper
      },
      {
        name: 'PUT to /customer (update method)',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=40`,
        method: 'PUT',
        body: { Customer: { Name: 'TestCustomer4' } }
      },
      {
        name: 'POST to /customer with minimal version',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=1`,
        method: 'POST',
        body: { Customer: { Name: 'TestCustomer5' } }
      },
      {
        name: 'POST to /customer without minorversion',
        url: `${baseUrl}/v3/company/${realmId}/customer`,
        method: 'POST',
        body: { Customer: { Name: 'TestCustomer6' } }
      },
      {
        name: 'GET /customer to check if endpoint exists',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=40`,
        method: 'GET'
      },
      {
        name: 'GET /customers to check if plural endpoint exists',
        url: `${baseUrl}/v3/company/${realmId}/customers?minorversion=40`,
        method: 'GET'
      },
      {
        name: 'OPTIONS /customer to check supported methods',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=40`,
        method: 'OPTIONS'
      }
    ]

    const results = []

    for (const test of testMethods) {
      console.log(`\n--- Testing: ${test.name} ---`)
      
      const requestOptions: any = {
        method: test.method,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }

      if (test.body) {
        requestOptions.headers['Content-Type'] = 'application/json'
        requestOptions.body = JSON.stringify(test.body)
      }

      try {
        const response = await fetch(test.url, requestOptions)
        const responseText = await response.text()
        
        let parsedResponse = null
        try {
          parsedResponse = JSON.parse(responseText)
        } catch (e) {
          // Response might not be JSON
        }

        const result = {
          testCase: test.name,
          url: test.url,
          method: test.method,
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
          responseLength: responseText?.length,
          allowedMethods: response.headers.get('Allow') || 'Not specified'
        })

      } catch (error) {
        const result = {
          testCase: test.name,
          url: test.url,
          method: test.method,
          error: error instanceof Error ? error.message : String(error),
          success: false
        }
        
        results.push(result)
        console.error(`${test.name} Error:`, error)
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Summary analysis
    const summary = {
      totalTests: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      successfulTests: results.filter(r => r.success).map(r => r.testCase),
      failedTests: results.filter(r => !r.success).map(r => r.testCase),
      statusCodes: results.map(r => ({ test: r.testCase, status: r.status })),
      analysis: {
        customerCreationSupported: results.some(r => r.success && r.method === 'POST'),
        endpointExists: results.some(r => r.success && r.method === 'GET'),
        supportedMethods: results.find(r => r.method === 'OPTIONS')?.headers?.allow || 'Unknown'
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Customer creation methods testing completed',
      results,
      summary
    })

  } catch (error) {
    console.error('Customer creation methods test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 