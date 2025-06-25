import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI
  
  if (!clientId) {
    return NextResponse.json({ error: 'QuickBooks client ID not configured' }, { status: 500 })
  }

  if (!redirectUri) {
    return NextResponse.json({ error: 'QuickBooks redirect URI not configured' }, { status: 500 })
  }

  const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', Date.now().toString())

  return NextResponse.json({ authUrl: authUrl.toString() })
}

export async function POST() {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // QuickBooks OAuth configuration
    const clientId = process.env.QUICKBOOKS_CLIENT_ID
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: 'QuickBooks configuration missing' },
        { status: 500 }
      )
    }

    // Generate OAuth URL
    const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.id}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
} 