jest.mock('@vercel/analytics', () => ({ track: jest.fn() }))

import { track } from '@vercel/analytics'
import { redactAnalyticsUrl, safeTrack } from './analytics'

const mockedTrack = track as jest.MockedFunction<typeof track>

describe('safeTrack', () => {
  it('passes bounded event data to the analytics client', () => {
    safeTrack('checkout_viewed', { product: '1', currency: 'USD' })
    expect(mockedTrack).toHaveBeenCalledWith('checkout_viewed', { product: '1', currency: 'USD' })
  })

  it('does not let an analytics failure interrupt the caller', () => {
    mockedTrack.mockImplementationOnce(() => { throw new Error('blocked') })
    expect(() => safeTrack('checkout_submitted')).not.toThrow()
  })
})

describe('redactAnalyticsUrl', () => {
  it.each(['pageview', 'event'] as const)('removes payment identifiers from %s URLs', (type) => {
    expect(redactAnalyticsUrl({ type, url: 'https://devopsinterview.cloud/checkout/success?token=private-order&PayerID=private-buyer#receipt' }))
      .toEqual({ type, url: 'https://devopsinterview.cloud/checkout/success' })
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
