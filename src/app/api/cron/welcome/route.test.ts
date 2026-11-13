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
jest.mock('@/lib/email', () => ({ sendListEmail: (...a: unknown[]) => sendListEmail(...a) }))

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

test('only enrolled, active subscribers with emails left are considered', async () => {
  findMany.mockResolvedValue([])
  await get()
  expect(findMany.mock.calls[0][0].where).toEqual({ isActive: true, welcomeStep: { gte: 0, lt: 3 }, welcomeSentAt: { not: null } })
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

test('an email that is not due yet is left alone', async () => {
  findMany.mockResolvedValue([sub(0, 1), sub(1, 2), sub(2, 3)]) // gaps are 2, 3 and 4 days
  const res = await get()
  expect(await res.json()).toMatchObject({ sent: 0 })
  expect(updateMany).not.toHaveBeenCalled()
  expect(sendListEmail).not.toHaveBeenCalled()
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

test('a failed send gives the step back for the next run', async () => {
  const s = sub(2, 4)
  findMany.mockResolvedValue([s])
  sendListEmail.mockRejectedValue(new Error('resend down'))
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const res = await get()
  expect(await res.json()).toMatchObject({ sent: 0, failed: 1 })
  expect(updateMany).toHaveBeenLastCalledWith({ where: { id: 'sub_1', welcomeStep: 3 }, data: { welcomeStep: 2, welcomeSentAt: s.welcomeSentAt } })
})
