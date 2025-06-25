interface CacheItem<T> {
  data: T
  timestamp: number
  version: string
}

interface CacheConfig {
  name: string
  version: string
  stores: string[]
}

class IndexedDBCache {
  private dbName = 'napp-cache'
  private version = '1.0'
  private db: IDBDatabase | null = null
  private config: CacheConfig = {
    name: this.dbName,
    version: this.version,
    stores: ['orders', 'clients', 'services', 'workers', 'sync-status']
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, parseInt(this.version))
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object stores
        this.config.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' })
            store.createIndex('timestamp', 'timestamp', { unique: false })
            store.createIndex('version', 'version', { unique: false })
          }
        })
      }
    })
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized')
    const transaction = this.db.transaction(storeName, mode)
    return transaction.objectStore(storeName)
  }

  async set<T>(storeName: string, id: string, data: T, version?: string): Promise<void> {
    const store = this.getStore(storeName, 'readwrite')
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      version: version || this.version
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put({ id, ...item })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    const store = this.getStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = this.getStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const results = request.result
        resolve(results.map(item => item.data))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: string, id: string): Promise<void> {
    const store = this.getStore(storeName, 'readwrite')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: string): Promise<void> {
    const store = this.getStore(storeName, 'readwrite')
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getLastSync(storeName: string): Promise<number | null> {
    const store = this.getStore('sync-status')
    
    return new Promise((resolve, reject) => {
      const request = store.get(storeName)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.timestamp : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async setLastSync(storeName: string): Promise<void> {
    const store = this.getStore('sync-status', 'readwrite')
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        id: storeName,
        timestamp: Date.now(),
        version: this.version
      })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async isStale(storeName: string, maxAge: number = 5 * 60 * 1000): Promise<boolean> {
    const lastSync = await this.getLastSync(storeName)
    if (!lastSync) return true
    
    return Date.now() - lastSync > maxAge
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Singleton instance
let cacheInstance: IndexedDBCache | null = null

export async function getCache(): Promise<IndexedDBCache> {
  if (!cacheInstance) {
    cacheInstance = new IndexedDBCache()
    await cacheInstance.init()
  }
  return cacheInstance
}

// Cache keys
export const CACHE_KEYS = {
  ORDERS: 'orders',
  CLIENTS: 'clients',
  SERVICES: 'services',
  WORKERS: 'workers'
} as const

// Cache utilities
export async function getCachedData<T>(storeName: string, id?: string): Promise<T | T[] | null> {
  try {
    const cache = await getCache()
    if (id) {
      return await cache.get<T>(storeName, id)
    } else {
      return await cache.getAll<T>(storeName)
    }
  } catch (error) {
    console.warn('Cache read failed:', error)
    return null
  }
}

export async function setCachedData<T>(storeName: string, id: string, data: T): Promise<void> {
  try {
    const cache = await getCache()
    await cache.set(storeName, id, data)
  } catch (error) {
    console.warn('Cache write failed:', error)
  }
}

export async function clearCache(storeName?: string): Promise<void> {
  try {
    const cache = await getCache()
    if (storeName) {
      await cache.clear(storeName)
    } else {
      await cache.clear(CACHE_KEYS.ORDERS)
      await cache.clear(CACHE_KEYS.CLIENTS)
      await cache.clear(CACHE_KEYS.SERVICES)
      await cache.clear(CACHE_KEYS.WORKERS)
    }
  } catch (error) {
    console.warn('Cache clear failed:', error)
  }
}

export async function shouldSync(storeName: string, maxAge: number = 5 * 60 * 1000): Promise<boolean> {
  try {
    const cache = await getCache()
    return await cache.isStale(storeName, maxAge)
  } catch (error) {
    console.warn('Cache sync check failed:', error)
    return true // Default to sync if cache check fails
  }
}

export async function markSynced(storeName: string): Promise<void> {
  try {
    const cache = await getCache()
    await cache.setLastSync(storeName)
  } catch (error) {
    console.warn('Cache sync mark failed:', error)
  }
} 