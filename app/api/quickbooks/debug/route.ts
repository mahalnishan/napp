import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickbooksDirectAPI } from '@/lib/quickbooks-direct'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get QuickBooks integration
    const { data: integration, error: fetchError } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'No QuickBooks integration found' }, { status: 404 })
    }

    // Get environment from env vars
    const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'unknown'
    const realmId = integration.realm_id

    // Try to fetch company info from QuickBooks
    let companyName = null
    try {
      const tokens = {
        accessToken: integration.access_token,
        refreshToken: integration.refresh_token,
        realmId: integration.realm_id,
        expiresAt: new Date(integration.expires_at)
      }
      const companyInfo = await quickbooksDirectAPI.getCompanyInfo(tokens)
      companyName = companyInfo?.CompanyName || null
    } catch (e) {
      // Ignore errors, just show null
    }

    return NextResponse.json({
      success: true,
      environment,
      realmId,
      companyName,
      userId: user.id
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get QuickBooks debug info' }, { status: 500 })
  }
} 