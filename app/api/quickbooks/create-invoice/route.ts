import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, clientId, services, totalAmount } = await request.json()

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

    // Get client information
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get service information to ensure we have valid data
    const { data: serviceData } = await supabase
      .from('services')
      .select('*')
      .eq('id', services[0].serviceId)
      .single()

    if (!serviceData) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Create invoice in QuickBooks
    const invoiceData = {
      Line: services.map((service: any) => ({
        Amount: service.price * service.quantity,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: {
            value: '1' // Use default item ID for sandbox
          },
          Qty: service.quantity,
          UnitPrice: service.price
        }
      })),
      CustomerRef: {
        value: '1' // Use default customer ID for sandbox
      }
    }

    console.log('Creating QuickBooks invoice with data:', JSON.stringify(invoiceData, null, 2))

    // Use sandbox URL for development
    const quickbooksResponse = await fetch(
      `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/invoice`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      }
    )

    console.log('QuickBooks response status:', quickbooksResponse.status)

    if (!quickbooksResponse.ok) {
      const errorText = await quickbooksResponse.text()
      console.error('QuickBooks API error:', errorText)
      console.error('Response headers:', Object.fromEntries(quickbooksResponse.headers.entries()))
      
      return NextResponse.json({ 
        error: 'Failed to create invoice in QuickBooks',
        details: errorText,
        status: quickbooksResponse.status
      }, { status: 500 })
    }

    const quickbooksData = await quickbooksResponse.json()
    console.log('QuickBooks response data:', JSON.stringify(quickbooksData, null, 2))
    
    const invoiceId = quickbooksData.Invoice.Id

    // Update the order with the QuickBooks invoice ID
    const { error: updateOrderError } = await supabase
      .from('work_orders')
      .update({ quickbooks_invoice_id: invoiceId })
      .eq('id', orderId)

    if (updateOrderError) {
      console.error('Failed to update order with invoice ID:', updateOrderError)
    }

    return NextResponse.json({ invoiceId })
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 