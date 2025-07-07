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

    const expiresAt = new Date(integration.expires_at)
    const now = new Date()
    const isExpired = expiresAt < now
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()

    console.log('Token validation details:', {
      hasAccessToken: !!integration.access_token,
      hasRefreshToken: !!integration.refresh_token,
      accessTokenLength: integration.access_token?.length,
      refreshTokenLength: integration.refresh_token?.length,
      realmId: integration.realm_id,
      expiresAt: integration.expires_at,
      isExpired,
      timeUntilExpiryMs: timeUntilExpiry,
      timeUntilExpiryHours: Math.round(timeUntilExpiry / (1000 * 60 * 60))
    })

    // If tokens are expired or about to expire, try to refresh
    if (isExpired || timeUntilExpiry < 300000) { // 5 minutes
      console.log('Tokens are expired or about to expire, attempting refresh...')
      
      try {
        // Set the current tokens
        oauthClient.setToken({
          refresh_token: integration.refresh_token,
          realmId: integration.realm_id
        })

        const authResponse = await oauthClient.refresh()
        const newToken = authResponse.token

        console.log('Token refresh successful:', {
          hasNewAccessToken: !!newToken.access_token,
          hasNewRefreshToken: !!newToken.refresh_token,
          newExpiresIn: newToken.expires_in,
          newRealmId: newToken.realmId
        })

        // Update tokens in database
        const newExpiresAt = new Date(Date.now() + newToken.expires_in * 1000)
        
        const { error: updateError } = await supabase
          .from('quickbooks_integrations')
          .update({
            access_token: newToken.access_token,
            refresh_token: newToken.refresh_token,
            expires_at: newExpiresAt.toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Failed to update tokens:', updateError)
          return NextResponse.json({
            success: false,
            error: 'Failed to save refreshed tokens',
            details: updateError.message
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Tokens refreshed successfully',
          tokenInfo: {
            wasExpired: isExpired,
            oldExpiresAt: integration.expires_at,
            newExpiresAt: newExpiresAt.toISOString(),
            newExpiresIn: newToken.expires_in
          }
        })

      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        return NextResponse.json({
          success: false,
          error: 'Token refresh failed',
          details: refreshError instanceof Error ? refreshError.message : String(refreshError),
          suggestion: 'You may need to reconnect to QuickBooks'
        })
      }
    } else {
      return NextResponse.json({
        success: true,
        message: 'Tokens are valid and not expired',
        tokenInfo: {
          isExpired: false,
          expiresAt: integration.expires_at,
          timeUntilExpiryHours: Math.round(timeUntilExpiry / (1000 * 60 * 60)),
          hasValidTokens: !!integration.access_token && !!integration.refresh_token
        }
      })
    }

  } catch (error) {
    console.error('Token test error:', error)
    return NextResponse.json({ 
      error: 'Failed to test QuickBooks tokens',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 