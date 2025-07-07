import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subscriptionService } from '@/lib/subscription'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has API access feature
    const hasApiAccess = await subscriptionService.hasFeature(user.id, 'apiAccess')
    if (!hasApiAccess) {
      return NextResponse.json({ error: 'API access feature not available on your plan' }, { status: 403 })
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, permissions, last_used, expires_at, is_active, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('Error in api-keys GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has API access feature
    const hasApiAccess = await subscriptionService.hasFeature(user.id, 'apiAccess')
    if (!hasApiAccess) {
      return NextResponse.json({ error: 'API access feature not available on your plan' }, { status: 403 })
    }

    const body = await request.json()
    const { name, permissions, expires_at } = body

    if (!name) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 })
    }

    // Generate API key
    const apiKey = `eff_${crypto.randomBytes(32).toString('hex')}`
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

    const { data: newApiKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        permissions: permissions || [],
        expires_at: expires_at || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    // Return the API key only once (it's hashed in the database)
    return NextResponse.json({ 
      apiKey: {
        ...newApiKey,
        key: apiKey // Only returned on creation
      }
    })
  } catch (error) {
    console.error('Error in api-keys POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 