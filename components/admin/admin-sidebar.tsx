'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  LogOut, 
  Settings, 
  Users, 
  FileText, 
  Package, 
  Home, 
  BarChart3, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Database,
  Activity,
  Globe,
  CreditCard,
  AlertTriangle,
  Zap,
  Server
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAdminSidebar } from '@/app/admin/layout'
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

export function AdminSidebar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const { collapsed, setCollapsed } = useAdminSidebar()

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
    { name: 'Overview', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Orders', href: '/admin/orders', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'System Health', href: '/admin/health', icon: Activity },
    { name: 'Database', href: '/admin/database', icon: Database },
    { name: 'API Management', href: '/admin/api', icon: Zap },
    { name: 'Logs', href: '/admin/logs', icon: Server },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-gray-900 border-r border-gray-700 ${
      collapsed ? 'w-16' : 'w-72'
    }`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-500" />
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-800"
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
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {!collapsed && item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-700 p-4">
          {user && (
            <div className={`mb-4 ${collapsed ? 'flex justify-center' : ''}`}>
              {collapsed ? (
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
                <div className="flex items-center space-x-3">
                  <OptimizedImage
                    src={userProfile?.avatar_url || null}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {userProfile?.name || user.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      Developer Admin
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800 ${
                  collapsed ? 'justify-center px-0' : 'justify-start'
                }`}
              >
                <User className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && 'Account'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                User Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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