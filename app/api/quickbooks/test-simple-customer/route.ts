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

    console.log('=== SIMPLE CUSTOMER CREATION TEST ===')

    // Test the absolute simplest customer creation
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
    const url = `${baseUrl}/v3/company/${integration.realm_id}/customer?minorversion=40`
    
    // Use the exact same format as existing customers
    const customerPayload = {
      Customer: {
        Name: 'Test Simple Customer'
      }
    }

    console.log('Testing simplest customer payload:', JSON.stringify(customerPayload, null, 2))
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${integration.access_token}`
      },
      body: JSON.stringify(customerPayload)
    })

    const responseText = await response.text()
    
    console.log('Response details:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      bodyLength: responseText.length,
      body: responseText
    })

    let parsedResponse = null
    try {
      parsedResponse = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse response as JSON')
    }

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Simple customer creation successful' : 'Simple customer creation failed',
      request: {
        url,
        payload: customerPayload
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
        parsed: parsedResponse
      }
    })

  } catch (error) {
    console.error('Simple customer creation test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 