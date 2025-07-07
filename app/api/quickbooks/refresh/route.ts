import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickbooksAPI } from '@/lib/quickbooks'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current integration
    const { data: integration, error: fetchError } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'No QuickBooks integration found' }, { status: 404 })
    }

    // Refresh the tokens
    const tokens = await quickbooksAPI.refreshTokens(integration.refresh_token)

    // Update the integration with new tokens
    const { error: updateError } = await supabase
      .from('quickbooks_integrations')
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt.toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating tokens:', updateError)
      return NextResponse.json({ error: 'Failed to update tokens' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully',
      expiresAt: tokens.expiresAt
    })
  } catch (error) {
    console.error('QuickBooks refresh error:', error)
    return NextResponse.json({ error: 'Failed to refresh tokens' }, { status: 500 })
  }
} 