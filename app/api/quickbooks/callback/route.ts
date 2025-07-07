import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickbooksAPI } from '@/lib/quickbooks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const realmId = searchParams.get('realmId')
    const error = searchParams.get('error')

    if (error) {
      console.error('QuickBooks OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=quickbooks_auth_failed`)
    }

    if (!code || !state || !realmId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=quickbooks_invalid_callback`)
    }

    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=quickbooks_unauthorized`)
    }

    // Verify the state parameter
    const { data: integration, error: fetchError } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('state', state)
      .single()

    if (fetchError || !integration) {
      console.error('Error fetching QuickBooks integration:', fetchError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=quickbooks_state_mismatch`)
    }

    // Exchange the authorization code for tokens using the full callback URL
    const tokens = await quickbooksAPI.exchangeCodeForTokens(request.url)

    // Update the integration with the tokens
    const { error: updateError } = await supabase
      .from('quickbooks_integrations')
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        realm_id: tokens.realmId,
        expires_at: tokens.expiresAt.toISOString(),
        state: null // Clear the state after successful OAuth
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating QuickBooks integration:', updateError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=quickbooks_token_save_failed`)
    }

    console.log('QuickBooks connection successful for user:', user.id)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=quickbooks_connected`)
  } catch (error) {
    console.error('QuickBooks callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=quickbooks_callback_failed`)
  }
} 