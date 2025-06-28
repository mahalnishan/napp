import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  return await runComprehensiveTest()
}

export async function POST() {
  return await runComprehensiveTest()
}

async function runComprehensiveTest() {
  try {
    console.log('=== QUICKBOOKS TEST STARTED ===')
    
    // First, check environment variables
    const envCheck = {
      clientId: !!process.env.QUICKBOOKS_CLIENT_ID,
      clientSecret: !!process.env.QUICKBOOKS_CLIENT_SECRET,
      redirectUri: !!process.env.QUICKBOOKS_REDIRECT_URI,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }

    console.log('Environment check:', envCheck)
    console.log('Environment values:', {
      clientId: process.env.QUICKBOOKS_CLIENT_ID ? 'SET' : 'MISSING',
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET ? 'SET' : 'MISSING',
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
    })

    // Check if Supabase client can be created
    try {
      console.log('Testing Supabase client creation...')
      const supabase = await createClient()
      console.log('Supabase client created successfully')
      
      const { data: { user } } = await supabase.auth.getUser()
      console.log('User check result:', { hasUser: !!user, userId: user?.id })

      if (!user) {
        return NextResponse.json({ 
          error: 'User not authenticated',
          envCheck,
          status: 'not_authenticated'
        }, { status: 401 })
      }
    } catch (supabaseError) {
      console.error('Supabase client error:', supabaseError)
      return NextResponse.json({ 
        error: 'Supabase connection failed',
        details: supabaseError instanceof Error ? supabaseError.message : 'Unknown error',
        envCheck,
        status: 'supabase_error'
      }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has QuickBooks integration
    const { data: integration, error: integrationError } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!integration) {
      return NextResponse.json({ 
        error: 'QuickBooks not connected. Please connect your QuickBooks account first.',
        status: 'not_connected',
        envCheck
      }, { status: 400 })
    }

    const integrationStatus = {
      connected: !!integration,
      tokenExpired: integration ? new Date(integration.expires_at) <= new Date() : false,
      realmId: integration?.realm_id || null,
      hasAccessToken: !!integration?.access_token,
      hasRefreshToken: !!integration?.refresh_token,
      expiresAt: integration?.expires_at || null
    }

    // Check if token is expired and refresh if needed
    let accessToken = integration.access_token
    if (integrationStatus.tokenExpired) {
      console.log('Token expired, refreshing...')
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
        return NextResponse.json({ 
          error: 'Failed to refresh QuickBooks token',
          status: 'token_refresh_failed'
        }, { status: 500 })
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

    // Generate timestamp for unique test data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const testResults: {
      timestamp: string
      customerId: string | null
      invoiceId: string | null
      paymentId: string | null
      customerStatus: 'pending' | 'success' | 'failed' | 'error'
      invoiceStatus: 'pending' | 'success' | 'failed' | 'error'
      paymentStatus: 'pending' | 'success' | 'failed' | 'error'
      errors: string[]
    } = {
      timestamp,
      customerId: null,
      invoiceId: null,
      paymentId: null,
      customerStatus: 'pending',
      invoiceStatus: 'pending',
      paymentStatus: 'pending',
      errors: []
    }

    // 1. Create Customer
    console.log('Creating customer...')
    
    // First, let's test the connection and get company info
    let companyInfo = null
    try {
      const companyResponse = await fetch(
        `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/companyinfo/${integration.realm_id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      )

      if (companyResponse.ok) {
        const companyData = await companyResponse.json()
        companyInfo = companyData.CompanyInfo
        console.log('Company info retrieved:', companyInfo.CompanyName)
      } else {
        const errorText = await companyResponse.text()
        console.error('Company info failed:', errorText)
        testResults.errors.push(`Company info failed: ${companyResponse.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Company info error:', error)
      testResults.errors.push(`Company info error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    const customerData = {
      Name: `Test Customer ${timestamp}`,
      PrimaryEmailAddr: {
        Address: `test+${timestamp}@example.com`
      },
      BillAddr: {
        Line1: '123 Test Street',
        City: 'Toronto',
        CountrySubDivisionCode: 'ON',
        PostalCode: 'M5V 3A8',
        Country: 'CA'
      }
    }

    try {
      console.log('Creating customer with data:', JSON.stringify(customerData, null, 2))
      
      const customerResponse = await fetch(
        `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/customer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({ Customer: customerData })
        }
      )

      console.log('Customer response status:', customerResponse.status)
      console.log('Customer response headers:', Object.fromEntries(customerResponse.headers.entries()))

      if (customerResponse.ok) {
        const customerResult = await customerResponse.json()
        testResults.customerId = customerResult.Customer.Id
        testResults.customerStatus = 'success'
        console.log('Customer created successfully:', customerResult.Customer.Id)
      } else {
        const errorText = await customerResponse.text()
        testResults.customerStatus = 'failed'
        testResults.errors.push(`Customer creation failed: ${customerResponse.status} - ${errorText}`)
        console.error('Customer creation failed:', errorText)
        
        // Try to parse the error for better debugging
        try {
          const errorJson = JSON.parse(errorText)
          console.error('Parsed error:', JSON.stringify(errorJson, null, 2))
          
          if (errorJson.Fault?.Error) {
            errorJson.Fault.Error.forEach((err: any, index: number) => {
              testResults.errors.push(`Error ${index + 1}: ${err.Message} - ${err.Detail}`)
            })
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }
        
        // Provide specific guidance for 403 errors
        if (customerResponse.status === 403) {
          testResults.errors.push(`AUTHORIZATION ISSUE: Your QuickBooks app may not have the correct permissions. Please check:
          1. App is set to "Development" in Intuit Developer Portal
          2. App has "com.intuit.quickbooks.accounting" scope
          3. User has granted proper permissions during OAuth
          4. Using sandbox QuickBooks company for testing`)
        }
      }
    } catch (error) {
      testResults.customerStatus = 'error'
      testResults.errors.push(`Customer creation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Customer creation error:', error)
    }

    // 2. Create Invoice (only if customer was created successfully)
    if (testResults.customerId) {
      console.log('Creating invoice...')
      
      // First, try to get or create a test item
      let itemId = '1' // Default fallback
      try {
        // Try to get the first available item
        const itemsResponse = await fetch(
          `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/item?query=SELECT * FROM Item WHERE Type = 'Service' MAXRESULTS 1`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        )

        if (itemsResponse.ok) {
          const itemsResult = await itemsResponse.json()
          if (itemsResult.QueryResponse && itemsResult.QueryResponse.Item && itemsResult.QueryResponse.Item.length > 0) {
            itemId = itemsResult.QueryResponse.Item[0].Id
            console.log('Using existing item:', itemId)
          } else {
            // Create a test item if none exist
            console.log('No items found, creating test item...')
            const itemData = {
              Name: 'Service Test',
              Description: 'Test service item for integration testing',
              Type: 'Service',
              UnitPrice: 100.00,
              IncomeAccountRef: {
                value: '1' // Default income account
              }
            }

            const createItemResponse = await fetch(
              `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/item`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                  'Accept': 'application/json'
                },
                body: JSON.stringify(itemData)
              }
            )

            if (createItemResponse.ok) {
              const itemResult = await createItemResponse.json()
              itemId = itemResult.Item.Id
              console.log('Created test item:', itemId)
            }
          }
        }
      } catch (error) {
        console.error('Error handling items:', error)
        // Continue with default item ID
      }

      const invoiceData = {
        Line: [
          {
            Amount: 100.00,
            DetailType: 'SalesItemLineDetail',
            SalesItemLineDetail: {
              ItemRef: {
                value: itemId
              },
              Qty: 1,
              UnitPrice: 100.00
            }
          }
        ],
        CustomerRef: {
          value: testResults.customerId
        },
        DocNumber: `INV-${timestamp}`,
        PrivateNote: `Test invoice created by napp integration test at ${timestamp}`
      }

      try {
        const invoiceResponse = await fetch(
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

        if (invoiceResponse.ok) {
          const invoiceResult = await invoiceResponse.json()
          testResults.invoiceId = invoiceResult.Invoice.Id
          testResults.invoiceStatus = 'success'
          console.log('Invoice created successfully:', invoiceResult.Invoice.Id)
        } else {
          const errorText = await invoiceResponse.text()
          testResults.invoiceStatus = 'failed'
          testResults.errors.push(`Invoice creation failed: ${invoiceResponse.status} - ${errorText}`)
          console.error('Invoice creation failed:', errorText)
        }
      } catch (error) {
        testResults.invoiceStatus = 'error'
        testResults.errors.push(`Invoice creation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.error('Invoice creation error:', error)
      }
    }

    // 3. Create Payment (only if invoice was created successfully)
    if (testResults.invoiceId) {
      console.log('Creating payment...')
      const paymentData = {
        CustomerRef: {
          value: testResults.customerId
        },
        TotalAmt: 100.00,
        Line: [
          {
            Amount: 100.00,
            LinkedTxn: [
              {
                TxnId: testResults.invoiceId,
                TxnType: 'Invoice'
              }
            ]
          }
        ],
        PrivateNote: `Test payment created by napp integration test at ${timestamp}`
      }

      try {
        const paymentResponse = await fetch(
          `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify(paymentData)
          }
        )

        if (paymentResponse.ok) {
          const paymentResult = await paymentResponse.json()
          testResults.paymentId = paymentResult.Payment.Id
          testResults.paymentStatus = 'success'
          console.log('Payment created successfully:', paymentResult.Payment.Id)
        } else {
          const errorText = await paymentResponse.text()
          testResults.paymentStatus = 'failed'
          testResults.errors.push(`Payment creation failed: ${paymentResponse.status} - ${errorText}`)
          console.error('Payment creation failed:', errorText)
        }
      } catch (error) {
        testResults.paymentStatus = 'error'
        testResults.errors.push(`Payment creation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.error('Payment creation error:', error)
      }
    }

    // 4. Verify the created entities
    const verificationResults = {
      customerVerified: false,
      invoiceVerified: false,
      paymentVerified: false
    }

    if (testResults.customerId) {
      try {
        const verifyCustomerResponse = await fetch(
          `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/customer/${testResults.customerId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        )
        verificationResults.customerVerified = verifyCustomerResponse.ok
      } catch (error) {
        console.error('Customer verification failed:', error)
      }
    }

    if (testResults.invoiceId) {
      try {
        const verifyInvoiceResponse = await fetch(
          `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/invoice/${testResults.invoiceId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        )
        verificationResults.invoiceVerified = verifyInvoiceResponse.ok
      } catch (error) {
        console.error('Invoice verification failed:', error)
      }
    }

    if (testResults.paymentId) {
      try {
        const verifyPaymentResponse = await fetch(
          `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/payment/${testResults.paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        )
        verificationResults.paymentVerified = verifyPaymentResponse.ok
      } catch (error) {
        console.error('Payment verification failed:', error)
      }
    }

    const result = {
      status: 'test_completed',
      user: {
        id: user.id,
        email: user.email
      },
      environment: envCheck,
      integration: integrationStatus,
      testResults,
      verificationResults,
      companyInfo,
      summary: {
        customerCreated: testResults.customerStatus === 'success',
        invoiceCreated: testResults.invoiceStatus === 'success',
        paymentCreated: testResults.paymentStatus === 'success',
        allSuccessful: testResults.customerStatus === 'success' && 
                      testResults.invoiceStatus === 'success' && 
                      testResults.paymentStatus === 'success'
      },
      quickbooksIds: {
        customerId: testResults.customerId,
        invoiceId: testResults.invoiceId,
        paymentId: testResults.paymentId
      },
      diagnostics: {
        realmId: integration.realm_id,
        tokenExpired: integrationStatus.tokenExpired,
        companyName: companyInfo?.CompanyName || 'Unknown',
        companyCountry: companyInfo?.Country || 'Unknown',
        appEnvironment: 'Development (Sandbox)',
        troubleshootingSteps: [
          '1. Verify app is set to "Development" in Intuit Developer Portal',
          '2. Ensure app has "com.intuit.quickbooks.accounting" scope',
          '3. Use sandbox QuickBooks company for testing',
          '4. Re-authenticate user to ensure proper permissions',
          '5. Verify redirect URI matches your development domain'
        ]
      },
      nextSteps: [
        'Visit https://sandbox.qbo.intuit.com to verify the test data',
        'Check Sales → Customers for the test customer',
        'Check Sales → Invoices for the test invoice',
        'Check Sales → Payments for the test payment',
        'Verify invoice status shows "Paid"'
      ],
      message: 'QuickBooks integration test completed',
      timestamp: new Date().toISOString()
    }

    console.log('=== QUICKBOOKS INTEGRATION TEST RESULTS ===')
    console.log('Customer Status:', testResults.customerStatus)
    console.log('Invoice Status:', testResults.invoiceStatus)
    console.log('Payment Status:', testResults.paymentStatus)
    console.log('Customer ID:', testResults.customerId)
    console.log('Invoice ID:', testResults.invoiceId)
    console.log('Payment ID:', testResults.paymentId)
    console.log('All Successful:', result.summary.allSuccessful)
    console.log('==========================================')

    return NextResponse.json(result)
  } catch (error) {
    console.error('QuickBooks test error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 