import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subscriptionService } from '@/lib/subscription'
import { executeWithRetry, logDatabaseError } from '@/lib/supabase/database-utils'

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
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const search = searchParams.get('search')

    // Use retry logic for the main query
    const result = await executeWithRetry(async () => {
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

      if (search) {
        // Search in client name, notes, and order ID
        query = query.or(`clients.name.ilike.%${search}%,notes.ilike.%${search}%,id.ilike.%${search}%`)
      }

      // Add pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      return await query
    }, { timeout: 15000, maxRetries: 3 })

    const { data: orders, error } = result

    if (error) {
      logDatabaseError(error, 'orders-get-query')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get total count for pagination with retry
    const countResult = await executeWithRetry(async () => {
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

      if (search) {
        // Search in client name, notes, and order ID
        countQuery = countQuery.or(`clients.name.ilike.%${search}%,notes.ilike.%${search}%,id.ilike.%${search}%`)
      }

      return await countQuery
    }, { timeout: 10000, maxRetries: 2 })

    const { count } = countResult

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
    logDatabaseError(error instanceof Error ? error : new Error('Orders GET error'), 'orders-get')
    return NextResponse.json(
      { error: 'Database connection error. Please try again.' },
      { status: 503 }
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

    // Check if user can create work order (usage limits) with retry
    const canCreateWorkOrder = await executeWithRetry(
      () => subscriptionService.canCreateWorkOrder(user.id),
      { timeout: 5000, maxRetries: 2 }
    )
    
    if (!canCreateWorkOrder) {
      return NextResponse.json(
        { error: 'Work order limit reached. Please upgrade your plan to create more work orders.' },
        { status: 403 }
      )
    }

    // Create work order with retry
    const orderResult = await executeWithRetry(async () => {
      return await supabase
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
    }, { timeout: 15000, maxRetries: 3 })

    const { data: order, error: orderError } = orderResult

    if (orderError) {
      logDatabaseError(orderError, 'orders-post-create')
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Create work order services with retry
    const workOrderServices = services.map((service: any) => ({
      work_order_id: order.id,
      service_id: service.serviceId,
      quantity: service.quantity
    }))

    const servicesResult = await executeWithRetry(async () => {
      return await supabase
        .from('work_order_services')
        .insert(workOrderServices)
    }, { timeout: 10000, maxRetries: 3 })

    const { error: servicesError } = servicesResult

    if (servicesError) {
      // Rollback order creation if services fail
      await supabase.from('work_orders').delete().eq('id', order.id)
      logDatabaseError(servicesError, 'orders-post-services')
      return NextResponse.json({ error: servicesError.message }, { status: 500 })
    }

    // Increment usage tracking with retry
    await executeWithRetry(
      () => subscriptionService.incrementWorkOrderCount(user.id),
      { timeout: 5000, maxRetries: 2 }
    )

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    logDatabaseError(error instanceof Error ? error : new Error('Orders POST error'), 'orders-post')
    return NextResponse.json(
      { error: 'Database connection error. Please try again.' },
      { status: 503 }
    )
  }
} 