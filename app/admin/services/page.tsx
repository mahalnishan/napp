'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Wrench, 
  Search, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Plus,
  TrendingUp,
  Package,
  Clock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number | null
  created_at: string
  updated_at: string
  user_id: string
  user?: {
    email: string
    name: string | null
  }
  _count?: {
    work_orders: number
  }
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    filterServices()
  }, [services, searchTerm])

  const fetchServices = async () => {
    try {
      const supabase = createClient()
      
      // Fetch services with user details and order count
      const { data: servicesData, error } = await supabase
        .from('services')
        .select(`
          *,
          user:users(email, name),
          _count:work_orders(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setServices(servicesData || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterServices = () => {
    let filtered = services

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredServices(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not specified'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const handleServiceAction = async (serviceId: string, action: string) => {
    try {
      const supabase = createClient()
      
      switch (action) {
        case 'delete':
          if (confirm('Are you sure you want to delete this service? This will affect all associated orders.')) {
            await supabase
              .from('services')
              .delete()
              .eq('id', serviceId)
            fetchServices() // Refresh the list
          }
          break
        case 'view':
          // Navigate to service details (you can implement this later)
          alert('Service details view coming soon!')
          break
      }
    } catch (error) {
      console.error('Error performing service action:', error)
    }
  }

  const getStats = () => {
    const total = services.length
    const active = services.filter(s => (s._count?.work_orders || 0) > 0).length
    const inactive = services.filter(s => (s._count?.work_orders || 0) === 0).length
    const totalRevenue = services.reduce((sum, service) => {
      const orderCount = service._count?.work_orders || 0
      return sum + (service.price * orderCount)
    }, 0)
    const avgPrice = services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0

    return { total, active, inactive, totalRevenue, avgPrice }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Services Management</h1>
          <p className="text-muted-foreground">Manage all services in the system</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services Management</h1>
          <p className="text-muted-foreground">Manage all services in the system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
          <Badge variant="outline">
            <Wrench className="h-3 w-3 mr-1" />
            {services.length} Total Services
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All services in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              With orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgPrice)}</div>
            <p className="text-xs text-muted-foreground">
              Per service
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From all services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search services by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(service.price)}
                    </div>
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleServiceAction(service.id, 'view')}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Service
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleServiceAction(service.id, 'delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Service
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {service.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {formatDuration(service.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {service._count?.work_orders || 0} orders
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Created {formatDate(service.created_at)}
                  </span>
                </div>
                <Badge variant={service._count?.work_orders ? "default" : "secondary"}>
                  {service._count?.work_orders ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {service.user && (
                <div className="text-xs text-gray-500 pt-1 border-t">
                  Owner: {service.user.name || service.user.email}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'No services have been added yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 