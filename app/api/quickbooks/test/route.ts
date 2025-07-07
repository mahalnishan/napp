import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickbooksAPI } from '@/lib/quickbooks'

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

    const tokens = {
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
      realmId: integration.realm_id,
      expiresAt: new Date(integration.expires_at)
    }

    console.log('Token validation:', {
      hasAccessToken: !!tokens.accessToken,
      accessTokenLength: tokens.accessToken?.length,
      hasRefreshToken: !!tokens.refreshToken,
      realmId: tokens.realmId,
      expiresAt: tokens.expiresAt,
      isExpired: tokens.expiresAt < new Date()
    })

    // Check if tokens are expired
    if (tokens.expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'QuickBooks tokens have expired. Please refresh or reconnect.',
        details: `Tokens expired at ${tokens.expiresAt}`
      })
    }

    // Test a simple API call
    try {
      console.log('Testing QuickBooks API connection...')
      const customers = await quickbooksAPI.getCustomers(tokens, 1)
      console.log('API test successful, found customers:', customers.length)
      
      return NextResponse.json({
        success: true,
        message: 'QuickBooks API connection successful',
        customerCount: customers.length,
        realmId: tokens.realmId
      })
    } catch (apiError) {
      console.error('QuickBooks API test failed:', apiError)
      
      // Check if it's a token revocation error
      if (apiError instanceof Error && apiError.message.includes('Token revoked')) {
        return NextResponse.json({
          success: false,
          error: 'QuickBooks tokens have been revoked. Please reconnect to QuickBooks.',
          details: 'Authentication failed - tokens need to be refreshed'
        })
      }
      
      return NextResponse.json({
        success: false,
        error: `QuickBooks API test failed: ${apiError}`,
        details: apiError instanceof Error ? apiError.message : String(apiError)
      })
    }
  } catch (error) {
    console.error('QuickBooks test error:', error)
    return NextResponse.json({ error: 'Failed to test QuickBooks connection' }, { status: 500 })
  }
} 