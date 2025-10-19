import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.APP_VERSION,

  // Error filtering
  beforeSend(event, hint) {
    // Filter out certain errors in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry Event:', event)
    }

    // Ignore known issues
    if (event.exception) {
      const error = hint.originalException

      if (error && typeof error === 'object' && 'code' in error) {
        // Ignore expected database errors
        if (error.code === 'P2002') { // Unique constraint violation
          return null
        }
      }
    }

    return event
  },

  // Additional configuration
  integrations: [
    Sentry.httpIntegration(),
    Sentry.prismaIntegration(),
  ],

  // Debug mode
  debug: process.env.NODE_ENV === 'development',

  // Enable capture console
  enableTracing: true,

  // Sample rate for profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
})
