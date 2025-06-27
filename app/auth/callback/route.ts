import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorUrl = `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      const errorUrl = `${origin}/auth/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
      return NextResponse.redirect(errorUrl)
    }

    // Successful authentication
    const forwardedHost = request.headers.get('x-forwarded-host')
    const redirectUrl = forwardedHost
      ? `https://${forwardedHost}${next}`
      : `${origin}${next}`
    return NextResponse.redirect(redirectUrl)
  }

  // No code or error - redirect to login
  const errorUrl = `${origin}/auth/login?error=${encodeURIComponent('Invalid authentication request.')}`
  return NextResponse.redirect(errorUrl)
} 