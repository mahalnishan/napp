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

    console.log('=== MINIMAL CUSTOMER TEST ===')

    // Test various minimal customer structures
    const testCases = [
      {
        name: 'Only Name',
        customer: { Name: 'Test Customer Name Only' }
      },
      {
        name: 'Only DisplayName',
        customer: { DisplayName: 'Test Customer DisplayName Only' }
      },
      {
        name: 'Only CompanyName',
        customer: { CompanyName: 'Test Customer CompanyName Only' }
      },
      {
        name: 'Name + DisplayName',
        customer: { Name: 'Test Customer ND', DisplayName: 'Test Customer ND' }
      },
      {
        name: 'CompanyName + DisplayName',
        customer: { CompanyName: 'Test Customer CD', DisplayName: 'Test Customer CD' }
      },
      {
        name: 'All three names',
        customer: { Name: 'Test Customer All', CompanyName: 'Test Customer All', DisplayName: 'Test Customer All' }
      }
    ]

    const results = []
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'

    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name}`)
        
        const url = `${baseUrl}/v3/company/${integration.realm_id}/customer?minorversion=40`
        const payload = { Customer: testCase.customer }
        
        console.log('Payload:', JSON.stringify(payload, null, 2))
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${integration.access_token}`
          },
          body: JSON.stringify(payload)
        })

        const responseText = await response.text()
        
        let parsedResponse = null
        try {
          parsedResponse = JSON.parse(responseText)
        } catch (e) {
          // Keep as text if not JSON
        }

        results.push({
          testCase: testCase.name,
          payload: payload,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          response: responseText,
          parsedResponse
        })

        console.log(`Result for ${testCase.name}:`, {
          status: response.status,
          success: response.ok,
          error: response.ok ? null : responseText.substring(0, 200)
        })

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300))

      } catch (error) {
        results.push({
          testCase: testCase.name,
          error: error instanceof Error ? error.message : String(error),
          success: false
        })
        console.error(`Error testing ${testCase.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Minimal customer tests completed',
      results,
      summary: {
        totalTests: testCases.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('Minimal customer test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 