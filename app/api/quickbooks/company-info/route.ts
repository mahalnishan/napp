import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get QuickBooks integration
    const { data: integration } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!integration) {
      return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 })
    }

    // Check if token is expired and refresh if needed
    let accessToken = integration.access_token
    if (new Date(integration.expires_at) <= new Date()) {
      const refreshResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: integration.refresh_token
        })
      })

      if (!refreshResponse.ok) {
        console.error('Token refresh failed:', await refreshResponse.text())
        return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 })
      }

      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token

      // Update the database with new tokens
      const { error: updateError } = await supabase
        .from('quickbooks_integrations')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update tokens:', updateError)
      }
    }

    // Fetch company information from QuickBooks
    const companyResponse = await fetch(
      `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/companyinfo/${integration.realm_id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!companyResponse.ok) {
      const errorText = await companyResponse.text()
      console.error('QuickBooks company API error:', errorText)
      return NextResponse.json({ 
        error: 'Failed to fetch company information',
        details: errorText
      }, { status: 500 })
    }

    const companyData = await companyResponse.json()
    console.log('Company data received:', JSON.stringify(companyData, null, 2))

    return NextResponse.json({ 
      company: companyData.CompanyInfo,
      message: 'Company information retrieved successfully'
    })
  } catch (error) {
    console.error('Company info error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 