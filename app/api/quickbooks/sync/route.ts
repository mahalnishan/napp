import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickbooksDirectAPI } from '@/lib/quickbooks-direct'

export async function POST(request: NextRequest) {
  console.log('QuickBooks sync started')
  
  // Set a timeout for the entire sync operation
  const syncTimeout = setTimeout(() => {
    console.error('Sync operation timed out after 60 seconds')
  }, 60000) // 60 seconds timeout
  
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Get the QuickBooks integration
    const { data: integration, error: fetchError } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !integration) {
      console.log('Integration fetch error:', fetchError)
      return NextResponse.json({ error: 'No QuickBooks integration found' }, { status: 404 })
    }

    console.log('QuickBooks integration found')

    // Check if tokens are expired
    const expiresAt = new Date(integration.expires_at)
    if (expiresAt < new Date()) {
      console.log('Tokens expired')
      return NextResponse.json({ error: 'QuickBooks tokens expired. Please refresh.' }, { status: 401 })
    }

    console.log('Tokens valid')

    const tokens = {
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
      realmId: integration.realm_id,
      expiresAt: expiresAt
    }

    const { syncType } = await request.json()
    console.log('Sync type requested:', syncType)
    
    let syncResults: { customers: number; services: number; invoices: number; errors: string[] } = { 
      customers: 0, 
      services: 0, 
      invoices: 0, 
      errors: [] 
    }

    try {
      // Sync customers - SKIP CREATION since API doesn't support it
      if (!syncType || syncType === 'customers') {
        console.log('=== CUSTOMER SYNC (READ-ONLY) ===')
        console.log('Note: Customer creation not supported by QuickBooks API - only syncing existing customers')
        
        // Only pull customers from QuickBooks (no creation)
        try {
          const qbCustomers = await quickbooksDirectAPI.getCustomers(tokens, 100)
          console.log(`Found ${qbCustomers.length} customers in QuickBooks`)
          
          let importedCount = 0
          for (const qbCustomer of qbCustomers) {
            try {
              // Check if customer already exists locally
              const { data: existingCustomer } = await supabase
                .from('clients')
                .select('id')
                .eq('quickbooks_customer_id', qbCustomer.Id)
                .single()

              if (!existingCustomer) {
                // Create local customer from QuickBooks data
                await supabase
                  .from('clients')
                  .insert({
                    user_id: user.id,
                    name: qbCustomer.DisplayName || qbCustomer.Name || 'Unknown Customer',
                    email: qbCustomer.PrimaryEmailAddr?.Address || qbCustomer.EmailAddress,
                    phone: qbCustomer.PrimaryPhone?.FreeFormNumber || qbCustomer.Phone,
                    address: qbCustomer.BillAddr?.Line1,
                    quickbooks_customer_id: qbCustomer.Id,
                    is_active: qbCustomer.Active !== false
                  })
                
                importedCount++
                console.log(`Imported customer: ${qbCustomer.DisplayName || qbCustomer.Name}`)
              }
            } catch (error) {
              console.error(`Error importing customer ${qbCustomer.Id}:`, error)
            }
          }
          
          console.log(`Imported ${importedCount} new customers from QuickBooks`)
          syncResults.customers = importedCount
        } catch (error) {
          console.error('Error pulling customers from QuickBooks:', error)
          syncResults.errors.push(`Failed to pull customers from QuickBooks: ${error}`)
        }

        // Note: Customer creation to QuickBooks is not supported by the API
        console.log('Customer creation to QuickBooks skipped - not supported by API')
      }

      // Sync services
      if (!syncType || syncType === 'services') {
        const { data: localServices } = await supabase
          .from('services')
          .select('*')
          .eq('user_id', user.id)
          .is('quickbooks_service_id', null)

        console.log('Unsynced services:', localServices?.map(s => s.name) || [])

        for (const service of localServices || []) {
          try {
            console.log(`Processing service: ${service.name}`)
            const existingService = await quickbooksDirectAPI.findServiceByName(service.name, tokens)
            
            if (!existingService) {
              // Build service object with minimal validated structure
              const serviceData: any = {
                Name: service.name,
                Type: 'Service'
              }

              console.log('Creating service in QuickBooks with payload:', serviceData)
              const qbService = await quickbooksDirectAPI.createService(tokens, serviceData)
              console.log('Service created in QuickBooks:', qbService)

              // Update local service with QuickBooks ID
              await supabase
                .from('services')
                .update({ quickbooks_service_id: qbService.Id })
                .eq('id', service.id)

              syncResults.services++
            }
          } catch (error) {
            console.error(`Error syncing service ${service.id}:`, error)
            syncResults.errors.push(`Service ${service.name}: ${error}`)
          }
        }
      }

      // Sync invoices (work orders)
      if (!syncType || syncType === 'invoices') {
        const { data: localOrders } = await supabase
          .from('work_orders')
          .select(`
            *,
            clients (name, email, quickbooks_customer_id),
            work_order_services (
              services (name, price, quickbooks_service_id)
            )
          `)
          .eq('user_id', user.id)
          .is('quickbooks_invoice_id', null)
          .eq('order_payment_status', 'Pending Invoice')

        console.log('Unsynced work orders:', localOrders?.map(o => o.id) || [])

        for (const order of localOrders || []) {
          try {
            console.log(`Processing work order: ${order.id}`)
            if (!order.clients?.quickbooks_customer_id) {
              syncResults.errors.push(`Order ${order.id}: Customer not synced to QuickBooks`)
              continue
            }

            // Create invoice in QuickBooks
            const invoiceLines = order.work_order_services.map((woService: any) => ({
              Amount: woService.services.price * woService.quantity,
              DetailType: 'SalesItemLineDetail',
              SalesItemLineDetail: {
                ItemRef: {
                  value: woService.services.quickbooks_service_id || '1', // Default service if not synced
                  name: woService.services.name
                },
                Qty: woService.quantity,
                UnitPrice: woService.services.price
              }
            }))

            // Build invoice object with only valid properties
            const invoiceData: any = {
              CustomerRef: {
                value: order.clients.quickbooks_customer_id,
                name: order.clients.name
              },
              Line: invoiceLines,
              TotalAmt: order.order_amount,
              Balance: order.order_amount,
              TxnDate: new Date(order.schedule_date_time).toISOString().split('T')[0]
            }

            // Only add notes if they exist
            if (order.notes) {
              invoiceData.PrivateNote = order.notes
            }

            console.log('Creating invoice in QuickBooks with payload:', invoiceData)

            const qbInvoice = await quickbooksDirectAPI.createInvoice(invoiceData, tokens)

            console.log('Invoice created in QuickBooks:', qbInvoice)

            // Update local order with QuickBooks invoice ID
            await supabase
              .from('work_orders')
              .update({ 
                quickbooks_invoice_id: qbInvoice.Id,
                order_payment_status: 'Pending Invoice'
              })
              .eq('id', order.id)

            syncResults.invoices++
          } catch (error) {
            console.error(`Error syncing order ${order.id}:`, error)
            syncResults.errors.push(`Order ${order.id}: ${error}`)
          }
        }
      }

      clearTimeout(syncTimeout)
      console.log('Sync completed successfully')
      
      return NextResponse.json({
        success: true,
        message: `Sync completed. ${syncResults.customers} customers, ${syncResults.services} services, ${syncResults.invoices} invoices synced.`,
        results: syncResults
      })

    } catch (error) {
      clearTimeout(syncTimeout)
      console.error('QuickBooks sync error:', error)
      return NextResponse.json({ error: 'Failed to sync with QuickBooks' }, { status: 500 })
    }
  } catch (error) {
    clearTimeout(syncTimeout)
    console.error('QuickBooks sync error:', error)
    return NextResponse.json({ error: 'Failed to sync with QuickBooks' }, { status: 500 })
  }
} 