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

    console.log('=== ITEM CREATION TEST ===')
    
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
    const realmId = integration.realm_id
    const accessToken = integration.access_token

    // Test creating an item (which should work)
    const itemPayload = {
      Item: {
        Name: `TestItem_${Date.now()}`,
        Type: "Service"
      }
    }

    console.log('Testing item creation with payload:', JSON.stringify(itemPayload, null, 2))
    
    const url = `${baseUrl}/v3/company/${realmId}/item?minorversion=40`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(itemPayload)
    })

    const responseText = await response.text()
    
    let parsedResponse = null
    try {
      parsedResponse = JSON.parse(responseText)
    } catch (e) {
      // Response might not be JSON
    }

    console.log('Item creation result:', {
      status: response.status,
      statusText: response.statusText,
      success: response.ok,
      responseLength: responseText?.length
    })

    return NextResponse.json({
      success: true,
      message: 'Item creation test completed',
      result: {
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        response: responseText,
        parsedResponse,
        headers: Object.fromEntries(response.headers.entries())
      },
      analysis: {
        itemCreationWorks: response.ok,
        comparisonNote: response.ok 
          ? "Item creation works, confirming API structure is correct - customer endpoint issue is specific to customer creation"
          : "Item creation also fails - suggests broader API issue"
      }
    })

  } catch (error) {
    console.error('Item creation test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 