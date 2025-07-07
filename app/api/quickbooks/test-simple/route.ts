import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OAuthClient from 'intuit-oauth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the QuickBooks integration
    const { data: integration, error: fetchError } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'No QuickBooks integration found' }, { status: 404 })
    }

    // Create OAuth client exactly like the working example
    const oauthClient = new OAuthClient({
      clientId: process.env.QUICKBOOKS_CLIENT_ID || process.env.CLIENT_ID || '',
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || process.env.CLIENT_SECRET || '',
      environment: (process.env.QUICKBOOKS_ENVIRONMENT || process.env.ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || process.env.REDIRECT_URL || ''
    })

    // Set tokens exactly like the working example
    oauthClient.setToken({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      realmId: integration.realm_id
    })

    console.log('Simple test - Making API call exactly like working example')

    // Make the exact same API call as the working Express example
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/query?query=select * from Customer&minorversion=40`

    console.log('API URL:', url)

    try {
      const response = await oauthClient.makeApiCall({
        url: url,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Simple test response:', {
        status: response.status,
        statusText: response.statusText,
        bodyType: typeof response.body,
        bodyExists: !!response.body,
        bodyLength: response.body?.length,
        bodyIsUndefined: response.body === 'undefined',
        bodyIsEmpty: response.body === '',
        bodyPreview: response.body?.substring(0, 100)
      })

      // Check response exactly like the working example
      if (!response.body) {
        return NextResponse.json({
          success: false,
          error: 'No response body',
          debug: {
            status: response.status,
            statusText: response.statusText,
            bodyType: typeof response.body
          }
        })
      }

      // Parse JSON exactly like the working example
      const data = JSON.parse(response.body)
      
      return NextResponse.json({
        success: true,
        message: 'Simple test successful - exactly like working example',
        customerCount: data.QueryResponse?.Customer?.length || 0,
        data: data,
        debug: {
          status: response.status,
          bodyLength: response.body.length,
          hasQueryResponse: !!data.QueryResponse,
          hasCustomers: !!data.QueryResponse?.Customer
        }
      })

    } catch (apiError) {
      console.error('Simple API call failed:', apiError)
      
      return NextResponse.json({
        success: false,
        error: `Simple API call failed: ${apiError}`,
        details: apiError instanceof Error ? apiError.message : String(apiError)
      })
    }

  } catch (error) {
    console.error('Simple test error:', error)
    return NextResponse.json({ 
      error: 'Failed to run simple QuickBooks test',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 