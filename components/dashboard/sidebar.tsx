'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, Users, FileText, Package, Home, BarChart3, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useSidebar } from '@/app/dashboard/layout'
import { OptimizedImage } from '@/components/optimized-image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  avatar_url: string | null
}

export function Sidebar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const { collapsed, setCollapsed } = useSidebar()

  const getUser = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user) {
      // Fetch user profile data
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setUserProfile(profile)
    }
  }, [])

  useEffect(() => {
    getUser()
  }, [getUser])

  const handleSignOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Orders', href: '/dashboard/orders', icon: FileText },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Services', href: '/dashboard/services', icon: Package },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-white border-r border-gray-200 ${
      collapsed ? 'w-16' : 'w-72'
    }`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <h1 className="text-xl font-bold text-gray-900">Effortless</h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {!collapsed && item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section with Settings dropdown */}
        <div className="border-t border-gray-200 p-4">
          {user && (
            <div className={`mb-4 ${collapsed ? 'flex justify-center' : ''}`}>
              {collapsed ? (
                // Show only profile picture when collapsed
                <div className="flex justify-center">
                  <OptimizedImage
                    src={userProfile?.avatar_url || null}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
              ) : (
                // Show name and profile picture when expanded
                <div className="flex items-center space-x-3">
                  <OptimizedImage
                    src={userProfile?.avatar_url || null}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {userProfile?.name || user.email}
                    </p>
                    {userProfile?.name && (
                      <p className="text-xs text-gray-500">
                        {user.email}
                      </p>
                    )}
                    {/* Admin badge removed */}
                  </div>
                </div>
              )}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full flex items-center justify-center text-gray-600 hover:text-gray-900 ${
                  collapsed ? 'justify-center px-0' : 'justify-start'
                }`}
              >
                <User className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && 'Account'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
} 