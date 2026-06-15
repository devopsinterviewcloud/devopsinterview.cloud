'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { getConsent, CONSENT_EVENT } from './CookieConsent'

/**
 * Loads analytics only after the visitor has accepted cookies, so EU/GDPR
 * traffic is not tracked without consent. Re-evaluates when consent changes.
 */
export default function ConsentedAnalytics() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const update = () => setAllowed(getConsent() === 'accepted')
    update()
    window.addEventListener(CONSENT_EVENT, update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(CONSENT_EVENT, update)
      window.removeEventListener('storage', update)
    }
  }, [])

  if (!allowed) return null
  return <Analytics />
}
