import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    console.log('Direct test - Token info:', {
      hasAccessToken: !!integration.access_token,
      accessTokenLength: integration.access_token?.length,
      accessTokenPrefix: integration.access_token?.substring(0, 20) + '...',
      realmId: integration.realm_id,
      environment: process.env.QUICKBOOKS_ENVIRONMENT || process.env.ENVIRONMENT
    })

    // Make direct fetch API call bypassing intuit-oauth
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
    const url = `${baseUrl}/v3/company/${integration.realm_id}/query?query=${encodeURIComponent('select * from Customer maxresults 5')}&minorversion=40`

    console.log('Direct API call URL:', url)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${integration.access_token}`
        }
      })

      console.log('Direct fetch response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      const responseText = await response.text()
      
      console.log('Direct fetch response body:', {
        bodyType: typeof responseText,
        bodyLength: responseText?.length,
        bodyExists: !!responseText,
        bodyIsEmpty: responseText === '',
        bodyPreview: responseText?.substring(0, 200)
      })

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseBody: responseText,
          debug: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          }
        })
      }

      if (!responseText || responseText.trim() === '') {
        return NextResponse.json({
          success: false,
          error: 'Empty response body from direct fetch',
          debug: {
            status: response.status,
            statusText: response.statusText,
            bodyLength: responseText?.length
          }
        })
      }

      try {
        const data = JSON.parse(responseText)
        
        return NextResponse.json({
          success: true,
          message: 'Direct fetch API call successful!',
          customerCount: data.QueryResponse?.Customer?.length || 0,
          data: data,
          debug: {
            status: response.status,
            bodyLength: responseText.length,
            hasQueryResponse: !!data.QueryResponse,
            hasCustomers: !!data.QueryResponse?.Customer,
            responseKeys: Object.keys(data)
          }
        })
      } catch (parseError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to parse JSON response from direct fetch',
          responseBody: responseText,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        })
      }

    } catch (fetchError) {
      console.error('Direct fetch failed:', fetchError)
      
      return NextResponse.json({
        success: false,
        error: `Direct fetch failed: ${fetchError}`,
        details: fetchError instanceof Error ? fetchError.message : String(fetchError)
      })
    }

  } catch (error) {
    console.error('Direct test error:', error)
    return NextResponse.json({ 
      error: 'Failed to run direct QuickBooks test',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 