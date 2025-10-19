import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // Error filtering
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException

      // Ignore network errors
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message)
        if (
          message.includes('Network request failed') ||
          message.includes('NetworkError') ||
          message.includes('Failed to fetch')
        ) {
          return null
        }
      }
    }

    return event
  },

  // Additional configuration
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Debug mode
  debug: process.env.NODE_ENV === 'development',

  // Enable capture console
  enableTracing: true,
})
