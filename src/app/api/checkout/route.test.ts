/**
 * @jest-environment node
 */
// Retries within the reuse window are bound to ONE gateway order; an order the
// gateway already reports as paid is never re-minted; name stays optional.
const findFirst = jest.fn()
const create = jest.fn()
jest.mock('@/lib/db', () => ({ db: { order: { findFirst: (...a: unknown[]) => findFirst(...a), create: (...a: unknown[]) => create(...a) } } }))
const createRz = jest.fn(); const fetchRz = jest.fn()
jest.mock('@/lib/payments/razorpay', () => ({ razorpayConfigured: () => true, createRazorpayOrder: (...a: unknown[]) => createRz(...a), fetchRazorpayOrder: (...a: unknown[]) => fetchRz(...a) }))
jest.mock('@/lib/payments/paypal', () => ({ paypalConfigured: () => true, createPayPalOrder: jest.fn(), getPayPalOrder: jest.fn(), paypalApprovalUrl: (id: string) => `https://www.paypal.com/checkoutnow?token=${id}` }))

import { NextRequest } from 'next/server'
import { POST } from './route'

const post = (body: unknown) => POST(new NextRequest('http://localhost/api/checkout', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }))

beforeEach(() => { jest.clearAllMocks(); process.env.RAZORPAY_KEY_ID = 'rzp_test_x' })

test('first click mints one gateway order and one DB row; name is optional', async () => {
  findFirst.mockResolvedValue(null)
  createRz.mockResolvedValue({ id: 'order_new', amount: 89900, currency: 'INR', receipt: 'cloud-interview-mastery' })
  create.mockResolvedValue({})
  const res = await post({ productId: '1', currency: 'INR', email: 'buyer@example.com' })
  expect(res.status).toBe(200)
  const json = await res.json()
  expect(json).toMatchObject({ gateway: 'razorpay', orderId: 'order_new', amount: 89900, currency: 'INR' })
  expect(createRz).toHaveBeenCalledWith(89900, 'cloud-interview-mastery', { slug: 'cloud-interview-mastery', email: 'buyer@example.com' })
  expect(create).toHaveBeenCalledTimes(1)
  expect(create.mock.calls[0][0].data).toMatchObject({ total: 899, currency: 'INR', gatewayOrderId: 'order_new' })
  expect(create.mock.calls[0][0].data.customerName).toBeUndefined()
  expect(create.mock.calls[0][0].data.paymentStatus).toBeUndefined() // schema default PENDING; never SUCCEEDED from checkout
})

test('a retry inside the reuse window returns the SAME order and creates nothing', async () => {
  findFirst.mockResolvedValue({ gatewayOrderId: 'order_existing' })
  fetchRz.mockResolvedValue({ id: 'order_existing', status: 'created', amount: 89900 })
  const res = await post({ productId: '1', currency: 'INR', email: 'buyer@example.com', name: 'A' })
  expect(res.status).toBe(200)
  expect((await res.json()).orderId).toBe('order_existing')
  expect(createRz).not.toHaveBeenCalled()
  expect(create).not.toHaveBeenCalled()
})

test('an order the gateway already reports paid is refused (no second charge)', async () => {
  findFirst.mockResolvedValue({ gatewayOrderId: 'order_paid' })
  fetchRz.mockResolvedValue({ id: 'order_paid', status: 'paid', amount: 89900 })
  const res = await post({ productId: '1', currency: 'INR', email: 'buyer@example.com' })
  expect(res.status).toBe(409)
  expect(createRz).not.toHaveBeenCalled()
})

test('client-supplied amounts are ignored: the server quote decides the charge', async () => {
  findFirst.mockResolvedValue(null)
  createRz.mockResolvedValue({ id: 'order_new', amount: 299900, currency: 'INR', receipt: 'x' })
  create.mockResolvedValue({})
  await post({ productId: 'bundle', currency: 'INR', email: 'buyer@example.com', amount: 1 })
  expect(createRz.mock.calls[0][0]).toBe(299900)
})

test('malformed input (bad email / unknown currency) is rejected before any gateway call', async () => {
  expect((await post({ productId: '1', currency: 'INR', email: 'nope' })).status).toBe(400)
  expect((await post({ productId: '1', currency: 'EUR', email: 'a@b.co' })).status).toBe(400)
  expect((await post({ productId: 'missing', currency: 'INR', email: 'a@b.co' })).status).toBe(404)
  expect(createRz).not.toHaveBeenCalled()
})
