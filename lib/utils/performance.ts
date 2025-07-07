import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Debounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle hook
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T => {
  const inThrottle = useRef<boolean>(false)

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args)
        inThrottle.current = true
        setTimeout(() => {
          inThrottle.current = false
        }, limit)
      }
    },
    [callback, limit]
  ) as T

  return throttledCallback
}

// Memoization utilities
export class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return undefined
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Memoization hook with LRU cache
export const useMemoizedFunction = <T extends (...args: any[]) => any>(
  fn: T,
  maxCacheSize: number = 100
): T => {
  const cache = useRef(new LRUCache<string, ReturnType<T>>(maxCacheSize))

  return useCallback(
    (...args: Parameters<T>): ReturnType<T> => {
      const key = JSON.stringify(args)
      const cached = cache.current.get(key)
      
      if (cached !== undefined) {
        return cached
      }

      const result = fn(...args)
      cache.current.set(key, result)
      return result
    },
    [fn, maxCacheSize]
  ) as T
}

// Lazy loading hook
export const useLazyLoad = <T>(
  loadFn: () => Promise<T>,
  dependencies: any[] = []
): {
  data: T | null
  loading: boolean
  error: Error | null
  load: () => Promise<void>
} => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await loadFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [loadFn, loading])

  useEffect(() => {
    if (dependencies.length > 0) {
      load()
    }
  }, dependencies)

  return { data, loading, error, load }
}

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        ...options,
      }
    )

    if (targetRef.current) {
      observer.observe(targetRef.current)
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current)
      }
    }
  }, [options])

  return [targetRef, isIntersecting]
}

// Virtual scrolling hook
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length
    )

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan),
    }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange,
  }
}

// Performance monitoring
export const usePerformanceMonitor = (name: string) => {
  const startTime = useRef<number>(0)

  const start = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const end = useCallback(() => {
    const duration = performance.now() - startTime.current
    console.log(`${name}: ${duration.toFixed(2)}ms`)
    return duration
  }, [name])

  const measure = useCallback((fn: () => void) => {
    start()
    fn()
    return end()
  }, [start, end])

  return { start, end, measure }
}

// Image lazy loading hook
export const useImageLazyLoad = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [ref, isIntersecting] = useIntersectionObserver()

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
      }
      img.onerror = () => {
        setIsError(true)
      }
      img.src = src
    }
  }, [isIntersecting, src])

  return { ref, imageSrc, isLoaded, isError }
}

// Batch updates hook
export const useBatchUpdates = <T>(
  initialValue: T,
  batchSize: number = 100,
  delay: number = 16 // One frame at 60fps
) => {
  const [value, setValue] = useState(initialValue)
  const pendingUpdates = useRef<((prev: T) => T)[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const batchUpdate = useCallback((updater: (prev: T) => T) => {
    pendingUpdates.current.push(updater)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setValue(prev => {
        let newValue = prev
        const updates = pendingUpdates.current.splice(0, batchSize)
        updates.forEach(update => {
          newValue = update(newValue)
        })
        return newValue
      })

      if (pendingUpdates.current.length > 0) {
        // Schedule next batch
        timeoutRef.current = setTimeout(() => {
          batchUpdate(() => value)
        }, delay)
      }
    }, delay)
  }, [batchSize, delay, value])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [value, batchUpdate] as const
}

// Memory usage monitoring
export const useMemoryMonitor = (threshold: number = 50) => {
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null)
  const [isHighUsage, setIsHighUsage] = useState(false)

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / 1024 / 1024
        setMemoryUsage(usedMB)
        setIsHighUsage(usedMB > threshold)
      }
    }

    const interval = setInterval(checkMemory, 5000) // Check every 5 seconds
    checkMemory() // Initial check

    return () => clearInterval(interval)
  }, [threshold])

  return { memoryUsage, isHighUsage }
}

// Utility functions
export const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = (a, b) => a === b
) => {
  let lastResult: R
  let lastArgs: T

  return (state: T): R => {
    if (state !== lastArgs) {
      const result = selector(state)
      if (!equalityFn(result, lastResult)) {
        lastResult = result
      }
      lastArgs = state
    }
    return lastResult
  }
}

export const shallowEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (let key of keysA) {
    if (!keysB.includes(key) || a[key] !== b[key]) {
      return false
    }
  }

  return true
}

export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (let key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false
    }
  }

  return true
}

// Bundle size optimization - dynamic imports
export const dynamicImport = <T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): Promise<T> => {
  return importFn()
    .then(module => module.default)
    .catch(() => {
      if (fallback) return fallback
      throw new Error('Failed to load module')
    })
} 