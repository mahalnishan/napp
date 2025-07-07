import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
}

export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode: number
}

// Standard API error codes
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

// API Error classes
export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(API_ERROR_CODES.VALIDATION_ERROR, message, 400, details)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(API_ERROR_CODES.UNAUTHORIZED, message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(API_ERROR_CODES.FORBIDDEN, message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(API_ERROR_CODES.NOT_FOUND, message, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(API_ERROR_CODES.CONFLICT, message, 409)
    this.name = 'ConflictError'
  }
}

// Response helpers
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  meta?: ApiResponse<T>['meta']
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta,
  })
}

export const createErrorResponse = (
  error: ApiError | Error,
  statusCode?: number
): NextResponse<ApiResponse> => {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: error.message || 'Internal server error',
      code: API_ERROR_CODES.SERVER_ERROR,
    },
    { status: statusCode || 500 }
  )
}

// Request validation helper
export const validateRequest = async <T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> => {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError('Invalid request data', error.message)
    }
    throw new ValidationError('Invalid request data')
  }
}

// Query parameter helpers
export const getQueryParams = (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  return Object.fromEntries(searchParams.entries())
}

export const getPaginationParams = (request: NextRequest) => {
  const params = getQueryParams(request)
  const page = parseInt(params.page) || 1
  const limit = Math.min(parseInt(params.limit) || 10, 100) // Max 100 items per page
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

export const getSortParams = (request: NextRequest, allowedFields: string[] = []) => {
  const params = getQueryParams(request)
  const sortBy = params.sortBy
  const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc'

  if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    throw new ValidationError(`Invalid sort field: ${sortBy}`)
  }

  return { sortBy, sortOrder }
}

// Request wrapper with error handling
export const withErrorHandling = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) => {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof ApiError) {
        return createErrorResponse(error)
      }

      return createErrorResponse(
        new ApiError(
          API_ERROR_CODES.SERVER_ERROR,
          'Internal server error',
          500
        )
      )
    }
  }
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean => {
  const now = Date.now()
  const current = rateLimitMap.get(identifier)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

// Cache utilities
export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[]
}

const cache = new Map<string, { data: any; expiry: number; tags: string[] }>()

export const getCached = <T>(key: string): T | null => {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() > cached.expiry) {
    cache.delete(key)
    return null
  }

  return cached.data
}

export const setCache = <T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): void => {
  const ttl = options.ttl || 300 // Default 5 minutes
  const expiry = Date.now() + ttl * 1000
  const tags = options.tags || []

  cache.set(key, { data, expiry, tags })
}

export const invalidateCache = (pattern?: string | RegExp): void => {
  if (!pattern) {
    cache.clear()
    return
  }

  const keys = Array.from(cache.keys())
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern)

  keys.forEach(key => {
    if (regex.test(key)) {
      cache.delete(key)
    }
  })
}

export const invalidateCacheByTag = (tag: string): void => {
  const entries = Array.from(cache.entries())
  entries.forEach(([key, value]) => {
    if (value.tags.includes(tag)) {
      cache.delete(key)
    }
  })
}

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>()

export const dedupRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}

// HTTP client with retries and error handling
export interface HttpClientOptions {
  baseUrl?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  headers?: Record<string, string>
}

export class HttpClient {
  private baseUrl: string
  private timeout: number
  private retries: number
  private retryDelay: number
  private headers: Record<string, string>

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseUrl || ''
    this.timeout = options.timeout || 30000
    this.retries = options.retries || 3
    this.retryDelay = options.retryDelay || 1000
    this.headers = options.headers || {}
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new ApiError(
          error.code || 'HTTP_ERROR',
          error.message || `HTTP ${response.status}`,
          response.status,
          error
        )
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (attempt < this.retries && !(error instanceof ApiError)) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        return this.makeRequest(url, options, attempt + 1)
      }

      throw error
    }
  }

  async get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.makeRequest(url, { ...options, method: 'GET' })
  }

  async post<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.makeRequest(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.makeRequest(url, { ...options, method: 'DELETE' })
  }
}

// Default HTTP client instance
export const httpClient = new HttpClient()

// Utility functions for common API patterns
export const createCrudHandlers = <T>(
  resource: string,
  schema: ZodSchema<T>,
  options: {
    beforeCreate?: (data: T) => Promise<T>
    afterCreate?: (data: T) => Promise<void>
    beforeUpdate?: (id: string, data: Partial<T>) => Promise<Partial<T>>
    afterUpdate?: (id: string, data: T) => Promise<void>
    beforeDelete?: (id: string) => Promise<void>
    afterDelete?: (id: string) => Promise<void>
  } = {}
) => {
  return {
    create: withErrorHandling(async (request: NextRequest) => {
      const data = await validateRequest(request, schema)
      const processedData = options.beforeCreate ? await options.beforeCreate(data) : data
      
      // Implementation would depend on your data layer
      // const result = await db.create(resource, processedData)
      
      if (options.afterCreate) {
        await options.afterCreate(processedData)
      }
      
      return createSuccessResponse(processedData, `${resource} created successfully`)
    }),

    read: withErrorHandling(async (request: NextRequest) => {
      const params = getPaginationParams(request)
      const sort = getSortParams(request)
      
      // Implementation would depend on your data layer
      // const result = await db.findMany(resource, { ...params, ...sort })
      
      return createSuccessResponse([], `${resource} retrieved successfully`)
    }),

    update: withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
      const data = await validateRequest(request, (schema as any).partial()) as Partial<T>
      const processedData = options.beforeUpdate ? await options.beforeUpdate(params.id, data) : data
      
      // Implementation would depend on your data layer
      // const result = await db.update(resource, params.id, processedData)
      
      if (options.afterUpdate) {
        await options.afterUpdate(params.id, processedData as T)
      }
      
      return createSuccessResponse(processedData, `${resource} updated successfully`)
    }),

    delete: withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
      if (options.beforeDelete) {
        await options.beforeDelete(params.id)
      }
      
      // Implementation would depend on your data layer
      // await db.delete(resource, params.id)
      
      if (options.afterDelete) {
        await options.afterDelete(params.id)
      }
      
      return createSuccessResponse(null, `${resource} deleted successfully`)
    }),
  }
} 