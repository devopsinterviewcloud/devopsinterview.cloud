jest.mock('@vercel/analytics', () => ({ track: jest.fn() }))

import type { CaptureResult } from 'posthog-js'
import { cleanUrl, redactAnalyticsUrl, redactPostHogEvent } from './analytics'

type AnalyticsModule = typeof import('./analytics')

// Each test gets a fresh copy of the module, so the queue and page-view state start empty.
async function load(): Promise<{ analytics: AnalyticsModule; track: jest.Mock; capture: jest.Mock }> {
  let analytics!: AnalyticsModule
  let track!: jest.Mock
  await jest.isolateModulesAsync(async () => {
    analytics = await import('./analytics')
    track = (await import('@vercel/analytics')).track as jest.Mock
  })
  return { analytics, track, capture: jest.fn() }
}

describe('safeTrack', () => {
  beforeEach(() => window.history.replaceState({}, '', '/'))

  it('holds events until PostHog loads, then sends them with their own page and time', async () => {
    const { analytics, capture } = await load()
    window.history.replaceState({}, '', '/checkout?ebook=5')
    const before = Date.now()
    analytics.safeTrack('checkout_viewed', { product: '5' })
    window.history.replaceState({}, '', '/ebooks')
    analytics.setPostHogClient({ capture } as never)
    expect(capture).toHaveBeenCalledTimes(1)
    const [name, props, options] = capture.mock.calls[0]
    expect(name).toBe('checkout_viewed')
    expect(props).toEqual({
      product: '5',
      $current_url: 'http://localhost/checkout?ebook=5',
      $pathname: '/checkout',
      utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null,
    })
    expect(options.timestamp.getTime()).toBeGreaterThanOrEqual(before)
    expect(options.timestamp.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('passes bounded event data to both analytics clients', async () => {
    const { analytics, track, capture } = await load()
    analytics.setPostHogClient({ capture } as never)
    analytics.safeTrack('checkout_viewed', { product: '1', currency: 'USD' })
    expect(track).toHaveBeenCalledWith('checkout_viewed', { product: '1', currency: 'USD' })
    expect(capture.mock.calls[0][0]).toBe('checkout_viewed')
    expect(capture.mock.calls[0][1]).toMatchObject({ product: '1', currency: 'USD' })
  })

  it('does not let an analytics failure interrupt the caller', async () => {
    const { analytics, track, capture } = await load()
    analytics.setPostHogClient({ capture } as never)
    track.mockImplementationOnce(() => { throw new Error('blocked') })
    capture.mockImplementationOnce(() => { throw new Error('blocked') })
    expect(() => analytics.safeTrack('checkout_submitted')).not.toThrow()
  })

  it('still reaches PostHog when Vercel throws', async () => {
    const { analytics, track, capture } = await load()
    analytics.setPostHogClient({ capture } as never)
    track.mockImplementationOnce(() => { throw new Error('blocked') })
    analytics.safeTrack('checkout_submitted')
    expect(capture.mock.calls[0][0]).toBe('checkout_submitted')
  })

  it('keeps at most 20 events while PostHog is missing', async () => {
    const { analytics, capture } = await load()
    for (let i = 0; i < 25; i++) analytics.safeTrack('checkout_viewed')
    analytics.setPostHogClient({ capture } as never)
    expect(capture).toHaveBeenCalledTimes(20)
  })
})

describe('trackPageview', () => {
  beforeEach(() => window.history.replaceState({}, '', '/'))

  it('queues the first page view ahead of the events on that page', async () => {
    const { analytics, capture } = await load()
    analytics.trackPageview()
    analytics.safeTrack('checkout_viewed')
    analytics.setPostHogClient({ capture } as never)
    expect(capture.mock.calls.map((c) => c[0])).toEqual(['$pageview', 'checkout_viewed'])
    expect(capture.mock.calls[0][2].timestamp.getTime()).toBeLessThanOrEqual(capture.mock.calls[1][2].timestamp.getTime())
  })

  it('keeps the campaign tags of the page it happened on', async () => {
    const { analytics, capture } = await load()
    window.history.replaceState({}, '', '/?utm_source=youtube&utm_medium=video')
    analytics.trackPageview()
    window.history.replaceState({}, '', '/ebooks')
    analytics.trackPageview()
    analytics.setPostHogClient({ capture } as never)
    expect(capture.mock.calls.map((c) => [c[1].$pathname, c[1].utm_source, c[1].utm_medium]))
      .toEqual([['/', 'youtube', 'video'], ['/ebooks', null, null]])
  })

  it('counts a navigation once per path and resolves relative URLs', async () => {
    const { analytics, capture } = await load()
    analytics.setPostHogClient({ capture } as never)
    analytics.trackPageview()
    analytics.trackPageview('/')
    analytics.trackPageview('/ebooks?utm_source=yt')
    analytics.trackPageview('/ebooks?other=1')
    expect(capture.mock.calls.map((c) => c[1].$current_url)).toEqual(['http://localhost/', 'http://localhost/ebooks?utm_source=yt'])
  })
})

describe('cleanUrl', () => {
  it('keeps only utm_ tags and drops the fragment', () => {
    expect(cleanUrl('https://devopsinterview.cloud/unsubscribe?s=sub-id&t=secret&utm_source=email#x'))
      .toBe('https://devopsinterview.cloud/unsubscribe?utm_source=email')
  })

  it('falls back to cutting the query when the URL does not parse', () => {
    expect(cleanUrl('https://[bad/path?t=secret')).toBe('https://[bad/path')
  })
})

describe('redactAnalyticsUrl', () => {
  it.each(['pageview', 'event'] as const)('removes payment identifiers from %s URLs', (type) => {
    expect(redactAnalyticsUrl({ type, url: 'https://devopsinterview.cloud/checkout/success?token=private-order&PayerID=private-buyer#receipt' }))
      .toEqual({ type, url: 'https://devopsinterview.cloud/checkout/success' })
  })

  it('removes unsubscribe tokens', () => {
    expect(redactAnalyticsUrl({ type: 'pageview', url: 'https://devopsinterview.cloud/unsubscribe?s=sub-id&t=secret' }))
      .toEqual({ type: 'pageview', url: 'https://devopsinterview.cloud/unsubscribe' })
  })

  it('preserves public campaign attribution', () => {
    const event = { type: 'pageview' as const, url: 'https://devopsinterview.cloud/blog/terraform-interview-questions?utm_source=youtube&utm_medium=video' }
    expect(redactAnalyticsUrl(event)).toEqual(event)
  })

  it.each(['/api/download?token=private', '/admin/orders'])('does not report private routes: %s', (path) => {
    expect(redactAnalyticsUrl({ type: 'pageview', url: `https://devopsinterview.cloud${path}` })).toBeNull()
  })

  it('drops malformed URLs', () => {
    expect(redactAnalyticsUrl({ type: 'pageview', url: 'invalid' })).toBeNull()
  })
})

describe('redactPostHogEvent', () => {
  const event = (properties: Record<string, unknown>, extra: Partial<CaptureResult> = {}): CaptureResult =>
    ({ uuid: 'u', event: '$pageview', properties, ...extra }) as CaptureResult

  it('cleans every URL-valued property, including nested ones and person properties', () => {
    const out = redactPostHogEvent(event(
      {
        $current_url: 'https://devopsinterview.cloud/unsubscribe?s=sub-id&t=secret',
        $referrer: 'https://devopsinterview.cloud/checkout/success?token=order-id&utm_medium=video',
        $pathname: '/unsubscribe',
        nested: { links: ['https://devopsinterview.cloud/x?t=secret'] },
        count: 3,
      },
      { $set_once: { $initial_current_url: 'https://devopsinterview.cloud/?t=secret&utm_source=yt' } },
    ))
    expect(out?.properties).toEqual({
      $current_url: 'https://devopsinterview.cloud/unsubscribe',
      $referrer: 'https://devopsinterview.cloud/checkout/success?utm_medium=video',
      $pathname: '/unsubscribe',
      nested: { links: ['https://devopsinterview.cloud/x'] },
      count: 3,
    })
    expect(out?.$set_once).toEqual({ $initial_current_url: 'https://devopsinterview.cloud/?utm_source=yt' })
    expect(out).not.toHaveProperty('$set')
  })

  it('removes search terms PostHog lifts out of search-engine referrers', () => {
    const out = redactPostHogEvent(event(
      { $current_url: 'https://devopsinterview.cloud/', ph_keyword: 'private', $search_engine: 'google' },
      { $set_once: { $initial_ph_keyword: 'private', $initial_referrer: 'https://www.google.com/search?q=private' } },
    ))
    expect(out?.properties).toEqual({ $current_url: 'https://devopsinterview.cloud/', $search_engine: 'google' })
    expect(out?.$set_once).toEqual({ $initial_referrer: 'https://www.google.com/search' })
  })

  it('drops the title and previous-page fields PostHog reads at send time', () => {
    const out = redactPostHogEvent(event({
      $current_url: 'https://devopsinterview.cloud/checkout',
      title: 'CI/CD & GitOps',
      $prev_pageview_pathname: '/',
      $prev_pageview_duration: 3.2,
      $pageview_id: 'p1',
    }))
    expect(out?.properties).toEqual({ $current_url: 'https://devopsinterview.cloud/checkout', $pageview_id: 'p1' })
  })

  it('leaves non-plain values such as the timestamp alone', () => {
    const timestamp = new Date('2026-11-20T00:00:00Z')
    expect(redactPostHogEvent(event({ $current_url: 'https://devopsinterview.cloud/' }, { timestamp }))?.timestamp).toBe(timestamp)
  })

  it.each(['/api/download/abc', '/admin', 'not a url'])('drops events from private or unparseable pages: %s', (path) => {
    const url = path.startsWith('/') ? `https://devopsinterview.cloud${path}` : path
    expect(redactPostHogEvent(event({ $current_url: url }))).toBeNull()
  })

  it('passes null through', () => {
    expect(redactPostHogEvent(null)).toBeNull()
  })
})
