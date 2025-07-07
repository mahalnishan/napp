import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface QueryOptions {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  retry?: number
}

interface QueryResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; staleTime: number }>()

export function useOptimizedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const { enabled = true, staleTime = 5 * 60 * 1000, cacheTime = 10 * 60 * 1000, retry = 3 } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const executeQuery = useCallback(async () => {
    if (!enabled) return

    // Check cache first
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      setData(cached.data)
      return
    }

    setLoading(true)
    setError(null)

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    let retryCount = 0
    while (retryCount < retry) {
      try {
        const result = await queryFn()
        
        // Cache the result
        cache.set(key, {
          data: result,
          timestamp: Date.now(),
          staleTime
        })

        setData(result)
        break
      } catch (err) {
        retryCount++
        if (retryCount === retry || err instanceof Error && err.name === 'AbortError') {
          setError(err instanceof Error ? err : new Error('Unknown error'))
          break
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }

    setLoading(false)
  }, [key, queryFn, enabled, staleTime, retry])

  const refetch = useCallback(async () => {
    // Clear cache for this key
    cache.delete(key)
    await executeQuery()
  }, [key, executeQuery])

  useEffect(() => {
    executeQuery()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [executeQuery])

  // Clean up old cache entries
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      for (const [cacheKey, cacheEntry] of cache.entries()) {
        if (now - cacheEntry.timestamp > cacheTime) {
          cache.delete(cacheKey)
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [cacheTime])

  return { data, loading, error, refetch }
}

// Optimized Supabase query hook
export function useSupabaseQuery<T>(
  key: string,
  queryBuilder: (supabase: any) => any,
  options: QueryOptions = {}
): QueryResult<T> {
  const queryFn = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await queryBuilder(supabase)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data
  }, [queryBuilder])

  return useOptimizedQuery(key, queryFn, options)
} 