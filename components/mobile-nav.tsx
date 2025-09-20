'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings, 
  LogOut, 
  Menu,
  X,
  BarChart3,
  Shield,
  User,
  ChevronRight
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OptimizedImage } from '@/components/optimized-image'

interface UserProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  avatar_url: string | null
}

export function MobileNav() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
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
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview and analytics' },
    { name: 'Orders', href: '/dashboard/orders', icon: FileText, description: 'Manage work orders' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, description: 'Reports and insights' },
    { name: 'Clients', href: '/dashboard/clients', icon: Users, description: 'Customer management' },
    { name: 'Services', href: '/dashboard/services', icon: Package, description: 'Service catalog' },
    // Show Admin Panel link only for the developer user
    ...(user?.email === 'nishan.mahal71@gmail.com' ? [
      { name: 'Admin Panel', href: '/admin', icon: Shield, description: 'System administration' }
    ] : []),
  ]

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 w-12 p-0 bg-white/95 backdrop-blur-sm border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          <div className="relative w-6 h-6">
            <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-180' : 'opacity-100 rotate-0'}`} />
            <X className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'}`} />
          </div>
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop with blur effect */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Slide-in menu */}
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex h-full flex-col">
              {/* Header with gradient */}
              <div className="flex h-20 items-center justify-between px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <h1 className="text-xl font-bold">DotOrder.app</h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-full"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User profile section */}
              {user && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <OptimizedImage
                      src={userProfile?.avatar_url || null}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {userProfile?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      {user?.email === 'nishan.mahal71@gmail.com' && (
                        <div className="flex items-center gap-1 mt-1">
                          <Shield className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600 font-medium">Admin</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 border border-transparent hover:border-blue-100"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors duration-200 mr-4">
                        <Icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500 group-hover:text-blue-500">
                          {item.description}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                    </Link>
                  )
                })}
              </nav>

              {/* Footer with settings and sign out */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="space-y-2">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 