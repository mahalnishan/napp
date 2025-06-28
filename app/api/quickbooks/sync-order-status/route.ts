import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get the order details
    const { data: order, error: orderError } = await supabase
      .from('work_orders')
      .select(`
        *,
        client:clients(*),
        services:work_order_services(
          *,
          service:services(*)
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
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

    // If order doesn't have a QuickBooks invoice ID, create one first
    if (!order.quickbooks_invoice_id) {
      // Create invoice in QuickBooks
      const invoiceData = {
        Line: order.services.map((serviceOrder: any) => ({
          Amount: serviceOrder.service.price * serviceOrder.quantity,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: '1' // Use default item ID for sandbox
            },
            Qty: serviceOrder.quantity,
            UnitPrice: serviceOrder.service.price
          }
        })),
        CustomerRef: {
          value: '1' // Use default customer ID for sandbox
        },
        DocNumber: `INV-${order.id}`,
        PrivateNote: `Order ${order.id} - ${order.client.name}`
      }

      const createInvoiceResponse = await fetch(
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

      if (!createInvoiceResponse.ok) {
        const errorText = await createInvoiceResponse.text()
        return NextResponse.json({ 
          error: 'Failed to create invoice in QuickBooks',
          details: errorText,
          status: createInvoiceResponse.status
        }, { status: 500 })
      }

      const invoiceResult = await createInvoiceResponse.json()
      const invoiceId = invoiceResult.Invoice.Id

      // Update the order with the QuickBooks invoice ID
      const { error: updateOrderError } = await supabase
        .from('work_orders')
        .update({ quickbooks_invoice_id: invoiceId })
        .eq('id', orderId)

      if (updateOrderError) {
        console.error('Failed to update order with invoice ID:', updateOrderError)
      }

      // Update the order object for further processing
      order.quickbooks_invoice_id = invoiceId
    }

    // Now sync the status with QuickBooks
    // Map our status to QuickBooks status
    const statusMapping: Record<string, string> = {
      'Pending': 'Pending',
      'In Progress': 'Pending', // QuickBooks doesn't have "In Progress", use Pending
      'Completed': 'Paid', // Mark as paid when completed
      'Cancelled': 'Voided',
      'Archived': 'Paid' // Treat archived as paid
    }

    const quickbooksStatus = statusMapping[order.status] || 'Pending'

    // Update the invoice status in QuickBooks
    const updateInvoiceData = {
      Id: order.quickbooks_invoice_id,
      sparse: true,
      Line: order.services.map((serviceOrder: any) => ({
        Amount: serviceOrder.service.price * serviceOrder.quantity,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: {
            value: '1'
          },
          Qty: serviceOrder.quantity,
          UnitPrice: serviceOrder.service.price
        }
      })),
      CustomerRef: {
        value: '1'
      },
      DocNumber: `INV-${order.id}`,
      PrivateNote: `Order ${order.id} - ${order.client.name} - Status: ${order.status}`,
      // Set payment status based on order status
      Balance: order.status === 'Completed' || order.status === 'Archived' ? 0 : order.order_amount,
      DueDate: new Date().toISOString().split('T')[0]
    }

    const updateInvoiceResponse = await fetch(
      `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/invoice`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(updateInvoiceData)
      }
    )

    if (!updateInvoiceResponse.ok) {
      const errorText = await updateInvoiceResponse.text()
      return NextResponse.json({ 
        error: 'Failed to update invoice status in QuickBooks',
        details: errorText,
        status: updateInvoiceResponse.status
      }, { status: 500 })
    }

    const updateResult = await updateInvoiceResponse.json()

    // If order is completed, create a payment record
    if (order.status === 'Completed' || order.status === 'Archived') {
      const paymentData = {
        CustomerRef: {
          value: '1'
        },
        TotalAmt: order.order_amount,
        Line: [
          {
            Amount: order.order_amount,
            LinkedTxn: [
              {
                TxnId: order.quickbooks_invoice_id,
                TxnType: 'Invoice'
              }
            ]
          }
        ],
        PrivateNote: `Payment for Order ${order.id} - ${order.client.name}`
      }

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
        console.log('Payment created:', paymentResult.Payment.Id)
      } else {
        console.error('Failed to create payment:', await paymentResponse.text())
      }
    }

    // Update local payment status based on QuickBooks sync
    let newPaymentStatus = order.order_payment_status
    if (order.status === 'Completed' || order.status === 'Archived') {
      newPaymentStatus = 'Paid'
    } else if (order.status === 'Cancelled') {
      newPaymentStatus = 'Unpaid'
    }

    // Update the order's payment status if it changed
    if (newPaymentStatus !== order.order_payment_status) {
      const { error: updatePaymentError } = await supabase
        .from('work_orders')
        .update({ order_payment_status: newPaymentStatus })
        .eq('id', orderId)

      if (updatePaymentError) {
        console.error('Failed to update payment status:', updatePaymentError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order status synced with QuickBooks successfully',
      quickbooksInvoiceId: order.quickbooks_invoice_id,
      updatedPaymentStatus: newPaymentStatus,
      syncedStatus: order.status
    })

  } catch (error) {
    console.error('Sync order status error:', error)
    return NextResponse.json({ 
      error: 'Failed to sync order status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 