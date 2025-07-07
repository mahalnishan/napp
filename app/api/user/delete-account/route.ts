import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the user from the request headers (passed from client)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Starting account deletion for user: ${user.email} (${user.id})`)

    // Delete all user data in the correct order to avoid foreign key constraints
    
    // 1. Delete API keys
    const { error: apiKeysError } = await supabase
      .from('api_keys')
      .delete()
      .eq('user_id', user.id)

    if (apiKeysError) {
      console.error('Error deleting API keys:', apiKeysError)
    }

    // 2. Delete webhooks
    const { error: webhooksError } = await supabase
      .from('webhooks')
      .delete()
      .eq('user_id', user.id)

    if (webhooksError) {
      console.error('Error deleting webhooks:', webhooksError)
    }

    // 3. Delete automation rules
    const { error: automationError } = await supabase
      .from('automation_rules')
      .delete()
      .eq('user_id', user.id)

    if (automationError) {
      console.error('Error deleting automation rules:', automationError)
    }

    // 4. Delete locations
    const { error: locationsError } = await supabase
      .from('locations')
      .delete()
      .eq('user_id', user.id)

    if (locationsError) {
      console.error('Error deleting locations:', locationsError)
    }

    // 5. Delete usage tracking
    const { error: usageError } = await supabase
      .from('usage_tracking')
      .delete()
      .eq('user_id', user.id)

    if (usageError) {
      console.error('Error deleting usage tracking:', usageError)
    }

    // 6. Delete user settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', user.id)

    if (settingsError) {
      console.error('Error deleting user settings:', settingsError)
    }

    // 7. Delete subscriptions
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)

    if (subscriptionsError) {
      console.error('Error deleting subscriptions:', subscriptionsError)
    }

    // 8. Delete work order services for all user's orders
    const { data: orders } = await supabase
      .from('work_orders')
      .select('id')
      .eq('user_id', user.id)

    if (orders && orders.length > 0) {
      const orderIds = orders.map(order => order.id)
      
      // Delete work order services
      const { error: workOrderServicesError } = await supabase
        .from('work_order_services')
        .delete()
        .in('work_order_id', orderIds)

      if (workOrderServicesError) {
        console.error('Error deleting work order services:', workOrderServicesError)
      }
    }

    // 9. Delete all work orders
    const { error: workOrdersError } = await supabase
      .from('work_orders')
      .delete()
      .eq('user_id', user.id)

    if (workOrdersError) {
      console.error('Error deleting work orders:', workOrdersError)
      return NextResponse.json({ error: 'Failed to delete work orders' }, { status: 500 })
    }

    // 10. Delete all clients
    const { error: clientsError } = await supabase
      .from('clients')
      .delete()
      .eq('user_id', user.id)

    if (clientsError) {
      console.error('Error deleting clients:', clientsError)
      return NextResponse.json({ error: 'Failed to delete clients' }, { status: 500 })
    }

    // 11. Delete all services
    const { error: servicesDeleteError } = await supabase
      .from('services')
      .delete()
      .eq('user_id', user.id)

    if (servicesDeleteError) {
      console.error('Error deleting services:', servicesDeleteError)
      return NextResponse.json({ error: 'Failed to delete services' }, { status: 500 })
    }

    // 12. Delete all workers
    const { error: workersError } = await supabase
      .from('workers')
      .delete()
      .eq('user_id', user.id)

    if (workersError) {
      console.error('Error deleting workers:', workersError)
      return NextResponse.json({ error: 'Failed to delete workers' }, { status: 500 })
    }

    // 13. Delete user profile
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting user profile:', profileError)
      return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 })
    }

    // 14. Delete the actual auth user account
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError)
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 })
    }

    console.log(`Successfully deleted account for user: ${user.email}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Account and all associated data deleted successfully' 
    })

  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    )
  }
} 