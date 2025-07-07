import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickbooksAPI } from '@/lib/quickbooks'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate a random state for security
    const state = crypto.randomUUID()
    
    // Generate the authorization URL
    const authUrl = quickbooksAPI.getAuthorizationURL(state)
    
    // Store the state in the database for verification
    const { error: insertError } = await supabase
      .from('quickbooks_integrations')
      .upsert({
        user_id: user.id,
        access_token: '', // Will be filled after OAuth
        refresh_token: '', // Will be filled after OAuth
        realm_id: '', // Will be filled after OAuth
        state: state,
        expires_at: new Date().toISOString() // Will be updated after OAuth
      })

    if (insertError) {
      console.error('Error storing QuickBooks state:', insertError)
      return NextResponse.json({ error: 'Failed to initialize QuickBooks connection' }, { status: 500 })
    }

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('QuickBooks auth error:', error)
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 })
  }
} 