import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickbooksDirectAPI } from '@/lib/quickbooks-direct'

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

    // Create tokens object
    const tokens = {
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
      realmId: integration.realm_id,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
    }

    console.log('=== CUSTOMER CREATION TEST ===')

    // First, let's see what existing customers look like
    try {
      const existingCustomers = await quickbooksDirectAPI.getCustomers(tokens, 1)
      console.log('Existing customer structure:', JSON.stringify(existingCustomers[0], null, 2))
    } catch (error) {
      console.error('Error getting existing customers:', error)
    }

    // Test different customer payloads to see what works
    const testCases = [
      {
        name: 'Minimal customer',
        data: {
          Name: 'Test Customer Minimal'
        }
      },
      {
        name: 'Customer with DisplayName',
        data: {
          DisplayName: 'Test Customer DisplayName'
        }
      },
      {
        name: 'Customer with Name and DisplayName',
        data: {
          Name: 'Test Customer Both',
          DisplayName: 'Test Customer Both'
        }
      },
      {
        name: 'Customer with email only',
        data: {
          DisplayName: 'Test Customer Email',
          PrimaryEmailAddr: {
            Address: 'test@example.com'
          }
        }
      },
      {
        name: 'Customer with all basic fields',
        data: {
          DisplayName: 'Test Customer Full',
          PrimaryEmailAddr: {
            Address: 'testfull@example.com'
          },
          PrimaryPhone: {
            FreeFormNumber: '555-1234'
          },
          Active: true
        }
      }
    ]

    const results = []

    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name}`)
        console.log('Payload:', JSON.stringify(testCase.data, null, 2))
        
        // Use raw fetch to see exact response
        const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
        const url = `${baseUrl}/v3/company/${tokens.realmId}/customer?minorversion=40`
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.accessToken}`
          },
          body: JSON.stringify({ Customer: testCase.data })
        })

        const responseText = await response.text()
        
        results.push({
          testCase: testCase.name,
          payload: testCase.data,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          response: responseText,
          parsedResponse: responseText ? JSON.parse(responseText) : null
        })

        console.log(`Result for ${testCase.name}:`, {
          status: response.status,
          success: response.ok,
          responsePreview: responseText.substring(0, 200)
        })

        // If successful, try to delete the customer to clean up
        if (response.ok) {
          try {
            const created = JSON.parse(responseText)
            const customerId = created.Customer?.Id
            if (customerId) {
              // Note: Deleting customers in QB is complex, so we'll just leave them
              console.log(`Created customer with ID: ${customerId}`)
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        }

        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        results.push({
          testCase: testCase.name,
          payload: testCase.data,
          error: error instanceof Error ? error.message : String(error),
          success: false
        })
        console.error(`Error testing ${testCase.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Customer creation tests completed',
      results,
      summary: {
        totalTests: testCases.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('Customer creation test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 