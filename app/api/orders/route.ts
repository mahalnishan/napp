import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    let query = supabase
      .from('work_orders')
      .select(`
        *,
        client:clients(*),
        worker:workers(*),
        services:work_order_services(
          *,
          service:services(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    // Add pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: orders, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('work_orders')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    if (clientId) {
      countQuery = countQuery.eq('client_id', clientId)
    }

    const { count } = await countQuery

    return NextResponse.json({
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      client_id,
      assigned_to_type,
      assigned_to_id,
      status,
      schedule_date_time,
      order_amount,
      order_payment_status,
      notes,
      services
    } = body

    // Validate required fields
    if (!client_id || !schedule_date_time || !services || services.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create work order
    const { data: order, error: orderError } = await supabase
      .from('work_orders')
      .insert({
        user_id: user.id,
        client_id,
        assigned_to_type: assigned_to_type || 'Self',
        assigned_to_id: assigned_to_type === 'Worker' ? assigned_to_id : null,
        status: status || 'Pending',
        schedule_date_time,
        order_amount,
        order_payment_status: order_payment_status || 'Unpaid',
        notes
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Create work order services
    const workOrderServices = services.map((service: any) => ({
      work_order_id: order.id,
      service_id: service.serviceId,
      quantity: service.quantity
    }))

    const { error: servicesError } = await supabase
      .from('work_order_services')
      .insert(workOrderServices)

    if (servicesError) {
      // Rollback order creation if services fail
      await supabase.from('work_orders').delete().eq('id', order.id)
      return NextResponse.json({ error: servicesError.message }, { status: 500 })
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 