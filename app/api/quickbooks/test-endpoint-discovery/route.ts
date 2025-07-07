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

    console.log('=== ENDPOINT DISCOVERY TEST ===')
    
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
    const realmId = integration.realm_id
    const accessToken = integration.access_token

    // Test different endpoints and methods to discover what's available
    const discoveryTests = [
      {
        name: 'GET /customer (check if endpoint exists)',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=40`,
        method: 'GET'
      },
      {
        name: 'POST /customer (our failing approach)',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=40`,
        method: 'POST',
        body: { Customer: { Name: 'TestCustomer' } }
      },
      {
        name: 'GET /customers (plural)',
        url: `${baseUrl}/v3/company/${realmId}/customers?minorversion=40`,
        method: 'GET'
      },
      {
        name: 'POST /customers (plural)',
        url: `${baseUrl}/v3/company/${realmId}/customers?minorversion=40`,
        method: 'POST',
        body: { Customer: { Name: 'TestCustomer' } }
      },
      {
        name: 'GET /item (check if item endpoint exists)',
        url: `${baseUrl}/v3/company/${realmId}/item?minorversion=40`,
        method: 'GET'
      },
      {
        name: 'POST /item (test item creation)',
        url: `${baseUrl}/v3/company/${realmId}/item?minorversion=40`,
        method: 'POST',
        body: { Item: { Name: 'TestItem', Type: 'Service' } }
      },
      {
        name: 'GET /invoice (check if invoice endpoint exists)',
        url: `${baseUrl}/v3/company/${realmId}/invoice?minorversion=40`,
        method: 'GET'
      },
      {
        name: 'POST /invoice (test invoice creation)',
        url: `${baseUrl}/v3/company/${realmId}/invoice?minorversion=40`,
        method: 'POST',
        body: { 
          Invoice: { 
            CustomerRef: { value: '1' },
            Line: [{ Amount: 100, DetailType: 'SalesItemLineDetail', SalesItemLineDetail: { ItemRef: { value: '1' } } }]
          } 
        }
      },
      {
        name: 'OPTIONS /customer (check supported methods)',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=40`,
        method: 'OPTIONS'
      },
      {
        name: 'HEAD /customer (check if endpoint exists)',
        url: `${baseUrl}/v3/company/${realmId}/customer?minorversion=40`,
        method: 'HEAD'
      }
    ]

    const results = []

    for (const test of discoveryTests) {
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

    // Analysis
    const analysis = {
      customerEndpoints: {
        getCustomerWorks: results.find(r => r.testCase.includes('GET /customer') && r.success),
        postCustomerWorks: results.find(r => r.testCase.includes('POST /customer') && r.success),
        getCustomersWorks: results.find(r => r.testCase.includes('GET /customers') && r.success),
        postCustomersWorks: results.find(r => r.testCase.includes('POST /customers') && r.success)
      },
      itemEndpoints: {
        getItemWorks: results.find(r => r.testCase.includes('GET /item') && r.success),
        postItemWorks: results.find(r => r.testCase.includes('POST /item') && r.success)
      },
      invoiceEndpoints: {
        getInvoiceWorks: results.find(r => r.testCase.includes('GET /invoice') && r.success),
        postInvoiceWorks: results.find(r => r.testCase.includes('POST /invoice') && r.success)
      },
      supportedMethods: results.find(r => r.method === 'OPTIONS')?.headers?.allow || 'Unknown'
    }

    return NextResponse.json({
      success: true,
      message: 'Endpoint discovery completed',
      results,
      analysis,
      conclusion: {
        customerCreationSupported: !!analysis.customerEndpoints.postCustomerWorks || !!analysis.customerEndpoints.postCustomersWorks,
        itemCreationSupported: !!analysis.itemEndpoints.postItemWorks,
        invoiceCreationSupported: !!analysis.invoiceEndpoints.postInvoiceWorks,
        recommendation: analysis.customerEndpoints.postCustomerWorks || analysis.customerEndpoints.postCustomersWorks 
          ? 'Customer creation is supported via one of the tested endpoints'
          : 'Customer creation may not be supported via direct API calls - may need to use QuickBooks UI or different approach'
      }
    })

  } catch (error) {
    console.error('Endpoint discovery test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 