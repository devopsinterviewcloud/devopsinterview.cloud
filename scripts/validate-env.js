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

  // Stripe (required for production)
  STRIPE_PUBLIC_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // Email
  RESEND_API_KEY: z.string().startsWith('re_'),
  EMAIL_FROM: z.string().email(),

  // Supabase (optional but recommended)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),

  // Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // Sentry (optional but recommended for production)
  SENTRY_DSN: z.string().url().optional(),
})

// Production-specific validations
const productionEnvSchema = envSchema.extend({
  // In production, these must be set
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SENTRY_DSN: z.string().url(),
  REDIS_URL: z.string(),
})

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n')

  const isProduction = process.env.NODE_ENV === 'production'
  const schema = isProduction ? productionEnvSchema : envSchema

  try {
    const validatedEnv = schema.parse(process.env)

    // Check for common mistakes
    const warnings = []

    // Warn if using test keys in production
    if (isProduction) {
      if (validatedEnv.STRIPE_SECRET_KEY.includes('test')) {
        warnings.push('⚠️  WARNING: Using Stripe TEST key in production!')
      }
      if (validatedEnv.NEXT_PUBLIC_APP_URL.includes('localhost')) {
        warnings.push('⚠️  WARNING: NEXT_PUBLIC_APP_URL points to localhost in production!')
      }
      if (validatedEnv.NEXTAUTH_SECRET.length < 64) {
        warnings.push('⚠️  WARNING: NEXTAUTH_SECRET should be at least 64 characters for production!')
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
    console.log(`  Stripe: ${validatedEnv.STRIPE_SECRET_KEY.includes('test') ? 'Test Mode' : 'Live Mode'}`)
    console.log(`  Email Provider: Resend`)
    console.log(`  Supabase: ${validatedEnv.SUPABASE_URL ? 'Configured' : 'Not configured'}`)
    console.log(`  Redis: ${validatedEnv.REDIS_URL ? 'Configured' : 'Not configured'}`)
    console.log(`  Sentry: ${validatedEnv.SENTRY_DSN ? 'Configured' : 'Not configured'}`)
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
