'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie-consent'
export const CONSENT_EVENT = 'cookie-consent-change'

export type ConsentValue = 'accepted' | 'declined'

export function getConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'accepted' || v === 'declined' ? v : null
}

function setConsent(value: ConsentValue) {
  window.localStorage.setItem(STORAGE_KEY, value)
  // 1-year cookie so the server/edge could read it too if ever needed
  document.cookie = `${STORAGE_KEY}=${value}; path=/; max-age=31536000; SameSite=Lax`
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }))
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show only if the visitor hasn't chosen yet
    if (getConsent() === null) setVisible(true)
  }, [])

  if (!visible) return null

  const choose = (value: ConsentValue) => {
    setConsent(value)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          We use analytics cookies to understand how the site is used. You can accept or decline
          non-essential cookies. See our{' '}
          <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => choose('declined')}
            className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Decline
          </button>
          <button
            onClick={() => choose('accepted')}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
