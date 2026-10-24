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
    // eslint-disable-next-line no-console
    console.error('Route error:', error)
  }, [error])

  return (
    <main id="main" className="pb-16 text-[17px]">
      <div className="wrap pt-10 sm:pt-14">
        <h1 className="font-display text-[120px] leading-[0.85] font-extrabold sm:text-[180px]">
          500
        </h1>
        <div className="mt-6 max-w-[40em]">
          <h2 className="display-2">
            Something went wrong
          </h2>
          <p className="mt-4 text-[18px] leading-normal text-subtle">
            An unexpected error interrupted this page. Your payment and account
            data are safe. Please try again.
          </p>
          {error.digest && (
            <p className="meta mt-3 text-subtle">Reference: {error.digest}</p>
          )}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="btn-primary"
          >
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Back to Homepage
          </Link>
        </div>
        <p className="mt-12 max-w-[680px] border-t border-hair pt-4 text-[15px] text-subtle">
          Still stuck? Email{' '}
          <a href="mailto:support@devopsinterview.cloud" className="font-semibold text-ink underline underline-offset-4 hover:decoration-2">
            support@devopsinterview.cloud
          </a>{' '}
          and we&apos;ll sort it out.
        </p>
      </div>
    </main>
  )
}
