/**
 * Production-ready Rate Limiter with Redis support for Vercel
 *
 * Supports:
 * - In-memory rate limiting (development)
 * - Redis-based rate limiting (production via Upstash)
 * - Automatic fallback to in-memory if Redis unavailable
 * - Configurable per-endpoint limits
 *
 * Usage:
 * 1. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel
 * 2. Import and use checkRateLimit in API routes or middleware
 */

import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  error?: string
}

// Upstash Redis client (only in production)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// In-memory store (fallback for development)
interface InMemoryStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiterRedis {
  private inMemoryStore: InMemoryStore = {}
  private configs: Map<string, RateLimitConfig> = new Map()
  private useRedis: boolean = redis !== null

  constructor() {
    if (!this.useRedis) {
      console.warn('⚠️  Rate Limiter: Running in-memory mode (development only)')
      console.warn('⚠️  For production on Vercel, configure Upstash Redis:')
      console.warn('⚠️  UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')

      // Clean up in-memory store every 5 minutes
      setInterval(() => {
        this.cleanupInMemory()
      }, 5 * 60 * 1000)
    } else {
      console.log('✅ Rate Limiter: Using Redis (production mode)')
    }
  }

  /**
   * Configure custom rate limit for specific endpoint
   */
  configure(endpoint: string, config: RateLimitConfig) {
    this.configs.set(endpoint, config)
  }

  /**
   * Check if request should be rate limited
   */
  async check(request: NextRequest, endpoint?: string): Promise<RateLimitResult> {
    const clientId = this.getClientId(request)
    const endpointKey = endpoint || this.getEndpointFromUrl(request.url)
    const key = `ratelimit:${clientId}:${endpointKey}`

    const config = this.configs.get(endpointKey) || this.getDefaultConfig(endpointKey)
    const now = Date.now()
    const windowSeconds = Math.ceil(config.windowMs / 1000)

    try {
      if (this.useRedis && redis) {
        return await this.checkRedis(key, config, now, windowSeconds)
      } else {
        return this.checkInMemory(key, config, now)
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // Fail open - allow request if rate limiter fails
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs
      }
    }
  }

  /**
   * Redis-based rate limiting (production)
   */
  private async checkRedis(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    if (!redis) throw new Error('Redis not configured')

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()

    // Increment counter
    pipeline.incr(key)

    // Set expiry on first request
    pipeline.expire(key, windowSeconds)

    // Get current count and TTL
    pipeline.get(key)
    pipeline.ttl(key)

    const results = await pipeline.exec()

    const count = (results[2] as number) || 0
    const ttl = (results[3] as number) || windowSeconds
    const resetTime = now + (ttl * 1000)

    if (count > config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        error: config.message || 'Too many requests. Please try again later.'
      }
    }

    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
      resetTime
    }
  }

  /**
   * In-memory rate limiting (development fallback)
   */
  private checkInMemory(
    key: string,
    config: RateLimitConfig,
    now: number
  ): RateLimitResult {
    // Get or create rate limit entry
    let entry = this.inMemoryStore[key]
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      }
      this.inMemoryStore[key] = entry
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        error: config.message || 'Too many requests. Please try again later.'
      }
    }

    // Increment counter
    entry.count++

    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime
    }
  }

  /**
   * Extract client identifier from request
   */
  private getClientId(request: NextRequest): string {
    // Vercel provides x-forwarded-for header
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'

    // Optional: Use authenticated user ID if available
    // const userId = request.headers.get('x-user-id')
    // return userId || ip

    return ip
  }

  /**
   * Extract endpoint name from URL
   */
  private getEndpointFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname
      // Extract API endpoint pattern (e.g., /api/checkout -> checkout)
      const match = pathname.match(/\/api\/([^\/]+)/)
      return match ? match[1] : 'default'
    } catch {
      return 'default'
    }
  }

  /**
   * Default rate limit configurations per endpoint
   */
  private getDefaultConfig(endpoint: string): RateLimitConfig {
    const configs: Record<string, RateLimitConfig> = {
      'checkout': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 checkout attempts per 15 minutes
        message: 'Too many checkout attempts. Please wait before trying again.'
      },
      'stripe-webhook': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 webhooks per minute (generous for Stripe)
        message: 'Webhook rate limit exceeded.'
      },
      'download': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 downloads per minute
        message: 'Too many download attempts. Please wait before trying again.'
      },
      'newsletter': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3, // 3 signups per hour from same IP
        message: 'Too many newsletter signup attempts. Please try again later.'
      },
      'contact': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 5, // 5 contact form submissions per hour
        message: 'Too many contact form submissions. Please try again later.'
      },
      'default': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // 100 requests per 15 minutes
        message: 'Rate limit exceeded. Please try again later.'
      }
    }

    return configs[endpoint] || configs['default']
  }

  /**
   * Clean up expired in-memory entries
   */
  private cleanupInMemory() {
    const now = Date.now()
    Object.keys(this.inMemoryStore).forEach(key => {
      if (this.inMemoryStore[key].resetTime <= now) {
        delete this.inMemoryStore[key]
      }
    })
  }

  /**
   * Get current rate limit status for a client
   */
  async getStatus(request: NextRequest, endpoint?: string) {
    const clientId = this.getClientId(request)
    const endpointKey = endpoint || this.getEndpointFromUrl(request.url)
    const key = `ratelimit:${clientId}:${endpointKey}`
    const config = this.configs.get(endpointKey) || this.getDefaultConfig(endpointKey)
    const now = Date.now()

    try {
      if (this.useRedis && redis) {
        const count = await redis.get<number>(key) || 0
        const ttl = await redis.ttl(key) || Math.ceil(config.windowMs / 1000)

        return {
          limit: config.maxRequests,
          remaining: Math.max(0, config.maxRequests - count),
          resetTime: now + (ttl * 1000)
        }
      } else {
        const entry = this.inMemoryStore[key]

        if (!entry) {
          return {
            limit: config.maxRequests,
            remaining: config.maxRequests,
            resetTime: now + config.windowMs
          }
        }

        return {
          limit: config.maxRequests,
          remaining: Math.max(0, config.maxRequests - entry.count),
          resetTime: entry.resetTime
        }
      }
    } catch (error) {
      console.error('Error getting rate limit status:', error)
      return {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs
      }
    }
  }
}

// Singleton instance
export const rateLimiterRedis = new RateLimiterRedis()

/**
 * Helper function for API routes
 * Returns Response object if rate limited, null otherwise
 */
export async function checkRateLimitRedis(request: NextRequest, endpoint?: string) {
  const result = await rateLimiterRedis.check(request, endpoint)

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: result.error,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  return null // No rate limit hit
}

/**
 * Middleware helper - throws error if rate limited
 */
export async function enforceRateLimit(request: NextRequest, endpoint?: string) {
  const result = await rateLimiterRedis.check(request, endpoint)

  if (!result.success) {
    throw new Error(result.error || 'Rate limit exceeded')
  }

  return result
}
