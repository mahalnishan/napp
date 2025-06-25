import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const response = await fetch(request.url, {
    headers: request.headers,
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    response.headers.set('x-middleware-cache', 'no-cache')
  }

  return response
} 