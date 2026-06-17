'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function SampleSignup({ source = 'home-hero' }: { source?: string }) {
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
      setMessage(data.message || 'Check your inbox for the free sample.')
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
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-semibold whitespace-nowrap transition-colors"
        >
          {status === 'loading' ? 'Sending…' : 'Email me the free sample'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-red-600 text-sm mt-3 text-center">{message}</p>
      )}
      <p className="text-muted-foreground text-xs mt-3 text-center">
        8 real questions, one per chapter. No spam, unsubscribe anytime.
      </p>
    </form>
  )
}
