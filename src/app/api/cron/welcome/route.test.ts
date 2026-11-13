/**
 * @jest-environment node
 */
// The welcome run sends only due emails, claims each step before sending, gives
// the step back when the send fails, and takes buyers out of the series.
const findMany = jest.fn()
const updateMany = jest.fn()
const count = jest.fn()
jest.mock('@/lib/db', () => ({
  db: {
    subscriber: { findMany: (...a: unknown[]) => findMany(...a), updateMany: (...a: unknown[]) => updateMany(...a) },
    order: { count: (...a: unknown[]) => count(...a) },
  },
}))
const sendListEmail = jest.fn()
const removeFromAudience = jest.fn()
jest.mock('@/lib/email', () => ({ sendListEmail: (...a: unknown[]) => sendListEmail(...a), removeFromAudience: (...a: unknown[]) => removeFromAudience(...a) }))

import { NextRequest } from 'next/server'
import { GET } from './route'

const env = { ...process.env }
const DAY = 24 * 60 * 60 * 1000
const get = (auth = 'Bearer s3cret') => GET(new NextRequest('http://localhost/api/cron/welcome', { headers: auth ? { authorization: auth } : {} }))
const sub = (step: number, daysAgo: number) => ({ id: 'sub_1', email: 'A@example.com', welcomeStep: step, welcomeSentAt: new Date(Date.now() - daysAgo * DAY) })

beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(process.env, { CRON_SECRET: 's3cret', DOWNLOAD_TOKEN_SECRET: 'test-secret', NEXT_PUBLIC_APP_URL: 'https://example.com' })
  updateMany.mockResolvedValue({ count: 1 })
  count.mockResolvedValue(0)
  sendListEmail.mockResolvedValue({ id: 'em_1' })
})
afterEach(() => { process.env = { ...env } })

test('without the cron secret nothing runs', async () => {
  expect((await get('')).status).toBe(401)
  expect((await get('Bearer wrong')).status).toBe(401)
  expect(findMany).not.toHaveBeenCalled()
})

test('only active subscribers whose next email is due are fetched (2, 3, 4 days, half a day of slack)', async () => {
  findMany.mockResolvedValue([])
  const before = Date.now()
  await get()
  const where = findMany.mock.calls[0][0].where
  expect(where.isActive).toBe(true)
  expect(where.OR.map((c: { welcomeStep: number }) => c.welcomeStep)).toEqual([0, 1, 2])
  where.OR.forEach((c: { welcomeSentAt: { lte: Date } }, i: number) => {
    const ageDays = (before - c.welcomeSentAt.lte.getTime()) / DAY
    expect(ageDays).toBeCloseTo([2, 3, 4][i] - 0.5, 2)
  })
})

test('a due email is claimed, then sent with one-click unsubscribe and an idempotency key', async () => {
  findMany.mockResolvedValue([sub(0, 2)])
  const res = await get()
  expect(await res.json()).toMatchObject({ sent: 1, failed: 0 })
  expect(updateMany).toHaveBeenCalledWith({ where: { id: 'sub_1', welcomeStep: 0, isActive: true }, data: { welcomeStep: 1, welcomeSentAt: expect.any(Date) } })
  const arg = sendListEmail.mock.calls[0][0]
  expect(arg).toMatchObject({ to: 'A@example.com', idempotencyKey: 'welcome-email/sub_1/1' })
  expect(arg.unsubscribeApiUrl).toMatch(/^https:\/\/example\.com\/api\/unsubscribe\?s=sub_1&t=/)
  expect(arg.text).toContain('https://example.com/unsubscribe?s=sub_1&t=')
})

test('one failed send is retried at once with the same key, and counts as sent if that works', async () => {
  findMany.mockResolvedValue([sub(1, 3)])
  sendListEmail.mockRejectedValueOnce(new Error('socket hang up'))
  const res = await get()
  expect(await res.json()).toMatchObject({ sent: 1, failed: 0 })
  expect(sendListEmail).toHaveBeenCalledTimes(2)
  expect(sendListEmail.mock.calls[1][0].idempotencyKey).toBe(sendListEmail.mock.calls[0][0].idempotencyKey)
  expect(updateMany).toHaveBeenCalledTimes(1) // the claim only, no give-back
})

test('a buyer leaves the series without an email', async () => {
  findMany.mockResolvedValue([sub(1, 5)])
  count.mockResolvedValue(1)
  const res = await get()
  expect(await res.json()).toMatchObject({ sent: 0, buyers: 1 })
  expect(count.mock.calls[0][0].where).toEqual({ customerEmail: { equals: 'A@example.com', mode: 'insensitive' }, paymentStatus: 'SUCCEEDED' })
  expect(updateMany).toHaveBeenCalledWith({ where: { id: 'sub_1', welcomeStep: 1 }, data: { welcomeStep: 3 } })
  expect(sendListEmail).not.toHaveBeenCalled()
})

test('a step another run already claimed is not sent twice', async () => {
  findMany.mockResolvedValue([sub(0, 3)])
  updateMany.mockResolvedValue({ count: 0 })
  await get()
  expect(sendListEmail).not.toHaveBeenCalled()
})

test('a send Resend rejected outright gives the step back, only if still subscribed', async () => {
  const s = sub(2, 4)
  findMany.mockResolvedValue([s])
  sendListEmail.mockRejectedValue({ name: 'rate_limit_exceeded', message: 'Too many requests' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const res = await get()
  expect(await res.json()).toMatchObject({ sent: 0, failed: 1, uncertain: 0 })
  expect(updateMany).toHaveBeenLastCalledWith({ where: { id: 'sub_1', welcomeStep: 3, isActive: true }, data: { welcomeStep: 2, welcomeSentAt: s.welcomeSentAt } })
})

test('a send that may have gone out keeps its step, so tomorrow cannot send a duplicate', async () => {
  findMany.mockResolvedValue([sub(0, 2)])
  sendListEmail
    .mockRejectedValueOnce({ name: 'application_error', message: 'Unable to fetch data. The request could not be resolved.' })
    .mockRejectedValueOnce({ name: 'rate_limit_exceeded', message: 'Too many requests' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const res = await get()
  expect(await res.json()).toMatchObject({ sent: 0, failed: 0, uncertain: 1 })
  expect(updateMany).toHaveBeenCalledTimes(1) // the claim only
})

test("the last week's unsubscribes are re-marked in the Resend audience", async () => {
  findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ email: 'gone@example.com' }])
  const res = await get()
  expect(await res.json()).toMatchObject({ resynced: 1 })
  const where = findMany.mock.calls[1][0].where
  expect(where.isActive).toBe(false)
  expect((Date.now() - where.unsubscribedAt.gte.getTime()) / DAY).toBeCloseTo(7, 2)
  expect(removeFromAudience).toHaveBeenCalledWith('gone@example.com')
})
