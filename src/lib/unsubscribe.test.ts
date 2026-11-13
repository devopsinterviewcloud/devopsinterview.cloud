/**
 * @jest-environment node
 */
import { unsubscribeApiUrl, unsubscribePageUrl, unsubscribeToken, verifyUnsubscribeToken } from './unsubscribe'

const env = { ...process.env }
beforeEach(() => { process.env.DOWNLOAD_TOKEN_SECRET = 'test-secret' })
afterEach(() => { process.env = { ...env } })

test('a token verifies only for the subscriber it was made for', () => {
  const t = unsubscribeToken('sub_1')
  expect(verifyUnsubscribeToken('sub_1', t)).toBe(true)
  expect(verifyUnsubscribeToken('sub_2', t)).toBe(false)
  expect(verifyUnsubscribeToken('sub_1', t.slice(0, -1) + (t.endsWith('A') ? 'B' : 'A'))).toBe(false)
  expect(verifyUnsubscribeToken('sub_1', '')).toBe(false)
  expect(verifyUnsubscribeToken(null, t)).toBe(false)
})

test('without the secret nothing verifies', () => {
  const t = unsubscribeToken('sub_1')
  process.env.DOWNLOAD_TOKEN_SECRET = ''
  expect(verifyUnsubscribeToken('sub_1', t)).toBe(false)
})

test('links carry the id and token, never the email', () => {
  const t = unsubscribeToken('sub_1')
  expect(unsubscribePageUrl('https://example.com', 'sub_1')).toBe(`https://example.com/unsubscribe?s=sub_1&t=${t}`)
  expect(unsubscribeApiUrl('https://example.com', 'sub_1')).toBe(`https://example.com/api/unsubscribe?s=sub_1&t=${t}`)
})
