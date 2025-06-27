import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all user data in the correct order to avoid foreign key constraints
    
    // 1. Delete work order services for all user's orders
    const { data: orders } = await supabase
      .from('work_orders')
      .select('id')
      .eq('user_id', user.id)

    if (orders && orders.length > 0) {
      const orderIds = orders.map(order => order.id)
      
      // Delete work order services
      const { error: servicesError } = await supabase
        .from('work_order_services')
        .delete()
        .in('work_order_id', orderIds)

      if (servicesError) {
        console.error('Error deleting work order services:', servicesError)
        return NextResponse.json({ error: 'Failed to delete work order services' }, { status: 500 })
      }
    }

    // 2. Delete all work orders
    const { error: ordersError } = await supabase
      .from('work_orders')
      .delete()
      .eq('user_id', user.id)

    if (ordersError) {
      console.error('Error deleting work orders:', ordersError)
      return NextResponse.json({ error: 'Failed to delete work orders' }, { status: 500 })
    }

    // 3. Delete all clients
    const { error: clientsError } = await supabase
      .from('clients')
      .delete()
      .eq('user_id', user.id)

    if (clientsError) {
      console.error('Error deleting clients:', clientsError)
      return NextResponse.json({ error: 'Failed to delete clients' }, { status: 500 })
    }

    // 4. Delete all services
    const { error: servicesDeleteError } = await supabase
      .from('services')
      .delete()
      .eq('user_id', user.id)

    if (servicesDeleteError) {
      console.error('Error deleting services:', servicesDeleteError)
      return NextResponse.json({ error: 'Failed to delete services' }, { status: 500 })
    }

    // 5. Delete all workers
    const { error: workersError } = await supabase
      .from('workers')
      .delete()
      .eq('user_id', user.id)

    if (workersError) {
      console.error('Error deleting workers:', workersError)
      return NextResponse.json({ error: 'Failed to delete workers' }, { status: 500 })
    }

    // 6. Delete QuickBooks integration
    const { error: qbError } = await supabase
      .from('quickbooks_integrations')
      .delete()
      .eq('user_id', user.id)

    if (qbError) {
      console.error('Error deleting QuickBooks integration:', qbError)
      // Don't fail the deletion for this, just log it
    }

    // 7. Delete user profile
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting user profile:', profileError)
      return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 })
    }

    // 8. Sign out the user (this will invalidate their session)
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('Error signing out user:', signOutError)
      // Don't fail the deletion for this, just log it
    }

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