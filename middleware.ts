import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { checkDatabaseHealth, logDatabaseError } from './lib/supabase/database-utils'

export async function middleware(request: NextRequest) {
  try {
    // Check database health for critical paths
    const criticalPaths = ['/dashboard', '/api/orders', '/api/clients']
    const isCriticalPath = criticalPaths.some(path => request.nextUrl.pathname.startsWith(path))
    
    if (isCriticalPath) {
      const dbHealth = await checkDatabaseHealth(true, {
        timeout: 3000, // 3 second timeout for middleware
        maxRetries: 1,
        retryDelay: 500,
      })
      
      if (!dbHealth.connected) {
        logDatabaseError(new Error(dbHealth.error || 'Database connection failed'), `middleware-${request.nextUrl.pathname}`)
        
        // For API routes, return error response
        if (request.nextUrl.pathname.startsWith('/api/')) {
          return NextResponse.json(
            { 
              error: 'Database connection temporarily unavailable',
              retryAfter: 30,
              timestamp: new Date().toISOString()
            },
            { status: 503, headers: { 'Retry-After': '30' } }
          )
        }
        
        // For pages, redirect to maintenance page or show error
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
          return NextResponse.redirect(new URL('/maintenance', request.url))
        }
      }
    }
    
    return await updateSession(request)
  } catch (error) {
    // Log the error but don't break the request flow
    logDatabaseError(error instanceof Error ? error : new Error('Middleware error'), 'middleware')
    
    // Continue with the request even if health check fails
    return await updateSession(request)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
} 