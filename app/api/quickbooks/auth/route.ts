import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('QuickBooks auth GET started')
    
    const clientId = process.env.QUICKBOOKS_CLIENT_ID
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI
    
    console.log('Auth environment check:', {
      hasClientId: !!clientId,
      hasRedirectUri: !!redirectUri,
      redirectUri
    })
    
    if (!clientId) {
      console.error('QuickBooks client ID not configured')
      return NextResponse.json({ error: 'QuickBooks client ID not configured' }, { status: 500 })
    }

    if (!redirectUri) {
      console.error('QuickBooks redirect URI not configured')
      return NextResponse.json({ error: 'QuickBooks redirect URI not configured' }, { status: 500 })
    }

    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', Date.now().toString())

    console.log('Generated auth URL:', authUrl.toString())
    
    return NextResponse.json({ authUrl: authUrl.toString() })
  } catch (error) {
    console.error('QuickBooks auth GET error:', error)
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('QuickBooks auth POST started')
    
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('No user found in auth POST')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated in auth POST:', user.id)

    // QuickBooks OAuth configuration
    const clientId = process.env.QUICKBOOKS_CLIENT_ID
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI

    console.log('Auth POST environment check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
      redirectUri
    })

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('QuickBooks configuration missing in auth POST')
      return NextResponse.json(
        { error: 'QuickBooks configuration missing' },
        { status: 500 }
      )
    }

    // Generate OAuth URL
    const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.id}`

    console.log('Generated auth URL in POST:', authUrl)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('QuickBooks auth POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
} 