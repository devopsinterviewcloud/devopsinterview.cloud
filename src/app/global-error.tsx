'use client'

import { useEffect } from 'react'

// Last-resort boundary: catches errors thrown in the root layout itself. It
// must render its own <html>/<body> because it replaces the entire document,
// so it cannot use the app's fonts, providers, or SiteHeader. Keep it minimal.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          // Cover-system paper and ink; the app's CSS is not loaded here.
          background: '#f1ede4',
          color: '#15171c',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1, textTransform: 'uppercase', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#4a4d55', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try again. Your payment and
            account data are safe.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.8125rem', color: '#4a4d55', marginBottom: '1.5rem' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: '#15171c',
              color: '#fff',
              border: '2px solid #15171c',
              minHeight: '48px',
              padding: '0 22px',
              borderRadius: 0,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
