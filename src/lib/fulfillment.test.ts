/**
 * @jest-environment node
 */
// Proves the fulfilment invariants the checkout relies on:
//  - a second delivery for an already-fulfilled order sends nothing again,
//  - a lost atomic claim never sends a second email,
//  - a capture that does not match the stored amount/currency is never delivered,
//  - an email failure keeps the order paid+PROCESSING for a retry.
const sendMock = jest.fn()
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send: (...a: unknown[]) => sendMock(...a) } })) }))
const findUnique = jest.fn()
const updateMany = jest.fn()
jest.mock('@/lib/db', () => ({ db: { order: { findUnique: (...a: unknown[]) => findUnique(...a), updateMany: (...a: unknown[]) => updateMany(...a) } } }))

process.env.DOWNLOAD_TOKEN_SECRET = 'test-secret'

import { fulfillByGatewayOrderId } from './fulfillment'

const pending = { id: 'ord_1', gatewayOrderId: 'order_gw', paymentStatus: 'PENDING', status: 'PENDING', total: 899, currency: 'INR', ebookSlug: 'cloud-interview-mastery', customerEmail: 'buyer@example.com', fulfilledAt: null }

beforeEach(() => { jest.clearAllMocks(); sendMock.mockResolvedValue({ error: null }) })

test('first verified delivery claims the order, emails once, marks COMPLETED', async () => {
  findUnique.mockResolvedValueOnce(pending)
  updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 })
  const r = await fulfillByGatewayOrderId('order_gw', 'pay_1', { amount: 899, currency: 'INR' })
  expect(r).toEqual({ ok: true, alreadyFulfilled: false })
  expect(sendMock).toHaveBeenCalledTimes(1)
  expect(sendMock.mock.calls[0][1]).toEqual({ idempotencyKey: 'purchase-email/ord_1' })
  expect(updateMany.mock.calls[0][0].where).toEqual({ id: 'ord_1', paymentStatus: { in: ['PENDING', 'FAILED'] } })
  expect(updateMany.mock.calls[1][0].data).toEqual({ status: 'COMPLETED' })
})

test('redelivery for an already fulfilled order sends nothing', async () => {
  findUnique.mockResolvedValueOnce({ ...pending, paymentStatus: 'SUCCEEDED', status: 'COMPLETED' })
  const r = await fulfillByGatewayOrderId('order_gw', 'pay_1', { amount: 899, currency: 'INR' })
  expect(r).toEqual({ ok: true, alreadyFulfilled: true })
  expect(sendMock).not.toHaveBeenCalled()
  expect(updateMany).not.toHaveBeenCalled()
})

test('losing the atomic claim race never sends a duplicate email', async () => {
  findUnique.mockResolvedValueOnce(pending).mockResolvedValueOnce({ ...pending, paymentStatus: 'SUCCEEDED', status: 'COMPLETED' })
  updateMany.mockResolvedValueOnce({ count: 0 })
  const r = await fulfillByGatewayOrderId('order_gw', 'pay_1', { amount: 899, currency: 'INR' })
  expect(r).toEqual({ ok: true, alreadyFulfilled: true })
  expect(sendMock).not.toHaveBeenCalled()
})

test.each([
  ['wrong amount', { amount: 1, currency: 'INR' }],
  ['wrong currency', { amount: 899, currency: 'USD' }],
])('a capture with the %s is flagged and never delivered', async (_label, paid) => {
  findUnique.mockResolvedValueOnce(pending)
  updateMany.mockResolvedValueOnce({ count: 1 })
  const r = await fulfillByGatewayOrderId('order_gw', 'pay_1', paid)
  expect(r).toEqual({ ok: false, reason: 'amount-mismatch' })
  expect(sendMock).not.toHaveBeenCalled()
  expect(updateMany).toHaveBeenCalledTimes(1)
  expect(updateMany.mock.calls[0][0]).toMatchObject({ where: { id: 'ord_1', paymentStatus: 'PENDING' }, data: { paymentStatus: 'FAILED', status: 'FAILED' } })
})

test('without capture evidence a FAILED order is never resurrected', async () => {
  findUnique.mockResolvedValue({ ...pending, paymentStatus: 'FAILED', status: 'FAILED' })
  updateMany.mockResolvedValue({ count: 0 })
  const r = await fulfillByGatewayOrderId('order_gw', 'pay_1')
  expect(r).toEqual({ ok: true, alreadyFulfilled: true })
  expect(updateMany).toHaveBeenCalledTimes(2) // first claim + one bounded retry, both PENDING-only
  for (const call of updateMany.mock.calls) expect(call[0].where).toEqual({ id: 'ord_1', paymentStatus: { in: ['PENDING'] } })
  expect(sendMock).not.toHaveBeenCalled()
})

test('an email failure keeps the order paid but PROCESSING and reports emailFailed', async () => {
  findUnique.mockResolvedValueOnce(pending)
  updateMany.mockResolvedValueOnce({ count: 1 })
  sendMock.mockResolvedValueOnce({ error: { name: 'validation_error', message: 'domain not verified' } })
  const r = await fulfillByGatewayOrderId('order_gw', 'pay_1', { amount: 899, currency: 'INR' })
  expect(r).toEqual({ ok: true, alreadyFulfilled: false, emailFailed: true })
  expect(updateMany).toHaveBeenCalledTimes(1) // no COMPLETED flip
})

test('a paid PROCESSING order retries the email on redelivery and then completes', async () => {
  findUnique.mockResolvedValueOnce({ ...pending, paymentStatus: 'SUCCEEDED', status: 'PROCESSING', fulfilledAt: new Date('2026-09-01T00:00:00Z') })
  updateMany.mockResolvedValueOnce({ count: 1 })
  const r = await fulfillByGatewayOrderId('order_gw', 'pay_1')
  expect(r).toEqual({ ok: true, alreadyFulfilled: true })
  expect(sendMock).toHaveBeenCalledTimes(1)
  expect(updateMany.mock.calls[0][0].data).toEqual({ status: 'COMPLETED' })
})
