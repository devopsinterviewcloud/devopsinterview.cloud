'use client'

import { useState } from 'react'
import { safeTrack } from '@/lib/analytics'

type Status = 'idle' | 'loading' | 'success' | 'error'

type SampleSignupProps = {
  source?: string
  ctaLabel?: string
  helperText?: string
  successMessage?: string
  /** Shown under the success message; null for signups that send no email. */
  successNote?: string | null
}

export default function SampleSignup({
  source = 'home-hero',
  ctaLabel = 'Email me the free sample',
  helperText = '8 real questions, one per chapter. No spam, unsubscribe anytime.',
  successMessage = 'Check your inbox for the free sample.',
  successNote = "It can take a minute to arrive. Check spam if you don't see it.",
}: SampleSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    safeTrack('sample_signup_requested', { source })
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        safeTrack('sample_signup_failed', { source, status: res.status })
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
        return
      }
      setStatus('success')
      safeTrack('sample_signup_succeeded', { source })
      setMessage(successMessage)
      setEmail('')
    } catch {
      safeTrack('sample_signup_failed', { source, status: 'network' })
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto border-2 border-ink bg-sheet p-5 text-ink">
        <p className="font-semibold">{message}</p>
        {successNote && <p className="mt-2 text-sm text-subtle">{successNote}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          className="h-12 min-w-0 flex-1 border-2 border-b-0 border-ink bg-sheet px-3.5 text-base text-ink placeholder:text-subtle sm:border-r-0 sm:border-b-2"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'loading' ? 'Sending…' : ctaLabel}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-3 text-sm font-medium text-book-red">{message}</p>
      )}
      <p className="mt-2.5 text-sm text-subtle">
        {helperText}
      </p>
    </form>
  )
}
