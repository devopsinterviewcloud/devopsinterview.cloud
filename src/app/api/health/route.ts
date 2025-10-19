import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    memory: {
      status: 'ok' | 'warning' | 'critical'
      usage: number
      limit: number
      percentage: number
    }
  }
  version?: string
  environment?: string
}

export async function GET() {
  const startTime = Date.now()
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'

  // Check database connectivity
  let dbStatus: 'up' | 'down' = 'down'
  let dbResponseTime: number | undefined
  let dbError: string | undefined

  try {
    const dbStart = Date.now()
    // Simple database query to check connectivity
    await db.$queryRaw`SELECT 1`
    dbResponseTime = Date.now() - dbStart
    dbStatus = 'up'
  } catch (error) {
    dbStatus = 'down'
    dbError = error instanceof Error ? error.message : 'Unknown database error'
    overallStatus = 'unhealthy'
  }

  // Check memory usage
  const memUsage = process.memoryUsage()
  const totalMemory = memUsage.heapTotal
  const usedMemory = memUsage.heapUsed
  const memoryPercentage = (usedMemory / totalMemory) * 100

  let memoryStatus: 'ok' | 'warning' | 'critical' = 'ok'
  if (memoryPercentage > 90) {
    memoryStatus = 'critical'
    overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded'
  } else if (memoryPercentage > 75) {
    memoryStatus = 'warning'
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded'
    }
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
        error: dbError,
      },
      memory: {
        status: memoryStatus,
        usage: usedMemory,
        limit: totalMemory,
        percentage: Math.round(memoryPercentage * 100) / 100,
      },
    },
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV,
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  })
}
