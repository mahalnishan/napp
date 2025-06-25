import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('intuit-signature')

    // Verify webhook signature (you should implement proper signature verification)
    // For now, we'll skip verification for development

    const payload = JSON.parse(body)
    
    // Handle different webhook events
    if (payload.eventNotifications) {
      for (const notification of payload.eventNotifications) {
        const dataChangeEvent = notification.dataChangeEvent
        
        if (dataChangeEvent && dataChangeEvent.entities) {
          for (const entity of dataChangeEvent.entities) {
            if (entity.name === 'Invoice') {
              await handleInvoiceChange(entity)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleInvoiceChange(entity: any) {
  const supabase = await createClient()
  
  try {
    // Get the invoice details from QuickBooks
    const invoiceId = entity.id
    
    // Find the order with this QuickBooks invoice ID
    const { data: order } = await supabase
      .from('work_orders')
      .select('*')
      .eq('quickbooks_invoice_id', invoiceId)
      .single()

    if (!order) {
      console.log(`No order found for QuickBooks invoice ${invoiceId}`)
      return
    }

    // Get the QuickBooks integration to make API calls
    const { data: integration } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', order.user_id)
      .single()

    if (!integration) {
      console.log(`No QuickBooks integration found for user ${order.user_id}`)
      return
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

      if (refreshResponse.ok) {
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
          .eq('user_id', order.user_id)

        if (updateError) {
          console.error('Failed to update tokens in webhook:', updateError)
        }
      } else {
        console.error('Failed to refresh token in webhook')
        return
      }
    }

    // Get the current invoice status from QuickBooks (using sandbox URL)
    const invoiceResponse = await fetch(
      `https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realm_id}/invoice/${invoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )

    if (invoiceResponse.ok) {
      const invoiceData = await invoiceResponse.json()
      const invoice = invoiceData.Invoice
      
      // Update payment status based on invoice status
      let newPaymentStatus = order.order_payment_status
      
      if (invoice.Balance === 0) {
        newPaymentStatus = 'Paid'
      } else if (invoice.EmailStatus === 'EmailSent') {
        newPaymentStatus = 'Pending Invoice'
      } else {
        newPaymentStatus = 'Unpaid'
      }

      // Update the order if payment status changed
      if (newPaymentStatus !== order.order_payment_status) {
        const { error: updateOrderError } = await supabase
          .from('work_orders')
          .update({ order_payment_status: newPaymentStatus })
          .eq('id', order.id)

        if (updateOrderError) {
          console.error('Failed to update order payment status:', updateOrderError)
        } else {
          console.log(`Updated order ${order.id} payment status to ${newPaymentStatus}`)
        }
      }
    } else {
      console.error('Failed to fetch invoice from QuickBooks:', await invoiceResponse.text())
    }
  } catch (error) {
    console.error('Error handling invoice change:', error)
  }
} 