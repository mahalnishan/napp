import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  getCachedData, 
  setCachedData, 
  shouldSync, 
  markSynced, 
  CACHE_KEYS 
} from '../cache'
import { 
  useOptimisticOrders, 
  useOptimisticClients, 
  useOptimisticServices, 
  useOptimisticWorkers 
} from '../optimistic-updates'
import { coalesceRequest } from '../request-coalescing'

interface UseCachedDataOptions {
  maxAge?: number
  enableOptimisticUpdates?: boolean
  enableCoalescing?: boolean
}

export function useCachedOrders(options: UseCachedDataOptions = {}) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const optimistic = useOptimisticOrders()
  const { maxAge = 5 * 60 * 1000, enableOptimisticUpdates = true, enableCoalescing = true } = options

  const fetchOrders = useCallback(async (forceRefresh = false) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fetchFromServer = async () => {
        const { data, error } = await supabase
          .from('work_orders')
          .select(`
            *,
            client:clients(*),
            worker:workers(*),
            services:work_order_services(
              *,
              service:services(*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
      }

      // Check if we should sync with server
      const needsSync = forceRefresh || await shouldSync(CACHE_KEYS.ORDERS, maxAge)

      if (needsSync) {
        setRefreshing(true)
        const serverData = enableCoalescing 
          ? await coalesceRequest('fetch-orders', fetchFromServer)
          : await fetchFromServer()

        // Cache the data
        for (const order of serverData) {
          await setCachedData(CACHE_KEYS.ORDERS, order.id, order)
        }
        await markSynced(CACHE_KEYS.ORDERS)

        // Reconcile with optimistic updates
        if (enableOptimisticUpdates) {
          await optimistic.reconcileWithServer(serverData, CACHE_KEYS.ORDERS)
        }

        setOrders(serverData)
        setError(null)
      } else {
        // Load from cache
        const cachedData = await getCachedData<any[]>(CACHE_KEYS.ORDERS)
        if (cachedData && cachedData.length > 0) {
          const optimisticData = enableOptimisticUpdates 
            ? optimistic.getOptimisticData(cachedData, CACHE_KEYS.ORDERS)
            : cachedData
          setOrders(optimisticData)
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      
      // Fallback to cache on error
      const cachedData = await getCachedData<any[]>(CACHE_KEYS.ORDERS)
      if (cachedData && cachedData.length > 0) {
        setOrders(cachedData)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [maxAge, enableOptimisticUpdates, enableCoalescing, optimistic])

  const createOrder = useCallback(async (orderData: any) => {
    if (enableOptimisticUpdates) {
      const tempId = `temp-${Date.now()}`
      optimistic.applyOptimisticUpdate(tempId, orderData, 'create')
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) throw new Error('Failed to create order')

      const { order } = await response.json()
      
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(`temp-${Date.now()}`)
        optimistic.applyOptimisticUpdate(order.id, order, 'update')
      }

      await setCachedData(CACHE_KEYS.ORDERS, order.id, order)
      await fetchOrders(true) // Refresh to get updated list
      
      return order
    } catch (error) {
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(`temp-${Date.now()}`)
      }
      throw error
    }
  }, [enableOptimisticUpdates, optimistic, fetchOrders])

  const updateOrder = useCallback(async (id: string, updates: any) => {
    if (enableOptimisticUpdates) {
      const currentOrder = orders.find(o => o.id === id)
      if (currentOrder) {
        const updatedOrder = { ...currentOrder, ...updates }
        optimistic.applyOptimisticUpdate(id, updatedOrder, 'update')
      }
    }

    try {
      const supabase = createClient()
      const { data: order, error } = await supabase
        .from('work_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
        optimistic.applyOptimisticUpdate(id, order, 'update')
      }

      await setCachedData(CACHE_KEYS.ORDERS, id, order)
      await fetchOrders(true)
      
      return order
    } catch (error) {
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
      }
      throw error
    }
  }, [orders, enableOptimisticUpdates, optimistic, fetchOrders])

  const deleteOrder = useCallback(async (id: string) => {
    if (enableOptimisticUpdates) {
      const currentOrder = orders.find(o => o.id === id)
      if (currentOrder) {
        optimistic.applyOptimisticUpdate(id, currentOrder, 'delete')
      }
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
      }

      await fetchOrders(true)
    } catch (error) {
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
      }
      throw error
    }
  }, [orders, enableOptimisticUpdates, optimistic, fetchOrders])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    refreshing,
    refetch: () => fetchOrders(true),
    createOrder,
    updateOrder,
    deleteOrder,
    optimisticUpdates: optimistic.optimisticUpdates,
    isReconciling: optimistic.isReconciling
  }
}

export function useCachedClients(options: UseCachedDataOptions = {}) {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const optimistic = useOptimisticClients()
  const { maxAge = 5 * 60 * 1000, enableOptimisticUpdates = true, enableCoalescing = true } = options

  const fetchClients = useCallback(async (forceRefresh = false) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fetchFromServer = async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        if (error) throw error
        return data || []
      }

      const needsSync = forceRefresh || await shouldSync(CACHE_KEYS.CLIENTS, maxAge)

      if (needsSync) {
        setRefreshing(true)
        const serverData = enableCoalescing 
          ? await coalesceRequest('fetch-clients', fetchFromServer)
          : await fetchFromServer()

        for (const client of serverData) {
          await setCachedData(CACHE_KEYS.CLIENTS, client.id, client)
        }
        await markSynced(CACHE_KEYS.CLIENTS)

        if (enableOptimisticUpdates) {
          await optimistic.reconcileWithServer(serverData, CACHE_KEYS.CLIENTS)
        }

        setClients(serverData)
        setError(null)
      } else {
        const cachedData = await getCachedData<any[]>(CACHE_KEYS.CLIENTS)
        if (cachedData && cachedData.length > 0) {
          const optimisticData = enableOptimisticUpdates 
            ? optimistic.getOptimisticData(cachedData, CACHE_KEYS.CLIENTS)
            : cachedData
          setClients(optimisticData)
        }
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch clients')
      
      const cachedData = await getCachedData<any[]>(CACHE_KEYS.CLIENTS)
      if (cachedData && cachedData.length > 0) {
        setClients(cachedData)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [maxAge, enableOptimisticUpdates, enableCoalescing, optimistic])

  const createClient = useCallback(async (clientData: any) => {
    if (enableOptimisticUpdates) {
      const tempId = `temp-${Date.now()}`
      optimistic.applyOptimisticUpdate(tempId, clientData, 'create')
    }

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      })

      if (!response.ok) throw new Error('Failed to create client')

      const { client } = await response.json()
      
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(`temp-${Date.now()}`)
        optimistic.applyOptimisticUpdate(client.id, client, 'update')
      }

      await setCachedData(CACHE_KEYS.CLIENTS, client.id, client)
      await fetchClients(true)
      
      return client
    } catch (error) {
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(`temp-${Date.now()}`)
      }
      throw error
    }
  }, [enableOptimisticUpdates, optimistic, fetchClients])

  const updateClient = useCallback(async (id: string, updates: any) => {
    if (enableOptimisticUpdates) {
      const currentClient = clients.find(c => c.id === id)
      if (currentClient) {
        const updatedClient = { ...currentClient, ...updates }
        optimistic.applyOptimisticUpdate(id, updatedClient, 'update')
      }
    }

    try {
      const supabase = createClient()
      const { data: client, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
        optimistic.applyOptimisticUpdate(id, client, 'update')
      }

      await setCachedData(CACHE_KEYS.CLIENTS, id, client)
      await fetchClients(true)
      
      return client
    } catch (error) {
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
      }
      throw error
    }
  }, [clients, enableOptimisticUpdates, optimistic, fetchClients])

  const deleteClient = useCallback(async (id: string) => {
    if (enableOptimisticUpdates) {
      const currentClient = clients.find(c => c.id === id)
      if (currentClient) {
        optimistic.applyOptimisticUpdate(id, currentClient, 'delete')
      }
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
      }

      await fetchClients(true)
    } catch (error) {
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
      }
      throw error
    }
  }, [clients, enableOptimisticUpdates, optimistic, fetchClients])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading,
    error,
    refreshing,
    refetch: () => fetchClients(true),
    createClient,
    updateClient,
    deleteClient,
    optimisticUpdates: optimistic.optimisticUpdates,
    isReconciling: optimistic.isReconciling
  }
}

export function useCachedServices(options: UseCachedDataOptions = {}) {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const optimistic = useOptimisticServices()
  const { maxAge = 5 * 60 * 1000, enableOptimisticUpdates = true, enableCoalescing = true } = options

  const fetchServices = useCallback(async (forceRefresh = false) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fetchFromServer = async () => {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        if (error) throw error
        return data || []
      }

      const needsSync = forceRefresh || await shouldSync(CACHE_KEYS.SERVICES, maxAge)

      if (needsSync) {
        setRefreshing(true)
        const serverData = enableCoalescing 
          ? await coalesceRequest('fetch-services', fetchFromServer)
          : await fetchFromServer()

        for (const service of serverData) {
          await setCachedData(CACHE_KEYS.SERVICES, service.id, service)
        }
        await markSynced(CACHE_KEYS.SERVICES)

        if (enableOptimisticUpdates) {
          await optimistic.reconcileWithServer(serverData, CACHE_KEYS.SERVICES)
        }

        setServices(serverData)
        setError(null)
      } else {
        const cachedData = await getCachedData<any[]>(CACHE_KEYS.SERVICES)
        if (cachedData && cachedData.length > 0) {
          const optimisticData = enableOptimisticUpdates 
            ? optimistic.getOptimisticData(cachedData, CACHE_KEYS.SERVICES)
            : cachedData
          setServices(optimisticData)
        }
      }
    } catch (err) {
      console.error('Error fetching services:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch services')
      
      const cachedData = await getCachedData<any[]>(CACHE_KEYS.SERVICES)
      if (cachedData && cachedData.length > 0) {
        setServices(cachedData)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [maxAge, enableOptimisticUpdates, enableCoalescing, optimistic])

  const createService = useCallback(async (serviceData: any) => {
    if (enableOptimisticUpdates) {
      const tempId = `temp-${Date.now()}`
      optimistic.applyOptimisticUpdate(tempId, serviceData, 'create')
    }

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      })

      if (!response.ok) throw new Error('Failed to create service')

      const { service } = await response.json()
      
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(`temp-${Date.now()}`)
        optimistic.applyOptimisticUpdate(service.id, service, 'update')
      }

      await setCachedData(CACHE_KEYS.SERVICES, service.id, service)
      await fetchServices(true)
      
      return service
    } catch (error) {
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(`temp-${Date.now()}`)
      }
      throw error
    }
  }, [enableOptimisticUpdates, optimistic, fetchServices])

  const updateService = useCallback(async (id: string, updates: any) => {
    if (enableOptimisticUpdates) {
      const currentService = services.find(s => s.id === id)
      if (currentService) {
        const updatedService = { ...currentService, ...updates }
        optimistic.applyOptimisticUpdate(id, updatedService, 'update')
      }
    }

    try {
      const supabase = createClient()
      const { data: service, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
        optimistic.applyOptimisticUpdate(id, service, 'update')
      }

      await setCachedData(CACHE_KEYS.SERVICES, id, service)
      await fetchServices(true)
      
      return service
    } catch (error) {
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
      }
      throw error
    }
  }, [services, enableOptimisticUpdates, optimistic, fetchServices])

  const deleteService = useCallback(async (id: string) => {
    if (enableOptimisticUpdates) {
      const currentService = services.find(s => s.id === id)
      if (currentService) {
        optimistic.applyOptimisticUpdate(id, currentService, 'delete')
      }
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
      }

      await fetchServices(true)
    } catch (error) {
      if (enableOptimisticUpdates) {
        optimistic.removeOptimisticUpdate(id)
      }
      throw error
    }
  }, [services, enableOptimisticUpdates, optimistic, fetchServices])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return {
    services,
    loading,
    error,
    refreshing,
    refetch: () => fetchServices(true),
    createService,
    updateService,
    deleteService,
    optimisticUpdates: optimistic.optimisticUpdates,
    isReconciling: optimistic.isReconciling
  }
} 