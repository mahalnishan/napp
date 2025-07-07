import { NextResponse } from 'next/server'
import { checkDatabaseHealth, logDatabaseError } from '@/lib/supabase/database-utils'

export async function GET() {
  const startTime = Date.now()
  const health = {
    status: 'healthy' as string,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: null as any,
      memory: null as any,
      disk: null as any,
    },
    responseTime: 0,
  }

  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth(true, {
      timeout: 5000, // 5 second timeout for health check
      maxRetries: 2,
      retryDelay: 500,
    })

    health.services.database = {
      connected: dbHealth.connected,
      responseTime: dbHealth.responseTime,
      error: dbHealth.error,
      timestamp: dbHealth.timestamp,
    }

    // Check memory usage
    const memUsage = process.memoryUsage()
    health.services.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    }

    // Check disk space (mock for now - in production you'd use a real disk check)
    health.services.disk = {
      available: 'unknown', // Would be actual disk space in production
      total: 'unknown',
      used: 'unknown',
    }

    // Determine overall health status
    if (!dbHealth.connected) {
      health.status = 'degraded'
      logDatabaseError(new Error(dbHealth.error || 'Database connection failed'), 'health-check')
    }

    // Check if any service is critical
    const criticalServices = Object.values(health.services).filter(
      service => service && typeof service === 'object' && 'connected' in service && !service.connected
    )

    if (criticalServices.length > 0) {
      health.status = 'unhealthy'
    }

  } catch (error) {
    health.status = 'unhealthy'
    health.services.database = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
    
    logDatabaseError(error instanceof Error ? error : new Error('Health check failed'), 'health-check')
  }

  health.responseTime = Date.now() - startTime

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
} 