'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Route-segment error boundary. Catches runtime errors thrown while rendering a
// page (or in its data fetching) and shows a recoverable fallback instead of a
// blank screen. The root layout (and SiteHeader) stay mounted around this.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surfaces in the browser console and Vercel logs; no PII is logged.
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            500
          </h1>
        </div>
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Something went wrong
          </h2>
          <p className="text-lg text-muted-foreground mb-2">
            An unexpected error interrupted this page. Your payment and account
            data are safe. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center justify-center"
          >
            Try again
          </button>
          <Link
            href="/"
            className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-all inline-flex items-center justify-center"
          >
            Back to Homepage
          </Link>
        </div>
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Still stuck? Email{' '}
            <a href="mailto:support@devopsinterview.cloud" className="text-blue-600 hover:underline">
              support@devopsinterview.cloud
            </a>{' '}
            and we&apos;ll sort it out.
          </p>
        </div>
      </div>
    </div>
  )
}
