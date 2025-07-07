import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuickBooksAPI } from '@/lib/quickbooks'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch order, client, services
    const { data: order, error: orderErr } = await supabase
      .from('work_orders')
      .select(`*, client:clients(id, name, email), services:work_order_services(quantity, service:services(id, name, price))`)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.quickbooks_invoice_id) {
      return NextResponse.json({ message: 'Invoice already sent' })
    }

    // Get QB tokens
    const { data: qb, error: qbErr } = await supabase
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (qbErr || !qb) {
      return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 })
    }

    const tokens = {
      accessToken: qb.access_token,
      refreshToken: qb.refresh_token,
      realmId: qb.realm_id,
      expiresAt: qb.expires_at
    }

    const qbApi = getQuickBooksAPI()

    // Ensure customer exists in QB
    let customerId = qb.customer_id
    if (!customerId) {
      const existing = await qbApi.findCustomerByEmail(order.client.email, tokens)
      if (existing) {
        customerId = existing.Id
      } else {
        const newCust = await qbApi.createCustomer({
          DisplayName: order.client.name,
          PrimaryEmailAddr: { Address: order.client.email }
        }, tokens)
        customerId = newCust.Id
      }
    }

    // Build lines ensuring services exist
    const lines = [] as any[]
    for (const ws of order.services) {
      let serviceId = ws.service.quickbooks_service_id
      if (!serviceId) {
        const existing = await qbApi.findServiceByName(ws.service.name, tokens)
        if (existing) {
          serviceId = existing.Id
        } else {
          const newItem = await qbApi.createService({
            Name: ws.service.name,
            Type: 'Service',
            IncomeAccountRef: { value: process.env.QUICKBOOKS_INCOME_ACCOUNT_ID || '79' }
          } as any, tokens)
          serviceId = newItem.Id
          await supabase.from('services').update({ quickbooks_service_id: serviceId }).eq('id', ws.service.id)
        }
      }

      lines.push({
        Amount: ws.quantity * ws.service.price,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: {
            value: serviceId,
            name: ws.service.name
          },
          Qty: ws.quantity,
          UnitPrice: ws.service.price
        }
      })
    }

    const invoice = await qbApi.createInvoice({
      CustomerRef: { value: customerId },
      Line: lines,
      TxnDate: new Date().toISOString().split('T')[0],
      TotalAmt: order.order_amount,
      Balance: order.order_amount
    }, tokens)

    // Update order
    await supabase
      .from('work_orders')
      .update({ quickbooks_invoice_id: invoice.Id, order_payment_status: 'Pending Invoice' })
      .eq('id', orderId)

    return NextResponse.json({ message: 'Invoice sent', invoiceId: invoice.Id })
  } catch (err) {
    console.error('Send invoice error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 