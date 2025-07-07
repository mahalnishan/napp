'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav'
import { useState, useEffect, createContext, useContext } from 'react'
import { PageLoading } from '@/components/ui/loading'

// Create context for sidebar state
const AdminSidebarContext = createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}>({
  collapsed: false,
  setCollapsed: () => {}
})

export const useAdminSidebar = () => useContext(AdminSidebarContext)

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Authentication required for admin access')
        router.push('/auth/login')
        return
      }

      // Check if user has admin role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        router.push('/dashboard')
        return
      }

      if (userProfile?.role !== 'admin') {
        console.error('Admin access required. User role:', userProfile?.role)
        router.push('/dashboard')
        return
      }

      setUser(user)
      setIsAdmin(true)
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoading />
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect in useEffect
  }

  return (
    <AdminSidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Mobile Navigation */}
        <AdminMobileNav />
        
        {/* Main Content */}
        <div className={`transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-72'
        }`}>
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminSidebarContext.Provider>
  )
} 