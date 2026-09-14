import { track } from '@vercel/analytics'
import type { BeforeSendEvent } from '@vercel/analytics/react'

type Properties = Record<string, string | number | boolean>

/** Keep payment-return identifiers out of both pageview and custom-event URLs. */
export function redactAnalyticsUrl(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url)
    if (/^\/(api|admin)(\/|$)/.test(url.pathname)) return null
    if (/^\/checkout(\/|$)/.test(url.pathname)) url.search = ''
    url.hash = ''
    return { ...event, url: url.toString() }
  } catch {
    return null
  }
}

/** Analytics is observational and must never interrupt navigation or checkout. */
export function safeTrack(eventName: string, properties?: Properties): void {
  try {
    track(eventName, properties)
  } catch {
    // A blocked or unavailable analytics client is safe to ignore.
  }
}
