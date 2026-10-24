/**
 * @jest-environment node
 */
// Sample signups get the sample and join the audience; waitlist signups get neither,
// never reactivate an unsubscribed row, and are tagged in one SQL statement.
const upsert = jest.fn()
const executeRaw = jest.fn()
jest.mock('@/lib/db', () => ({
  db: {
    subscriber: { upsert: (...a: unknown[]) => upsert(...a) },
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

beforeEach(() => { jest.clearAllMocks(); upsert.mockResolvedValue({}); executeRaw.mockResolvedValue(1) })

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
