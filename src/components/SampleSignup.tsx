'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

type SampleSignupProps = {
  source?: string
  ctaLabel?: string
  helperText?: string
  successMessage?: string
}

export default function SampleSignup({
  source = 'home-hero',
  ctaLabel = 'Email me the free sample',
  helperText = '8 real questions, one per chapter. No spam, unsubscribe anytime.',
  successMessage = 'Check your inbox for the free sample.',
}: SampleSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
        return
      }
      setStatus('success')
      setMessage(successMessage)
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto text-center bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <p className="text-emerald-800 font-semibold">✅ {message}</p>
        <p className="text-emerald-700 text-sm mt-2">
          It can take a minute to arrive. Check spam if you don&apos;t see it.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {status === 'loading' ? 'Sending…' : ctaLabel}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-red-600 text-sm mt-3 text-center">{message}</p>
      )}
      <p className="text-muted-foreground text-xs mt-3 text-center">
        {helperText}
      </p>
    </form>
  )
}
