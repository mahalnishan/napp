import { useState, useCallback } from 'react'
import { getCachedData, setCachedData, CACHE_KEYS } from './cache'

interface OptimisticUpdate<T> {
  id: string
  data: T
  timestamp: number
  type: 'create' | 'update' | 'delete'
}

export function useOptimisticUpdates<T>() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map())
  const [isReconciling, setIsReconciling] = useState(false)

  const applyOptimisticUpdate = useCallback((
    id: string, 
    data: T, 
    type: 'create' | 'update' | 'delete'
  ) => {
    const update: OptimisticUpdate<T> = {
      id,
      data,
      timestamp: Date.now(),
      type
    }
    
    setOptimisticUpdates(prev => new Map(prev).set(id, update))
  }, [])

  const removeOptimisticUpdate = useCallback((id: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }, [])

  const reconcileWithServer = useCallback(async (
    serverData: T[],
    storeName: string
  ) => {
    setIsReconciling(true)
    
    try {
      // Apply server data to cache
      for (const item of serverData) {
        const itemWithId = item as T & { id: string }
        await setCachedData(storeName, itemWithId.id, item)
      }

      // Clear optimistic updates
      setOptimisticUpdates(new Map())
    } catch (error) {
      console.error('Reconciliation failed:', error)
    } finally {
      setIsReconciling(false)
    }
  }, [])

  const getOptimisticData = useCallback((
    cachedData: T[],
    storeName: string
  ): T[] => {
    if (optimisticUpdates.size === 0) return cachedData

    const dataMap = new Map<string, T>()
    
    // Start with cached data
    cachedData.forEach(item => {
      const itemWithId = item as T & { id: string }
      dataMap.set(itemWithId.id, item)
    })

    // Apply optimistic updates
    optimisticUpdates.forEach((update, id) => {
      switch (update.type) {
        case 'create':
        case 'update':
          dataMap.set(id, update.data)
          break
        case 'delete':
          dataMap.delete(id)
          break
      }
    })

    return Array.from(dataMap.values())
  }, [optimisticUpdates])

  return {
    optimisticUpdates,
    isReconciling,
    applyOptimisticUpdate,
    removeOptimisticUpdate,
    reconcileWithServer,
    getOptimisticData
  }
}

// Specific hooks for different data types
export function useOptimisticOrders() {
  return useOptimisticUpdates<any>()
}

export function useOptimisticClients() {
  return useOptimisticUpdates<any>()
}

export function useOptimisticServices() {
  return useOptimisticUpdates<any>()
}

export function useOptimisticWorkers() {
  return useOptimisticUpdates<any>()
} 