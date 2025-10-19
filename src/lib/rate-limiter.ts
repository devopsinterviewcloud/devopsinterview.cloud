import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
  skipSuccessfulRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private configs: Map<string, RateLimitConfig> = new Map()

  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  // Configure rate limit for specific endpoints
  configure(endpoint: string, config: RateLimitConfig) {
    this.configs.set(endpoint, config)
  }

  // Check if request should be rate limited
  async check(request: NextRequest, endpoint?: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    resetTime: number
    error?: string
  }> {
    const clientId = this.getClientId(request)
    const endpointKey = endpoint || this.getEndpointFromUrl(request.url)
    const key = `${clientId}:${endpointKey}`
    
    const config = this.configs.get(endpointKey) || this.getDefaultConfig(endpointKey)
    const now = Date.now()

    // Get or create rate limit entry
    let entry = this.store[key]
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      }
      this.store[key] = entry
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

  private getClientId(request: NextRequest): string {
    // Try to get client IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'
    
    // You could also use authentication info if available
    // const userId = request.headers.get('x-user-id')
    // return userId || ip
    
    return ip
  }

  private getEndpointFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname
      // Extract API endpoint pattern
      const match = pathname.match(/\/api\/([^\/]+)/)
      return match ? match[1] : 'default'
    } catch {
      return 'default'
    }
  }

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
      'default': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // 100 requests per 15 minutes
        message: 'Rate limit exceeded. Please try again later.'
      }
    }

    return configs[endpoint] || configs['default']
  }

  private cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key]
      }
    })
  }

  // Get current status for a client
  getStatus(request: NextRequest, endpoint?: string) {
    const clientId = this.getClientId(request)
    const endpointKey = endpoint || this.getEndpointFromUrl(request.url)
    const key = `${clientId}:${endpointKey}`
    
    const entry = this.store[key]
    const config = this.configs.get(endpointKey) || this.getDefaultConfig(endpointKey)
    
    if (!entry) {
      return {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      }
    }

    return {
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

// Helper function for API routes
export async function checkRateLimit(request: NextRequest, endpoint?: string) {
  const result = await rateLimiter.check(request, endpoint)
  
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