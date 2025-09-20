'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { useState, useEffect, createContext, useContext } from 'react'

// Create context for sidebar state
const SidebarContext = createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}>({
  collapsed: false,
  setCollapsed: () => {}
})

export const useSidebar = () => useContext(SidebarContext)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
        } else {
          setUser(user)
        }
      } catch (error) {
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }
    
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        {/* Sidebar - hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Mobile Navigation */}
        <MobileNav />
        
        {/* Main Content */}
        <div className={`transition-all duration-300 ${
          collapsed ? 'lg:pl-16' : 'lg:pl-72'
        }`}>
          <main className="py-4 sm:py-6 lg:py-10">
            <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
              {/* Mobile spacing for hamburger menu */}
              <div className="lg:hidden h-16"></div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
} 