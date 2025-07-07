'use client'

import { useState } from 'react'
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
  Shield
} from 'lucide-react'
import { useAdminSidebar } from '@/app/admin/layout'

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { collapsed } = useAdminSidebar()

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
    <div className="lg:hidden">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-gray-900">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-500" />
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
} 