import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickbooksDirectAPI } from '@/lib/quickbooks-direct'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get QuickBooks tokens from database
    const { data: integration, error: integrationError } = await supabase
      .from('quickbooks_integrations')
      .select('access_token, refresh_token, realm_id')
      .eq('user_id', user.id)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'QuickBooks integration not found' }, { status: 404 })
    }

    if (!integration.access_token || !integration.realm_id) {
      return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 })
    }

    // Create tokens object
    const tokens = {
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
      realmId: integration.realm_id,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
    }

    console.log('=== CUSTOMER DEBUG TEST ===')

    // Test with the exact same structure as our sync endpoint
    const testCustomer = {
      name: 'Test Customer Debug',
      email: 'debug@example.com',
      phone: '555-1234',
      address: '123 Test St'
    }

    // Build customer object exactly like in sync endpoint
    const customerData: any = {
      Name: testCustomer.name
    }

    // Add email only (most likely to work)
    if (testCustomer.email && testCustomer.email.trim() !== '') {
      customerData.PrimaryEmailAddr = {
        Address: testCustomer.email.trim()
      }
    }

    // Skip phone and address for now to isolate the issue
    // if (testCustomer.phone && testCustomer.phone.trim() !== '') {
    //   customerData.PrimaryPhone = {
    //     FreeFormNumber: testCustomer.phone.trim()
    //   }
    // }

    // if (testCustomer.address && testCustomer.address.trim() !== '') {
    //   customerData.BillAddr = {
    //     Line1: testCustomer.address.trim()
    //   }
    // }

    console.log('Customer payload to QuickBooks:', JSON.stringify(customerData, null, 2))

    try {
      const qbCustomer = await quickbooksDirectAPI.createCustomer(customerData, tokens)
      console.log('Customer created successfully:', qbCustomer)

      return NextResponse.json({
        success: true,
        message: 'Customer created successfully',
        customer: qbCustomer,
        originalData: testCustomer,
        payload: customerData
      })

    } catch (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        originalData: testCustomer,
        payload: customerData
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Customer debug test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 