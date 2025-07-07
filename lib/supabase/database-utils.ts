import { createClient } from './client'
import { createClient as createServerClient } from './server'

export interface DatabaseHealth {
  connected: boolean
  responseTime: number
  error?: string
  timestamp: string
}

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000, // 10 seconds
}

/**
 * Check database connectivity with timeout and retry logic
 */
export async function checkDatabaseHealth(
  isServer: boolean = false,
  options: RetryOptions = {}
): Promise<DatabaseHealth> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  const startTime = Date.now()
  
  try {
    const client = isServer ? await createServerClient() : createClient()
    
    // Test with a simple query
    const { data, error } = await Promise.race([
      client.from('users').select('count').limit(1),
      new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), config.timeout)
      )
    ])

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        connected: false,
        responseTime,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }

    return {
      connected: true,
      responseTime,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      connected: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Execute a database operation with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), config.timeout)
        )
      ])
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry on certain types of errors
      if (isNonRetryableError(lastError)) {
        throw lastError
      }

      // If this is the last attempt, throw the error
      if (attempt === config.maxRetries) {
        throw lastError
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt))
    }
  }

  throw lastError || new Error('Database operation failed')
}

/**
 * Check if an error is non-retryable
 */
function isNonRetryableError(error: Error): boolean {
  const nonRetryableMessages = [
    'unauthorized',
    'permission denied',
    'not found',
    'invalid',
    'bad request',
    'forbidden'
  ]
  
  const message = error.message.toLowerCase()
  return nonRetryableMessages.some(msg => message.includes(msg))
}



/**
 * Log database connection issues for monitoring
 */
export function logDatabaseError(error: Error, context: string = '') {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
  }
  
  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: send to external logging service
    // await logToExternalService(errorInfo)
  }
} 