/**
 * @jest-environment node
 */
// Sample signups get the sample and join the audience; waitlist signups get neither,
// never reactivate an unsubscribed row, and are tagged in one SQL statement.
const upsert = jest.fn()
const updateMany = jest.fn()
const executeRaw = jest.fn()
jest.mock('@/lib/db', () => ({
  db: {
    subscriber: { upsert: (...a: unknown[]) => upsert(...a), updateMany: (...a: unknown[]) => updateMany(...a) },
    $executeRaw: (...a: unknown[]) => executeRaw(...a),
  },
}))
const sendSampleEmail = jest.fn()
const addToAudience = jest.fn()
jest.mock('@/lib/email', () => ({ sendSampleEmail: (...a: unknown[]) => sendSampleEmail(...a), addToAudience: (...a: unknown[]) => addToAudience(...a) }))
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: async () => null }))

import { NextRequest } from 'next/server'
import { POST } from './route'

const post = (body: unknown) => POST(new NextRequest('http://localhost/api/subscribe', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }))

const env = { ...process.env }
beforeEach(() => {
  jest.clearAllMocks()
  upsert.mockResolvedValue({})
  updateMany.mockResolvedValue({ count: 1 })
  executeRaw.mockResolvedValue(1)
  Object.assign(process.env, { DOWNLOAD_TOKEN_SECRET: 'test-secret', NEXT_PUBLIC_APP_URL: 'https://example.com' })
})
afterEach(() => { process.env = { ...env } })

test('a sample signup is saved, reactivated, added to the audience and sent the sample', async () => {
  const res = await post({ email: 'A@Example.com', source: 'home-hero' })
  expect(res.status).toBe(200)
  expect(upsert.mock.calls[0][0]).toMatchObject({
    create: { email: 'a@example.com', source: 'home-hero' },
    update: { isActive: true, unsubscribedAt: null },
  })
  expect(executeRaw).not.toHaveBeenCalled()
  expect(addToAudience).toHaveBeenCalledTimes(1)
  expect(sendSampleEmail).toHaveBeenCalledWith({ email: 'a@example.com' })
})

test('a waitlist signup is created with the tag, leaves an existing row untouched, and is sent nothing', async () => {
  const res = await post({ email: 'Old@Example.com', source: 'ai-infra-waitlist' })
  expect(res.status).toBe(200)
  expect((await res.json()).message).toMatch(/on the list/)
  expect(upsert.mock.calls[0][0]).toEqual({
    where: { email: 'old@example.com' },
    update: {},
    create: { email: 'old@example.com', name: undefined, source: 'ai-infra-waitlist' },
  })
  // tagged template: values are the tag (twice) and the email
  const values = executeRaw.mock.calls[0].slice(1)
  expect(values).toEqual(['ai-infra-waitlist', 'ai-infra-waitlist', 'old@example.com', 'ai-infra-waitlist'])
  expect(executeRaw.mock.calls[0][0].join('?')).toMatch(/UPDATE subscribers/)
  expect(addToAudience).not.toHaveBeenCalled()
  expect(sendSampleEmail).not.toHaveBeenCalled()
})

test('a database failure on the waitlist path is reported, not swallowed', async () => {
  executeRaw.mockRejectedValue(new Error('db down'))
  const res = await post({ email: 'x@example.com', source: 'ai-infra-waitlist' })
  expect(res.status).toBe(500)
})

test('a signup from a page that promises the follow-ups is enrolled after the sample goes out', async () => {
  upsert.mockResolvedValue({ id: 'sub_9' })
  const attribution = { first: { ref: 'dev.to', landing: '/blog/x', at: '2026-11-13T00:00:00.000Z' } }
  const res = await post({ email: 'b@example.com', source: 'blog-sample', attribution })
  expect(res.status).toBe(200)
  expect(upsert.mock.calls[0][0].create).toEqual({ email: 'b@example.com', source: 'blog-sample', attribution })
  expect(sendSampleEmail.mock.calls[0][0].unsubscribeUrl).toMatch(/^https:\/\/example\.com\/unsubscribe\?s=sub_9&t=/)
  expect(updateMany).toHaveBeenCalledWith({ where: { email: 'b@example.com', welcomeStep: null }, data: { welcomeStep: 0, welcomeSentAt: expect.any(Date) } })
})

test('labs and other signups get the sample but are not enrolled', async () => {
  upsert.mockResolvedValue({ id: 'sub_9' })
  await post({ email: 'c@example.com', source: 'labs-notifications' })
  expect(sendSampleEmail).toHaveBeenCalledWith({ email: 'c@example.com' })
  expect(updateMany).not.toHaveBeenCalled()
})

test('no enrolment when the sample email fails, and bad attribution is dropped', async () => {
  upsert.mockResolvedValue({ id: 'sub_9' })
  sendSampleEmail.mockRejectedValueOnce(new Error('resend down'))
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const res = await post({ email: 'd@example.com', source: 'question-sample', attribution: { first: 'nope' } })
  expect(res.status).toBe(502)
  expect(upsert.mock.calls[0][0].create.attribution).toBeUndefined()
  expect(updateMany).not.toHaveBeenCalled()
})
