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
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      const errorUrl = `${origin}/auth/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
      return NextResponse.redirect(errorUrl)
    }

    // If authentication was successful and we have user data
    if (data.user) {
      try {
        // Extract user information from Google OAuth
        const user = data.user
        const userMetadata = user.user_metadata || {}
        
        // Get the user's name from Google OAuth data
        let userName = null
        if (userMetadata.full_name) {
          userName = userMetadata.full_name
        } else if (userMetadata.name) {
          userName = userMetadata.name
        } else if (userMetadata.first_name && userMetadata.last_name) {
          userName = `${userMetadata.first_name} ${userMetadata.last_name}`
        }

        // Wait a moment for the trigger to create the user profile
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if user profile exists (should be created by trigger)
        const { data: existingProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking user profile:', profileError)
        }

        // If profile doesn't exist, the trigger might have failed
        if (!existingProfile) {
          console.log('User profile not found, attempting manual creation')
          
          // Try to create the profile manually as fallback
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              name: userName,
              avatar_url: userMetadata.avatar_url || null,
              role: 'user'
            })

          if (insertError) {
            console.error('Error creating user profile:', insertError)
            const errorUrl = `${origin}/auth/login?error=${encodeURIComponent('Failed to create account. Please try again.')}`
            return NextResponse.redirect(errorUrl)
          }
        } else if (userName && !existingProfile.name) {
          // Update existing profile with name if it's missing
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              name: userName,
              avatar_url: userMetadata.avatar_url || existingProfile.avatar_url
            })
            .eq('id', user.id)

          if (updateError) {
            console.error('Error updating user profile:', updateError)
          } else {
            console.log('User profile updated with Google data')
          }
        }
      } catch (profileError) {
        console.error('Error handling user profile:', profileError)
        // Don't fail the authentication for profile errors
      }
    }

    // Successful authentication
    const forwardedHost = request.headers.get('x-forwarded-host')
    const redirectUrl = forwardedHost
      ? `http://${forwardedHost}${next}`
      : `${origin}${next}`
    return NextResponse.redirect(redirectUrl)
  }

  // No code or error - redirect to login
  const errorUrl = `${origin}/auth/login?error=${encodeURIComponent('Invalid authentication request.')}`
  return NextResponse.redirect(errorUrl)
} 