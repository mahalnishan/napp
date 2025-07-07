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

    console.log('=== RAW QUICKBOOKS API TEST ===')
    console.log('Environment variables check:', {
      hasClientId: !!(process.env.QUICKBOOKS_CLIENT_ID || process.env.CLIENT_ID),
      hasClientSecret: !!(process.env.QUICKBOOKS_CLIENT_SECRET || process.env.CLIENT_SECRET),
      hasRedirectUri: !!(process.env.QUICKBOOKS_REDIRECT_URI || process.env.REDIRECT_URL),
      environment: process.env.QUICKBOOKS_ENVIRONMENT || process.env.ENVIRONMENT
    })

    console.log('Token info:', {
      hasAccessToken: !!integration.access_token,
      accessTokenLength: integration.access_token?.length,
      accessTokenPrefix: integration.access_token?.substring(0, 20) + '...',
      realmId: integration.realm_id
    })

    // Make the most basic possible API call using raw fetch
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
    const endpoint = `/v3/company/${integration.realm_id}/companyinfo/${integration.realm_id}`
    const url = `${baseUrl}${endpoint}`

    console.log('Making raw fetch call to:', url)

    const requestOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${integration.access_token}`,
        'User-Agent': 'MyApp/1.0'
      }
    }

    console.log('Request headers:', {
      Accept: requestOptions.headers.Accept,
      Authorization: `Bearer ${integration.access_token?.substring(0, 20)}...`,
      'User-Agent': requestOptions.headers['User-Agent']
    })

    try {
      const response = await fetch(url, requestOptions)

      console.log('Raw response details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        url: response.url,
        redirected: response.redirected,
        headers: Object.fromEntries(response.headers.entries())
      })

      // Try to read the response in different ways
      const responseText = await response.text()
      
      console.log('Response text details:', {
        textType: typeof responseText,
        textLength: responseText?.length,
        textExists: !!responseText,
        textIsEmpty: responseText === '',
        textIsNull: responseText === null,
        textIsUndefined: responseText === undefined,
        textValue: responseText
      })

      let parsedData = null
      let parseError = null

      if (responseText && responseText.trim() !== '') {
        try {
          parsedData = JSON.parse(responseText)
          console.log('JSON parse successful:', {
            dataType: typeof parsedData,
            dataKeys: parsedData ? Object.keys(parsedData) : [],
            hasQueryResponse: !!parsedData?.QueryResponse,
            hasCompanyInfo: !!parsedData?.QueryResponse?.CompanyInfo
          })
        } catch (jsonError) {
          parseError = jsonError instanceof Error ? jsonError.message : String(jsonError)
          console.error('JSON parse failed:', parseError)
        }
      }

      return NextResponse.json({
        success: response.ok,
        message: 'Raw API test completed',
        response: {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        },
        body: {
          type: typeof responseText,
          length: responseText?.length,
          exists: !!responseText,
          isEmpty: responseText === '',
          isNull: responseText === null,
          isUndefined: responseText === undefined,
          content: responseText,
          parsedData,
          parseError
        },
        debug: {
          url,
          realmId: integration.realm_id,
          tokenPrefix: integration.access_token?.substring(0, 20) + '...'
        }
      })

    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Fetch failed',
        details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        debug: {
          url,
          realmId: integration.realm_id
        }
      })
    }

  } catch (error) {
    console.error('Raw test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 