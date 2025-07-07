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

    console.log('Testing direct API implementation...')
    console.log('Tokens:', {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      realmId: tokens.realmId,
      expiresAt: tokens.expiresAt
    })

    // Test multiple operations
    const results = {
      companyInfo: null as any,
      customers: [] as any[],
      services: [] as any[],
      invoices: [] as any[],
      errors: [] as string[]
    }

    // Test 1: Get company info
    try {
      console.log('Testing company info...')
      const companyInfo = await quickbooksDirectAPI.getCompanyInfo(tokens)
      results.companyInfo = companyInfo
      console.log('Company info success:', companyInfo)
    } catch (error) {
      const errorMsg = `Company info failed: ${error instanceof Error ? error.message : error}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    // Test 2: Get customers
    try {
      console.log('Testing customers...')
      const customers = await quickbooksDirectAPI.getCustomers(tokens, 5)
      results.customers = customers
      console.log('Customers success:', customers?.length || 0, 'customers')
    } catch (error) {
      const errorMsg = `Customers failed: ${error instanceof Error ? error.message : error}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    // Test 3: Get services
    try {
      console.log('Testing services...')
      const services = await quickbooksDirectAPI.getServices(tokens, 5)
      results.services = services
      console.log('Services success:', services?.length || 0, 'services')
    } catch (error) {
      const errorMsg = `Services failed: ${error instanceof Error ? error.message : error}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    // Test 4: Get invoices
    try {
      console.log('Testing invoices...')
      const invoices = await quickbooksDirectAPI.getInvoices(tokens, 5)
      results.invoices = invoices
      console.log('Invoices success:', invoices?.length || 0, 'invoices')
    } catch (error) {
      const errorMsg = `Invoices failed: ${error instanceof Error ? error.message : error}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    return NextResponse.json({
      success: true,
      message: 'Direct API test completed',
      implementation: 'direct-fetch',
      results,
      summary: {
        companyName: results.companyInfo?.CompanyName || 'Unknown',
        customersCount: results.customers?.length || 0,
        servicesCount: results.services?.length || 0,
        invoicesCount: results.invoices?.length || 0,
        errorsCount: results.errors.length,
        hasErrors: results.errors.length > 0
      }
    })

  } catch (error) {
    console.error('Direct API test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      implementation: 'direct-fetch'
    }, { status: 500 })
  }
} 