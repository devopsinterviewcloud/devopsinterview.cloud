import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from './lib/rate-limiter'
import { logRateLimit, logSuspiciousActivity, logApiAccess } from './lib/security-logger'

// Security headers configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    // Next.js requires 'unsafe-eval' in development, use nonce in production
    process.env.NODE_ENV === 'production'
      ? "script-src 'self' 'nonce-{NONCE}' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com"
      : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://*.supabase.co https://api.resend.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
}

// API routes that require rate limiting
const rateLimitedPaths = [
  '/api/checkout',
  '/api/stripe-webhook',
]

// Paths that should be protected
const protectedApiPaths = [
  '/api/',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply rate limiting to API routes
  if (rateLimitedPaths.some(path => pathname.startsWith(path))) {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    try {
      await rateLimiter.check(request)
    } catch (error) {
      logRateLimit(clientIP, pathname)
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          ...Object.fromEntries(
            Object.entries(securityHeaders).map(([key, value]) => [key, value])
          )
        }
      })
    }
  }

  // Add request ID for tracking
  response.headers.set('X-Request-ID', crypto.randomUUID())

  // Log security events for protected paths
  if (protectedApiPaths.some(path => pathname.startsWith(path))) {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    logApiAccess(request.method, pathname, clientIP, userAgent)
    
    // Detect suspicious patterns
    if (userAgent.toLowerCase().includes('bot') && !pathname.includes('/robots.txt')) {
      logSuspiciousActivity(clientIP, pathname, 'Bot accessing API endpoint', 'medium')
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}