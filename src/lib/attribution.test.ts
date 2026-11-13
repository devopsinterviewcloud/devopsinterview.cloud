/**
 * @jest-environment node
 */
// First visit is always recorded; later visits only replace `last`, and only when
// they come from another site or a tagged link. Paths only, never query strings.
import { nextAttribution, parseAttribution } from './attribution'

const page = (pathname: string, search = '') => ({ hostname: 'devopsinterview.cloud', pathname, search })
const now = new Date('2026-11-13T10:00:00Z')

test('a direct first visit is recorded as first touch without a source', () => {
  expect(nextAttribution(undefined, page('/blog/x'), '', now)).toEqual({ first: { landing: '/blog/x', at: now.toISOString() } })
})

test('utm tags and the referring host are kept; the query string is not', () => {
  const v = nextAttribution(undefined, page('/ebooks/b', '?utm_source=youtube&utm_medium=video&token=secret'), 'https://www.youtube.com/watch?v=1', now)
  expect(v?.first).toEqual({ ref: 'www.youtube.com', utm_source: 'youtube', utm_medium: 'video', landing: '/ebooks/b', at: now.toISOString() })
  expect(JSON.stringify(v)).not.toContain('secret')
})

test('?ref= counts as utm_source when no utm_source is present', () => {
  expect(nextAttribution(undefined, page('/', '?ref=producthunt'), '', now)?.first.utm_source).toBe('producthunt')
  expect(nextAttribution(undefined, page('/', '?ref=a&utm_source=b'), '', now)?.first.utm_source).toBe('b')
})

test('later visits: internal, direct and payment-gateway returns change nothing', () => {
  const stored = { first: { ref: 'dev.to', landing: '/blog/x', at: '2026-11-01T00:00:00.000Z' } }
  expect(nextAttribution(stored, page('/ebooks'), 'https://devopsinterview.cloud/blog/x', now)).toBeNull()
  expect(nextAttribution(stored, page('/'), '', now)).toBeNull()
  expect(nextAttribution(stored, page('/checkout/success', '?token=PP1'), 'https://www.paypal.com/checkoutnow', now)).toBeNull()
  expect(nextAttribution(stored, page('/checkout'), 'https://api.razorpay.com/', now)).toBeNull()
})

test('a later external visit sets last and keeps first', () => {
  const stored = { first: { ref: 'dev.to', landing: '/blog/x', at: '2026-11-01T00:00:00.000Z' } }
  const v = nextAttribution(stored, page('/'), 'https://www.google.com/', now)
  expect(v).toEqual({ first: stored.first, last: { ref: 'www.google.com', landing: '/', at: now.toISOString() } })
})

test('parseAttribution drops malformed values and oversized fields', () => {
  expect(parseAttribution(undefined)).toBeUndefined()
  expect(parseAttribution('x')).toBeUndefined()
  expect(parseAttribution({ first: { landing: '/' } })).toBeUndefined() // no timestamp
  expect(parseAttribution({ first: { landing: '/', at: 'now', ref: 'x'.repeat(151) } })).toBeUndefined()
  expect(parseAttribution({ first: { landing: '/', at: 'now', extra: 1 } })).toEqual({ first: { landing: '/', at: 'now' } })
})
