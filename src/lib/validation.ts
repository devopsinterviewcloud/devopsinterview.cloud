import { z } from 'zod'
import { NextRequest } from 'next/server'

// =============================================================================
// COMMON VALIDATION PATTERNS
// =============================================================================

// UUID validation with specific error messages
const uuidSchema = z.string().uuid('Invalid ID format. Must be a valid UUID.')

// URL validation for redirects (security: prevent open redirects)
const urlSchema = z.string().url('Invalid URL format.')
  .refine((url) => {
    try {
      const parsed = new URL(url)
      // Only allow HTTPS URLs and same-origin for security
      return parsed.protocol === 'https:' || parsed.hostname === 'localhost'
    } catch {
      return false
    }
  }, 'URL must use HTTPS protocol')

// Email validation
const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email address too long') // RFC 5321 limit
  .transform(email => email.toLowerCase().trim())

// Sanitized string (prevent XSS)
const sanitizedStringSchema = z.string()
  .max(1000, 'Text too long')
  .transform(str => str.trim())
  .refine(str => {
    // Basic XSS prevention - no script tags or javascript: URLs
    const dangerous = /<script|javascript:|on\w+\s*=/i
    return !dangerous.test(str)
  }, 'Invalid characters detected')

// =============================================================================
// API ENDPOINT SCHEMAS
// =============================================================================

// Checkout API validation
export const checkoutRequestSchema = z.object({
  ebookId: uuidSchema,
  successUrl: urlSchema.optional().or(z.literal('')),
  cancelUrl: urlSchema.optional().or(z.literal('')),
  customerEmail: emailSchema.optional(),
  metadata: z.record(z.string(), sanitizedStringSchema).optional().default({})
}).strict() // Reject unknown properties

// Stripe webhook validation
export const stripeWebhookSchema = z.object({
  id: z.string().min(1, 'Event ID required'),
  type: z.string().min(1, 'Event type required'),
  data: z.object({
    object: z.any() // Stripe objects are complex, validate in handler
  }),
  created: z.number().positive('Invalid timestamp'),
  livemode: z.boolean(),
  api_version: z.string().optional()
}).strict()

// Download request validation
export const downloadRequestSchema = z.object({
  ebookId: uuidSchema,
  orderId: uuidSchema,
  format: z.enum(['PDF', 'EPUB', 'MOBI'], {
    invalid_type_error: 'Format must be PDF, EPUB, or MOBI'
  })
}).strict()

// Contact form validation (if implemented)
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).transform(str => str.trim()),
  email: emailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100).transform(str => str.trim()),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000).transform(str => str.trim())
}).strict()

// Admin operations validation (future use)
export const adminEbookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).transform(str => str.trim()),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000).transform(str => str.trim()),
  price: z.number().positive('Price must be positive').max(999.99, 'Price too high'),
  originalPrice: z.number().positive().max(999.99).optional(),
  tags: z.array(z.string().max(50)).max(10, 'Too many tags'),
  format: z.array(z.enum(['PDF', 'EPUB', 'MOBI'])).min(1, 'At least one format required'),
  pageCount: z.number().int().positive().max(9999).optional(),
  fileSize: z.string().regex(/^\d+\.?\d*\s?(KB|MB|GB)$/i, 'Invalid file size format')
}).strict()

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Generic validation wrapper with detailed error handling
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Extract the first validation error for cleaner error messages
      const firstError = error.issues[0]
      const field = firstError.path.join('.')
      const message = firstError.message
      
      throw new ValidationError(
        `Validation failed for ${field}: ${message}`,
        field,
        firstError.code
      )
    }
    
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON format')
    }
    
    throw error
  }
}

// Query parameter validation
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): T {
  try {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams)
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      throw new ValidationError(
        `Invalid query parameter ${firstError.path.join('.')}: ${firstError.message}`,
        firstError.path.join('.'),
        firstError.code
      )
    }
    throw error
  }
}

// Headers validation (for webhook signatures, etc.)
export function validateHeaders<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): T {
  try {
    const headers = Object.fromEntries(request.headers.entries())
    return schema.parse(headers)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      throw new ValidationError(
        `Invalid header ${firstError.path.join('.')}: ${firstError.message}`,
        firstError.path.join('.'),
        firstError.code
      )
    }
    throw error
  }
}

// Security-focused request validation
export async function secureValidateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  options: {
    maxBodySize?: number // bytes
    requireContentType?: string
    checkOrigin?: boolean
  } = {}
): Promise<T> {
  const {
    maxBodySize = 1024 * 1024, // 1MB default
    requireContentType = 'application/json',
    checkOrigin = true
  } = options

  // Check content type
  const contentType = request.headers.get('content-type')
  if (requireContentType && contentType !== requireContentType) {
    throw new ValidationError(`Content-Type must be ${requireContentType}`)
  }

  // Check origin for CSRF protection (if not same-origin)
  if (checkOrigin) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    const referer = request.headers.get('referer')
    
    if (origin && host && !origin.includes(host)) {
      // Allow requests from same origin or if no origin header (direct API calls)
      if (!referer || !referer.includes(host)) {
        throw new ValidationError('Invalid origin', 'origin', 'CSRF_PROTECTION')
      }
    }
  }

  // Check body size (rough estimate)
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > maxBodySize) {
    throw new ValidationError(`Request body too large. Maximum ${maxBodySize} bytes allowed.`)
  }

  return validateRequest(request, schema)
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

export function createValidationErrorResponse(error: ValidationError) {
  const statusCode = error.code === 'CSRF_PROTECTION' ? 403 : 400
  
  return new Response(
    JSON.stringify({
      error: 'Validation Error',
      message: error.message,
      field: error.field,
      code: error.code,
      timestamp: new Date().toISOString()
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Validation-Error': 'true'
      }
    }
  )
}

// Success response helper
export function createSuccessResponse<T>(data: T, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}