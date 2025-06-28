import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('QuickBooks callback started')
    
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const realmId = searchParams.get('realmId')
    const state = searchParams.get('state')

    console.log('Callback parameters:', { 
      hasCode: !!code, 
      hasRealmId: !!realmId, 
      realmId: realmId,
      state 
    })

    if (!code || !realmId) {
      console.error('Missing required parameters:', { code: !!code, realmId: !!realmId })
      return NextResponse.redirect('/dashboard/settings?error=oauth_failed')
    }

    // Check environment variables first
    const clientId = process.env.QUICKBOOKS_CLIENT_ID
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI

    console.log('Environment check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
      redirectUri
    })

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing QuickBooks configuration:', {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        redirectUri: !!redirectUri
      })
      return NextResponse.redirect('/dashboard/settings?error=configuration_error')
    }

    // Create Supabase client
    console.log('Creating Supabase client...')
    const supabase = await createClient()
    
    console.log('Getting user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.redirect('/auth/login')
    }

    if (!user) {
      console.error('No user found')
      return NextResponse.redirect('/auth/login')
    }

    console.log('User authenticated:', user.id)

    // Clean up realmId - remove any trailing commas or extra characters
    const cleanRealmId = realmId.replace(/[,\s]+$/, '').trim()
    
    console.log('QuickBooks OAuth callback:', {
      hasCode: !!code,
      realmId: cleanRealmId,
      state,
      userId: user.id
    })

    // Exchange authorization code for access token
    console.log('Exchanging authorization code for token...')
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })

    console.log('Token request body:', {
      grant_type: 'authorization_code',
      hasCode: !!code,
      redirect_uri: redirectUri
    })

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: tokenBody
    })

    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', tokenResponse.status, errorText)
      return NextResponse.redirect('/dashboard/settings?error=token_exchange_failed')
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful, token data keys:', Object.keys(tokenData))
    
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    console.log('Token exchange successful, storing integration...')

    // Store the integration in the database
    const integrationData = {
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      realm_id: cleanRealmId,
      expires_at: expiresAt
    }

    console.log('Storing integration data:', {
      user_id: integrationData.user_id,
      hasAccessToken: !!integrationData.access_token,
      hasRefreshToken: !!integrationData.refresh_token,
      realm_id: integrationData.realm_id,
      expires_at: integrationData.expires_at
    })

    const { error: dbError } = await supabase
      .from('quickbooks_integrations')
      .upsert(integrationData)

    if (dbError) {
      console.error('Database error storing integration:', dbError)
      return NextResponse.redirect('/dashboard/settings?error=database_error')
    }

    console.log('QuickBooks integration stored successfully')
    return NextResponse.redirect('/dashboard/settings?success=quickbooks_connected')
  } catch (error) {
    console.error('QuickBooks callback error:', error)
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    return NextResponse.redirect('/dashboard/settings?error=callback_error')
  }
} 