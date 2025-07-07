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
      return NextResponse.json({
        connected: false,
        message: 'Not connected to QuickBooks'
      })
    }

    // Check if tokens are expired
    const expiresAt = new Date(integration.expires_at)
    const isExpired = expiresAt < new Date()

    return NextResponse.json({
      connected: true,
      isExpired,
      expiresAt: integration.expires_at,
      realmId: integration.realm_id,
      message: isExpired ? 'Connection expired - refresh needed' : 'Connected to QuickBooks'
    })
  } catch (error) {
    console.error('QuickBooks status error:', error)
    return NextResponse.json({ error: 'Failed to check QuickBooks status' }, { status: 500 })
  }
} 