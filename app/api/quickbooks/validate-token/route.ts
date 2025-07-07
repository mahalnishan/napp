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

    console.log('=== TOKEN VALIDATION TEST ===')
    
    // Test the token with a simple API call
    const testUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/companyinfo/${integration.realm_id}`
    
    console.log('Testing token with URL:', testUrl)
    console.log('Token info:', {
      hasAccessToken: !!integration.access_token,
      tokenLength: integration.access_token?.length,
      tokenStart: integration.access_token?.substring(0, 10),
      realmId: integration.realm_id
    })

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${integration.access_token}`
        }
      })

      console.log('Token validation response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      const responseText = await response.text()
      
      console.log('Response details:', {
        hasBody: !!responseText,
        bodyLength: responseText?.length,
        bodyPreview: responseText?.substring(0, 200)
      })

      let errorDetails = null
      let isTokenValid = false

      if (response.status === 401) {
        errorDetails = 'Token is invalid or expired'
        isTokenValid = false
      } else if (response.status === 403) {
        errorDetails = 'Token lacks required permissions'
        isTokenValid = false
      } else if (response.status === 200) {
        isTokenValid = true
      } else {
        errorDetails = `Unexpected status: ${response.status} - ${response.statusText}`
      }

      // Try to parse error response if available
      let parsedResponse = null
      if (responseText) {
        try {
          parsedResponse = JSON.parse(responseText)
        } catch (e) {
          // Not JSON, that's okay
        }
      }

      return NextResponse.json({
        success: isTokenValid,
        message: isTokenValid ? 'Token is valid' : 'Token validation failed',
        tokenStatus: {
          isValid: isTokenValid,
          httpStatus: response.status,
          httpStatusText: response.statusText,
          errorDetails,
          hasResponseBody: !!responseText,
          responseBodyLength: responseText?.length
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
          parsedResponse
        },
        debug: {
          url: testUrl,
          realmId: integration.realm_id,
          tokenPrefix: integration.access_token?.substring(0, 20) + '...'
        }
      })

    } catch (fetchError) {
      console.error('Token validation fetch error:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Token validation failed',
        details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        tokenStatus: {
          isValid: false,
          errorDetails: 'Network error during validation'
        }
      })
    }

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 