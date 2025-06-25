import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('QuickBooks callback received:', request.url)
  
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const realmId = searchParams.get('realmId')
  const state = searchParams.get('state')

  console.log('Callback parameters:', { code: code ? 'present' : 'missing', realmId, state })

  if (!code || !realmId) {
    console.error('Missing required parameters:', { code: !!code, realmId: !!realmId })
    return NextResponse.redirect('/dashboard/settings?error=oauth_failed')
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('User authentication check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      error: userError?.message 
    })
    
    if (userError || !user) {
      console.error('User not authenticated:', userError?.message)
      return NextResponse.redirect('/auth/login')
    }

    const clientId = process.env.QUICKBOOKS_CLIENT_ID
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI

    console.log('Environment variables check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
      redirectUri
    })

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing environment variables')
      return NextResponse.redirect('/dashboard/settings?error=configuration_error')
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })

    console.log('Exchanging code for token...')

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: tokenBody
    })

    console.log('Token exchange response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      })
      return NextResponse.redirect('/dashboard/settings?error=token_exchange_failed')
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    })

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    // Store the integration in the database
    const integrationData = {
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      realm_id: realmId,
      expires_at: expiresAt
    }

    console.log('Storing integration data for user:', user.id)

    const { error: dbError } = await supabase
      .from('quickbooks_integrations')
      .upsert(integrationData)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect('/dashboard/settings?error=database_error')
    }

    console.log('QuickBooks integration successful, redirecting to settings')
    return NextResponse.redirect('/dashboard/settings?success=quickbooks_connected')
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect('/dashboard/settings?error=callback_error')
  }
} 