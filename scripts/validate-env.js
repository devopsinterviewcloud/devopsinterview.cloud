#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set before starting the application
 */

// Load environment variables from .env.local
const path = require('path')
const fs = require('fs')

// Simple dotenv loader (avoiding dependency)
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const { z } = require('zod')

// Define the schema for environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url().startsWith('postgresql://'),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Payments — Razorpay (domestic INR)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Payments — PayPal (international USD)
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_ENV: z.enum(['sandbox', 'live']).default('sandbox'),

  // Email (Resend)
  RESEND_API_KEY: z.string().startsWith('re_'),
  EMAIL_FROM: z.string().min(1),
  EMAIL_REPLY_TO: z.string().email().optional(),

  // Supabase Storage (private bucket holding the book PDFs)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_EBOOKS_BUCKET: z.string().optional(),

  // Signed download links
  DOWNLOAD_TOKEN_SECRET: z.string().min(16).optional(),

  // Rate limiting (Upstash) — optional; falls back to in-memory otherwise
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
})

// Production-specific validations: live payments + delivery require the full set.
const productionEnvSchema = envSchema.extend({
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  PAYPAL_CLIENT_ID: z.string().min(1),
  PAYPAL_CLIENT_SECRET: z.string().min(1),
  PAYPAL_WEBHOOK_ID: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_EBOOKS_BUCKET: z.string().min(1),
  DOWNLOAD_TOKEN_SECRET: z.string().min(32),
})

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n')

  const isProduction = process.env.NODE_ENV === 'production'
  const schema = isProduction ? productionEnvSchema : envSchema

  try {
    const validatedEnv = schema.parse(process.env)

    // Check for common mistakes
    const warnings = []

    // Warn about test/sandbox config in production
    if (isProduction) {
      if ((validatedEnv.RAZORPAY_KEY_ID || '').startsWith('rzp_test_')) {
        warnings.push('⚠️  WARNING: Using Razorpay TEST key in production!')
      }
      if (validatedEnv.PAYPAL_ENV !== 'live') {
        warnings.push('⚠️  WARNING: PAYPAL_ENV is not "live" in production!')
      }
      if (validatedEnv.NEXT_PUBLIC_APP_URL.includes('localhost')) {
        warnings.push('⚠️  WARNING: NEXT_PUBLIC_APP_URL points to localhost in production!')
      }
    }

    // Display results
    console.log('✅ Environment validation passed!\n')

    if (warnings.length > 0) {
      console.log('Warnings:')
      warnings.forEach(warning => console.log(warning))
      console.log('')
    }

    console.log('Environment Summary:')
    console.log(`  NODE_ENV: ${validatedEnv.NODE_ENV}`)
    console.log(`  APP_URL: ${validatedEnv.NEXT_PUBLIC_APP_URL}`)
    console.log(`  Database: ${maskConnectionString(validatedEnv.DATABASE_URL)}`)
    console.log(`  Razorpay: ${validatedEnv.RAZORPAY_KEY_ID ? ((validatedEnv.RAZORPAY_KEY_ID || '').startsWith('rzp_test_') ? 'Test Mode' : 'Live Mode') : 'Not configured'}`)
    console.log(`  PayPal: ${validatedEnv.PAYPAL_CLIENT_ID ? `Configured (${validatedEnv.PAYPAL_ENV})` : 'Not configured'}`)
    console.log(`  Email Provider: Resend`)
    console.log(`  Supabase Storage: ${validatedEnv.SUPABASE_URL ? 'Configured' : 'Not configured'}`)
    console.log(`  Download token secret: ${validatedEnv.DOWNLOAD_TOKEN_SECRET ? 'Set' : 'MISSING'}`)
    console.log(`  Rate-limit (Upstash): ${validatedEnv.UPSTASH_REDIS_REST_URL ? 'Configured' : 'In-memory fallback'}`)
    console.log(`  Analytics: ${validatedEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID ? 'Configured' : 'Not configured'}`)
    console.log('')

    return { success: true, env: validatedEnv }
  } catch (error) {
    console.error('❌ Environment validation failed!\n')

    if (error instanceof z.ZodError) {
      console.error('Missing or invalid environment variables:\n')
      error.errors.forEach(err => {
        const path = err.path.join('.')
        console.error(`  • ${path}: ${err.message}`)
      })
      console.error('')
      console.error('Please check your .env.local file and ensure all required variables are set.')
      console.error('See .env.example for the complete list of required variables.\n')
    } else {
      console.error(error)
    }

    return { success: false, error }
  }
}

function maskConnectionString(connectionString) {
  try {
    const url = new URL(connectionString)
    return `postgresql://${url.username}:****@${url.host}${url.pathname}`
  } catch {
    return 'Invalid connection string'
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const result = validateEnvironment()
  if (!result.success) {
    process.exit(1)
  }
}

module.exports = { validateEnvironment, envSchema }
