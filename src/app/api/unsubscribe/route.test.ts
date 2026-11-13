/**
 * @jest-environment node
 */
// Unsubscribe is POST-only and token-checked; the page form is redirected back,
// mail clients' one-click POST gets a plain 200.
const findUnique = jest.fn()
const update = jest.fn()
jest.mock('@/lib/db', () => ({ db: { subscriber: { findUnique: (...a: unknown[]) => findUnique(...a), update: (...a: unknown[]) => update(...a) } } }))
const removeFromAudience = jest.fn()
jest.mock('@/lib/email', () => ({ removeFromAudience: (...a: unknown[]) => removeFromAudience(...a) }))

import { NextRequest } from 'next/server'
import { POST } from './route'
import { unsubscribeToken } from '@/lib/unsubscribe'

const env = { ...process.env }
const post = (query: string, body: string) =>
  POST(new NextRequest(`http://localhost/api/unsubscribe?${query}`, { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } }))

beforeEach(() => {
  jest.clearAllMocks()
  process.env.DOWNLOAD_TOKEN_SECRET = 'test-secret'
  findUnique.mockResolvedValue({ email: 'a@example.com', isActive: true })
  update.mockResolvedValue({})
})
afterEach(() => { process.env = { ...env } })

test('one-click unsubscribe with a valid token deactivates the row', async () => {
  const res = await post(`s=sub_1&t=${unsubscribeToken('sub_1')}`, 'List-Unsubscribe=One-Click')
  expect(res.status).toBe(200)
  expect(update).toHaveBeenCalledWith({ where: { id: 'sub_1' }, data: { isActive: false, unsubscribedAt: expect.any(Date) } })
  expect(removeFromAudience).toHaveBeenCalledWith('a@example.com')
})

test('the page form is redirected to the done page', async () => {
  const res = await post(`s=sub_1&t=${unsubscribeToken('sub_1')}`, 'from=page')
  expect(res.status).toBe(303)
  expect(res.headers.get('location')).toBe('http://localhost/unsubscribe?done=1')
})

test('a bad token changes nothing', async () => {
  const res = await post(`s=sub_2&t=${unsubscribeToken('sub_1')}`, 'List-Unsubscribe=One-Click')
  expect(res.status).toBe(400)
  const page = await post('s=sub_2&t=bad', 'from=page')
  expect(page.headers.get('location')).toBe('http://localhost/unsubscribe?error=1')
  expect(update).not.toHaveBeenCalled()
})

test('an already-unsubscribed row is left alone', async () => {
  findUnique.mockResolvedValue({ email: 'a@example.com', isActive: false })
  const res = await post(`s=sub_1&t=${unsubscribeToken('sub_1')}`, 'List-Unsubscribe=One-Click')
  expect(res.status).toBe(200)
  expect(update).not.toHaveBeenCalled()
  expect(removeFromAudience).not.toHaveBeenCalled()
})
