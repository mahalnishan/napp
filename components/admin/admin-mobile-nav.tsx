'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  CreditCard, 
  Activity, 
  Database, 
  Zap, 
  Server, 
  Settings,
  Shield,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { useAdminSidebar } from '@/app/admin/layout'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { collapsed } = useAdminSidebar()
  const router = useRouter()

  const navigation = [
    { name: 'Overview', href: '/admin', icon: Home, description: 'System overview' },
    { name: 'Users', href: '/admin/users', icon: Users, description: 'User management' },
    { name: 'Orders', href: '/admin/orders', icon: FileText, description: 'All work orders' },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'System analytics' },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard, description: 'Billing & plans' },
    { name: 'System Health', href: '/admin/health', icon: Activity, description: 'System monitoring' },
    { name: 'Database', href: '/admin/database', icon: Database, description: 'Database management' },
    { name: 'API Management', href: '/admin/api', icon: Zap, description: 'API keys & usage' },
    { name: 'Logs', href: '/admin/logs', icon: Server, description: 'System logs' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, description: 'Admin settings' },
  ]

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

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
    <div className="lg:hidden">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 w-12 p-0 bg-gray-900/90 backdrop-blur-sm text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200"
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
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop with blur effect */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Slide-in menu */}
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex h-full flex-col">
              {/* Header with gradient */}
              <div className="flex h-20 items-center justify-between px-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-red-400" />
                  </div>
                  <h1 className="text-xl font-bold">Admin Panel</h1>
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

              {/* Admin badge */}
              <div className="px-6 py-3 bg-red-500/10 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Administrator Access</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 border border-transparent hover:border-gray-700"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors duration-200 mr-4">
                        <Icon className="h-5 w-5 text-gray-400 group-hover:text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500 group-hover:text-gray-300">
                          {item.description}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors duration-200" />
                    </Link>
                  )
                })}
              </nav>

              {/* Footer with sign out */}
              <div className="border-t border-gray-700 p-4 bg-gray-800">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start px-4 py-3 text-sm font-medium rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 