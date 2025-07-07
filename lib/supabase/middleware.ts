import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found in middleware')
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Allow access to landing page and auth pages without authentication
    const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/callback']
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path)

    if (
      !user &&
      !isPublicPath &&
      request.nextUrl.pathname.startsWith('/dashboard')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // If user is authenticated, check if they have a profile
    if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // User exists in auth but not in users table - redirect to registration
        const url = request.nextUrl.clone()
        url.pathname = '/auth/register'
        return NextResponse.redirect(url)
      }
    }

    if (
      user &&
      request.nextUrl.pathname.startsWith('/auth')
    ) {
      // Check if user has a profile before redirecting
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profile) {
        // User has a profile, redirect to dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      } else if (request.nextUrl.pathname === '/auth/login') {
        // User exists in auth but not in users table, redirect to registration
        const url = request.nextUrl.clone()
        url.pathname = '/auth/register'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    // Return the response without authentication checks if there's an error
    return supabaseResponse
  }
} 