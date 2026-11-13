/**
 * Where a visitor came from, saved with their order or sample signup so we can
 * tell which channels actually sell. First touch is the visit that brought them
 * to the site the first time; last touch is the most recent visit that came from
 * another site or a tagged link. Kept in this browser's localStorage (no cookie)
 * and sent only with a checkout or a signup. Paths only: query strings can carry
 * payment tokens, so they are never stored.
 */
import { z } from 'zod'

const STORAGE_KEY = 'dic_src'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
// Gateways send buyers back to /checkout; that return is not a traffic source.
const IGNORED_REFERRERS = /(^|\.)(paypal\.com|razorpay\.com)$/i

const text = z.string().max(150)
const TouchSchema = z.object({
  ref: text.optional(),
  utm_source: text.optional(),
  utm_medium: text.optional(),
  utm_campaign: text.optional(),
  utm_content: text.optional(),
  utm_term: text.optional(),
  landing: z.string().max(200),
  at: z.string().max(40),
})
const AttributionSchema = z.object({ first: TouchSchema, last: TouchSchema.optional() })

export type Touch = z.infer<typeof TouchSchema>
export type Attribution = z.infer<typeof AttributionSchema>

/** Server side: anything malformed is dropped rather than failing the request. */
export function parseAttribution(value: unknown): Attribution | undefined {
  const parsed = AttributionSchema.safeParse(value)
  return parsed.success ? parsed.data : undefined
}

/**
 * Pure core of capture: given what's stored and the current page load, returns the
 * value to store, or null when nothing should change. A first visit is recorded
 * even when direct; later visits only replace `last`, and only when they came from
 * another site or a tagged link.
 */
export function nextAttribution(
  stored: Attribution | undefined,
  page: { hostname: string; pathname: string; search: string },
  referrer: string,
  now: Date,
): Attribution | null {
  const params = new URLSearchParams(page.search)
  const touch: Touch = { landing: page.pathname.slice(0, 200), at: now.toISOString() }
  for (const key of UTM_KEYS) {
    const v = params.get(key)?.trim()
    if (v) touch[key] = v.slice(0, 150)
  }
  // Launch sites and newsletters often tag links with ?ref= instead of utm_source.
  const ref = params.get('ref')?.trim()
  if (ref && !touch.utm_source) touch.utm_source = ref.slice(0, 150)

  let host: string | undefined
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase() : undefined
  } catch {
    host = undefined
  }
  if (host && host !== page.hostname.toLowerCase() && !IGNORED_REFERRERS.test(host)) touch.ref = host.slice(0, 150)

  const external = Boolean(touch.ref || touch.utm_source)
  if (!stored) return { first: touch }
  if (!external) return null
  return { ...stored, last: touch }
}

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/** Reads the stored value; undefined when absent, unreadable or malformed. */
export function readAttribution(): Attribution | undefined {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    return raw ? parseAttribution(JSON.parse(raw)) : undefined
  } catch {
    return undefined
  }
}

/** Called once per full page load. Never throws. */
export function captureAttribution(): void {
  try {
    const next = nextAttribution(readAttribution(), window.location, document.referrer, new Date())
    if (next) storage()?.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked or full: attribution is optional.
  }
}
