import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const realmId = searchParams.get('realmId')
  const state = searchParams.get('state')

  if (!code || !realmId) {
    return NextResponse.redirect('/dashboard/settings?error=oauth_failed')
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.redirect('/auth/login')
    }

    const clientId = process.env.QUICKBOOKS_CLIENT_ID
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect('/dashboard/settings?error=configuration_error')
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
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

    if (!tokenResponse.ok) {
      return NextResponse.redirect('/dashboard/settings?error=token_exchange_failed')
    }

    const tokenData = await tokenResponse.json()
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    // Store the integration in the database
    const integrationData = {
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      realm_id: realmId,
      expires_at: expiresAt
    }

    const { error: dbError } = await supabase
      .from('quickbooks_integrations')
      .upsert(integrationData)

    if (dbError) {
      return NextResponse.redirect('/dashboard/settings?error=database_error')
    }

    return NextResponse.redirect('/dashboard/settings?success=quickbooks_connected')
  } catch (error) {
    return NextResponse.redirect('/dashboard/settings?error=callback_error')
  }
} 