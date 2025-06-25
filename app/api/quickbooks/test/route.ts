import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('QuickBooks test endpoint called')
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check environment variables
    const envCheck = {
      clientId: !!process.env.QUICKBOOKS_CLIENT_ID,
      clientSecret: !!process.env.QUICKBOOKS_CLIENT_SECRET,
      redirectUri: !!process.env.QUICKBOOKS_REDIRECT_URI,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }

    console.log('Environment check:', envCheck)

    // Check if user has QuickBooks integration
    const { data: integration, error: integrationError } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('Integration check:', { 
      hasIntegration: !!integration, 
      error: integrationError?.message 
    })

    const integrationStatus = {
      connected: !!integration,
      tokenExpired: integration ? new Date(integration.expires_at) <= new Date() : false,
      realmId: integration?.realm_id || null,
      hasAccessToken: !!integration?.access_token,
      hasRefreshToken: !!integration?.refresh_token,
      expiresAt: integration?.expires_at || null
    }

    // Test database connection
    const { error: testError } = await supabase
      .from('quickbooks_integrations')
      .select('count')
      .limit(1)

    const databaseStatus = {
      connected: !testError,
      error: testError?.message || null
    }

    // Test QuickBooks API if connected
    let quickbooksApiStatus = null
    if (integration && !integrationStatus.tokenExpired) {
      try {
        const companyResponse = await fetch(
          `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/companyinfo/${integration.realm_id}`,
          {
            headers: {
              'Authorization': `Bearer ${integration.access_token}`,
              'Accept': 'application/json'
            }
          }
        )
        
        quickbooksApiStatus = {
          status: companyResponse.status,
          ok: companyResponse.ok,
          error: companyResponse.ok ? null : await companyResponse.text()
        }
      } catch (error) {
        quickbooksApiStatus = {
          status: 'error',
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    const result = {
      status: 'ok',
      user: {
        id: user.id,
        email: user.email
      },
      environment: envCheck,
      integration: integrationStatus,
      database: databaseStatus,
      quickbooksApi: quickbooksApiStatus,
      message: 'QuickBooks integration test completed',
      timestamp: new Date().toISOString()
    }

    console.log('Test result:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 