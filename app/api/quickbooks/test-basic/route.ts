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

    // Create OAuth client
    const oauthClient = new OAuthClient({
      clientId: process.env.QUICKBOOKS_CLIENT_ID || process.env.CLIENT_ID || '',
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || process.env.CLIENT_SECRET || '',
      environment: (process.env.QUICKBOOKS_ENVIRONMENT || process.env.ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || process.env.REDIRECT_URL || ''
    })

    // Set tokens
    oauthClient.setToken({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      realmId: integration.realm_id
    })

    console.log('Basic test - Token info:', {
      hasAccessToken: !!integration.access_token,
      accessTokenLength: integration.access_token?.length,
      realmId: integration.realm_id,
      environment: process.env.QUICKBOOKS_ENVIRONMENT || process.env.ENVIRONMENT
    })

    // Test the most basic API call - like the working example
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
    const url = `${baseUrl}/v3/company/${integration.realm_id}/query?query=select * from Customer&minorversion=40`

    console.log('Making basic API call to:', url)

    try {
      const response = await oauthClient.makeApiCall({
        url: url,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      console.log('Basic API call response:', {
        status: response.status,
        statusText: response.statusText,
        bodyType: typeof response.body,
        bodyLength: response.body?.length,
        body: response.body
      })

      if (!response.body || response.body === 'undefined') {
        return NextResponse.json({
          success: false,
          error: 'Empty or undefined response body',
          debug: {
            status: response.status,
            statusText: response.statusText,
            bodyType: typeof response.body,
            body: response.body
          }
        })
      }

      const parsedResponse = JSON.parse(response.body)
      
      return NextResponse.json({
        success: true,
        message: 'Basic QuickBooks API test successful',
        companyInfo: parsedResponse?.QueryResponse?.CompanyInfo?.[0] || parsedResponse,
        debug: {
          status: response.status,
          bodyLength: response.body.length
        }
      })

    } catch (apiError) {
      console.error('Basic API call failed:', apiError)
      
      return NextResponse.json({
        success: false,
        error: `Basic API call failed: ${apiError}`,
        details: apiError instanceof Error ? apiError.message : String(apiError)
      })
    }

  } catch (error) {
    console.error('Basic test error:', error)
    return NextResponse.json({ 
      error: 'Failed to run basic QuickBooks test',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 