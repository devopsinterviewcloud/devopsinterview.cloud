import { track } from '@vercel/analytics'
import type { BeforeSendEvent } from '@vercel/analytics/react'
import type { CaptureResult, PostHog } from 'posthog-js'

type Properties = Record<string, string | number | boolean>
type Client = Pick<PostHog, 'capture'>
type Queued = { name: string; properties?: Properties; url: string; at: Date }

const PRIVATE_PATH = /^\/(api|admin)(\/|$)/
const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
// PostHog lifts search terms out of search-engine referrers into the keyword
// keys. It reads the title and previous page from the document when an event
// is sent, which is wrong for queued events and at navigation start, so those go too.
const DROPPED_KEYS = new Set(['ph_keyword', '$initial_ph_keyword', 'title'])
const isDropped = (key: string) => DROPPED_KEYS.has(key) || key.startsWith('$prev_pageview_')

// PostHog loads in the background (src/instrumentation-client.ts). Events from
// before it arrives wait here with the page and time they happened; without a
// key it never arrives and they're dropped.
let posthogClient: Client | null = null
const pending: Queued[] = []
let lastPageviewPath: string | null = null

/**
 * Keep only campaign tags in the query and drop the fragment. Email links carry
 * unsubscribe tokens and payment returns carry order ids; neither may leave the browser.
 */
export function cleanUrl(value: string): string {
  try {
    const url = new URL(value)
    for (const key of [...url.searchParams.keys()]) {
      if (!key.startsWith('utm_')) url.searchParams.delete(key)
    }
    url.hash = ''
    return url.toString()
  } catch {
    return value.split(/[?#]/)[0]
  }
}

function isPrivatePage(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    return PRIVATE_PATH.test(new URL(value).pathname)
  } catch {
    return true
  }
}

/** Vercel Web Analytics beforeSend. */
export function redactAnalyticsUrl(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    if (PRIVATE_PATH.test(new URL(event.url).pathname)) return null
    return { ...event, url: cleanUrl(event.url) }
  } catch {
    return null
  }
}

function scrub(value: unknown): unknown {
  if (typeof value === 'string') return /^https?:\/\//i.test(value) ? cleanUrl(value) : value
  if (Array.isArray(value)) return value.map(scrub)
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).filter(([k]) => !isDropped(k)).map(([k, v]) => [k, scrub(v)]),
    )
  }
  return value
}

/** PostHog before_send: the same rules, applied to every absolute URL in the event. */
export function redactPostHogEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event || isPrivatePage(event.properties?.$current_url)) return null
  const cleaned: CaptureResult = { ...event, properties: scrub(event.properties) as CaptureResult['properties'] }
  if (event.$set) cleaned.$set = scrub(event.$set) as CaptureResult['$set']
  if (event.$set_once) cleaned.$set_once = scrub(event.$set_once) as CaptureResult['$set_once']
  return cleaned
}

// PostHog takes the page, path and campaign tags from the document when it
// sends; a queued event needs the ones from where it happened.
function pageProperties(url: string): Record<string, string | null> {
  try {
    const parsed = new URL(url)
    const campaign = Object.fromEntries(CAMPAIGN_KEYS.map((k) => [k, parsed.searchParams.get(k)]))
    return { $current_url: url, $pathname: parsed.pathname, ...campaign }
  } catch {
    return { $current_url: url } // redactPostHogEvent drops it.
  }
}

function sendToPostHog(client: Client, { name, properties, url, at }: Queued): void {
  client.capture(name, { ...properties, ...pageProperties(url) }, { timestamp: at })
}

export function setPostHogClient(client: Client): void {
  posthogClient = client
  for (const queued of pending.splice(0)) sendToPostHog(client, queued)
}

function toPostHog(name: string, properties: Properties | undefined, url: string): void {
  const queued = { name, properties, url, at: new Date() }
  if (posthogClient) sendToPostHog(posthogClient, queued)
  else if (pending.length < 20) pending.push(queued)
}

/**
 * Page views are sent from here rather than by PostHog, so one that happens
 * before PostHog has loaded keeps its own time and stays ahead of the events
 * on that page. Called on first load and on every App Router navigation.
 */
export function trackPageview(url?: string): void {
  try {
    const href = new URL(url ?? window.location.href, window.location.href).href
    const path = new URL(href).pathname
    if (path === lastPageviewPath) return
    lastPageviewPath = path
    toPostHog('$pageview', undefined, href)
  } catch {
    // Analytics is optional.
  }
}

/** Analytics is observational and must never interrupt navigation or checkout. */
export function safeTrack(eventName: string, properties?: Properties): void {
  try {
    track(eventName, properties)
  } catch {
    // A blocked or unavailable analytics client is safe to ignore.
  }
  try {
    toPostHog(eventName, properties, window.location.href)
  } catch {
    // Same for PostHog.
  }
}
