import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== BULK CUSTOMER CREATION STARTED ===')
    
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
        status: 'not_connected'
      }, { status: 400 })
    }

    // Check if token is expired and refresh if needed
    let accessToken = integration.access_token
    if (new Date(integration.expires_at) <= new Date()) {
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
    const simpleTimestamp = Date.now().toString()
    
    // Test customer data - 10 different customers
    const testCustomers = [
      {
        Name: `Test Customer 1`,
        PrimaryEmailAddr: {
          Address: `customer1.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '123 Main Street',
          City: 'Toronto',
          CountrySubDivisionCode: 'ON',
          PostalCode: 'M5V 3A8',
          Country: 'CA'
        }
      },
      {
        Name: `Test Customer 2`,
        PrimaryEmailAddr: {
          Address: `customer2.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '456 Oak Avenue',
          City: 'Vancouver',
          CountrySubDivisionCode: 'BC',
          PostalCode: 'V6B 1A1',
          Country: 'CA'
        }
      },
      {
        Name: `Test Customer 3`,
        PrimaryEmailAddr: {
          Address: `customer3.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '789 Pine Road',
          City: 'Montreal',
          CountrySubDivisionCode: 'QC',
          PostalCode: 'H2Y 1C6',
          Country: 'CA'
        }
      },
      {
        Name: `Test Customer 4`,
        PrimaryEmailAddr: {
          Address: `customer4.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '321 Elm Street',
          City: 'Calgary',
          CountrySubDivisionCode: 'AB',
          PostalCode: 'T2P 1J9',
          Country: 'CA'
        }
      },
      {
        Name: `Test Customer 5`,
        PrimaryEmailAddr: {
          Address: `customer5.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '654 Maple Drive',
          City: 'Edmonton',
          CountrySubDivisionCode: 'AB',
          PostalCode: 'T5J 0R2',
          Country: 'CA'
        }
      },
      {
        Name: `Test Customer 6`,
        PrimaryEmailAddr: {
          Address: `customer6.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '987 Cedar Lane',
          City: 'Ottawa',
          CountrySubDivisionCode: 'ON',
          PostalCode: 'K1P 1J1',
          Country: 'CA'
        }
      },
      {
        Name: `Test Customer 7`,
        PrimaryEmailAddr: {
          Address: `customer7.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '147 Birch Boulevard',
          City: 'Winnipeg',
          CountrySubDivisionCode: 'MB',
          PostalCode: 'R3C 0P8',
          Country: 'CA'
        }
      },
      {
        Name: `Test Customer 8`,
        PrimaryEmailAddr: {
          Address: `customer8.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '258 Spruce Street',
          City: 'Quebec City',
          CountrySubDivisionCode: 'QC',
          PostalCode: 'G1R 4P3',
          Country: 'CA'
        }
      },
      {
        Name: `Test Customer 9`,
        PrimaryEmailAddr: {
          Address: `customer9.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '369 Willow Way',
          City: 'Halifax',
          CountrySubDivisionCode: 'NS',
          PostalCode: 'B3J 1S9',
          Country: 'CA'
        }
      },
      {
        Name: `Test Customer 10`,
        PrimaryEmailAddr: {
          Address: `customer10.${simpleTimestamp}@example.com`
        },
        BillAddr: {
          Line1: '741 Ash Avenue',
          City: 'Victoria',
          CountrySubDivisionCode: 'BC',
          PostalCode: 'V8W 1P6',
          Country: 'CA'
        }
      }
    ]

    const results = {
      timestamp,
      totalCustomers: testCustomers.length,
      successful: 0,
      failed: 0,
      customerIds: [] as string[],
      errors: [] as string[]
    }

    console.log(`Creating ${testCustomers.length} customers...`)

    // Create customers one by one
    for (let i = 0; i < testCustomers.length; i++) {
      const customerData = testCustomers[i]
      console.log(`Creating customer ${i + 1}/${testCustomers.length}: ${customerData.Name}`)
      console.log('Customer data being sent:', JSON.stringify({ Customer: customerData }, null, 2))

      // Validate customer data before sending
      if (!customerData.Name || customerData.Name.trim() === '') {
        results.failed++
        results.errors.push(`Customer ${i + 1} failed: Missing or empty customer name`)
        console.error(`Customer ${i + 1} validation failed: Missing name`)
        continue
      }

      try {
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

        console.log(`Customer ${i + 1} response status:`, customerResponse.status)
        console.log(`Customer ${i + 1} response headers:`, Object.fromEntries(customerResponse.headers.entries()))

        if (customerResponse.ok) {
          const customerResult = await customerResponse.json()
          results.customerIds.push(customerResult.Customer.Id)
          results.successful++
          console.log(`Customer ${i + 1} created successfully: ${customerResult.Customer.Id}`)
        } else {
          const errorText = await customerResponse.text()
          results.failed++
          results.errors.push(`Customer ${i + 1} failed: ${customerResponse.status} - ${errorText}`)
          console.error(`Customer ${i + 1} creation failed:`, errorText)
          
          // Try to parse the error for better debugging
          try {
            const errorJson = JSON.parse(errorText)
            console.error(`Customer ${i + 1} parsed error:`, JSON.stringify(errorJson, null, 2))
            
            if (errorJson.Fault?.Error) {
              errorJson.Fault.Error.forEach((err: any, index: number) => {
                console.error(`Customer ${i + 1} error ${index + 1}: ${err.Message} - ${err.Detail}`)
                results.errors.push(`Customer ${i + 1} error ${index + 1}: ${err.Message} - ${err.Detail}`)
              })
            }
          } catch (parseError) {
            console.error(`Customer ${i + 1} could not parse error response:`, parseError)
          }
        }
      } catch (error) {
        results.failed++
        results.errors.push(`Customer ${i + 1} error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.error(`Customer ${i + 1} creation error:`, error)
      }

      // Add a small delay between requests to avoid rate limiting
      if (i < testCustomers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    const result = {
      status: 'bulk_creation_completed',
      user: {
        id: user.id,
        email: user.email
      },
      results,
      summary: {
        total: results.totalCustomers,
        successful: results.successful,
        failed: results.failed,
        successRate: Math.round((results.successful / results.totalCustomers) * 100)
      },
      nextSteps: [
        'Visit https://sandbox.qbo.intuit.com to verify the created customers',
        'Check Sales → Customers to see all test customers',
        'Each customer has a unique timestamp for easy identification',
        'Customers are created with Canadian addresses for testing'
      ],
      message: `Bulk customer creation completed. ${results.successful} successful, ${results.failed} failed.`,
      timestamp: new Date().toISOString()
    }

    console.log('=== BULK CUSTOMER CREATION RESULTS ===')
    console.log('Total:', results.totalCustomers)
    console.log('Successful:', results.successful)
    console.log('Failed:', results.failed)
    console.log('Success Rate:', result.summary.successRate + '%')
    console.log('Customer IDs:', results.customerIds)
    console.log('=====================================')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bulk customer creation error:', error)
    return NextResponse.json({ 
      error: 'Bulk creation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 