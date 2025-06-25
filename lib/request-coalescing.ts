interface PendingRequest<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
  timestamp: number
}

class RequestCoalescer {
  private pendingRequests = new Map<string, PendingRequest<any>>()
  private batchTimeouts = new Map<string, NodeJS.Timeout>()

  async coalesce<T>(
    key: string,
    requestFn: () => Promise<T>,
    batchDelay: number = 100
  ): Promise<T> {
    // Check if there's already a pending request for this key
    const existing = this.pendingRequests.get(key)
    if (existing) {
      // Return the existing promise if it's recent enough
      if (Date.now() - existing.timestamp < batchDelay) {
        return existing.promise
      }
    }

    // Create new promise
    let resolve: (value: T) => void
    let reject: (error: any) => void
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })

    const pendingRequest: PendingRequest<T> = {
      promise,
      resolve: resolve!,
      reject: reject!,
      timestamp: Date.now()
    }

    this.pendingRequests.set(key, pendingRequest)

    // Clear existing timeout
    const existingTimeout = this.batchTimeouts.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        const result = await requestFn()
        pendingRequest.resolve(result)
      } catch (error) {
        pendingRequest.reject(error)
      } finally {
        this.pendingRequests.delete(key)
        this.batchTimeouts.delete(key)
      }
    }, batchDelay)

    this.batchTimeouts.set(key, timeout)

    return promise
  }

  clear(key?: string) {
    if (key) {
      const timeout = this.batchTimeouts.get(key)
      if (timeout) {
        clearTimeout(timeout)
        this.batchTimeouts.delete(key)
      }
      this.pendingRequests.delete(key)
    } else {
      // Clear all
      this.batchTimeouts.forEach(timeout => clearTimeout(timeout))
      this.batchTimeouts.clear()
      this.pendingRequests.clear()
    }
  }
}

// Singleton instance
const requestCoalescer = new RequestCoalescer()

// Utility functions for common request patterns
export async function coalesceRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  batchDelay: number = 100
): Promise<T> {
  return requestCoalescer.coalesce(key, requestFn, batchDelay)
}

// Specific coalescing functions for different data types
export function createCoalescedDataFetcher<T>(
  fetchFn: () => Promise<T[]>,
  cacheKey: string,
  batchDelay: number = 100
) {
  return () => coalesceRequest(
    `fetch-${cacheKey}`,
    fetchFn,
    batchDelay
  )
}

// Clear all pending requests
export function clearPendingRequests(key?: string) {
  requestCoalescer.clear(key)
} 