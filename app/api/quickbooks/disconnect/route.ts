import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the QuickBooks integration
    const { error: deleteError } = await supabase
      .from('quickbooks_integrations')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting QuickBooks integration:', deleteError)
      return NextResponse.json({ error: 'Failed to disconnect QuickBooks' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'QuickBooks disconnected successfully'
    })
  } catch (error) {
    console.error('QuickBooks disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect QuickBooks' }, { status: 500 })
  }
} 