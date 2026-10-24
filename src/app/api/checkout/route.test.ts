/**
 * @jest-environment node
 */
// Retries within the reuse window are bound to ONE gateway order; an order the
// gateway already reports as paid is never re-minted; name stays optional; an
// INR checkout needs the buyer's state for the GST place of supply.
const findFirst = jest.fn()
const create = jest.fn()
const updateMany = jest.fn()
jest.mock('@/lib/db', () => ({ db: { order: { findFirst: (...a: unknown[]) => findFirst(...a), create: (...a: unknown[]) => create(...a), updateMany: (...a: unknown[]) => updateMany(...a) } } }))
const createRz = jest.fn(); const fetchRz = jest.fn()
jest.mock('@/lib/payments/razorpay', () => ({ razorpayConfigured: () => true, createRazorpayOrder: (...a: unknown[]) => createRz(...a), fetchRazorpayOrder: (...a: unknown[]) => fetchRz(...a) }))
const createPp = jest.fn()
jest.mock('@/lib/payments/paypal', () => ({ paypalConfigured: () => true, createPayPalOrder: (...a: unknown[]) => createPp(...a), getPayPalOrder: jest.fn(), paypalApprovalUrl: (id: string) => `https://www.paypal.com/checkoutnow?token=${id}` }))

import { NextRequest } from 'next/server'
import { POST } from './route'

const post = (body: unknown) => POST(new NextRequest('http://localhost/api/checkout', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }))

beforeEach(() => { jest.clearAllMocks(); process.env.RAZORPAY_KEY_ID = 'rzp_test_x' })

test('first click mints one gateway order and one DB row; name is optional', async () => {
  findFirst.mockResolvedValue(null)
  createRz.mockResolvedValue({ id: 'order_new', amount: 89900, currency: 'INR', receipt: 'cloud-interview-mastery' })
  create.mockResolvedValue({})
  const res = await post({ productId: '1', currency: 'INR', state: '33', email: 'buyer@example.com' })
  expect(res.status).toBe(200)
  const json = await res.json()
  expect(json).toMatchObject({ gateway: 'razorpay', orderId: 'order_new', amount: 89900, currency: 'INR' })
  expect(createRz).toHaveBeenCalledWith(89900, 'cloud-interview-mastery', { slug: 'cloud-interview-mastery', email: 'buyer@example.com' })
  expect(create).toHaveBeenCalledTimes(1)
  expect(create.mock.calls[0][0].data).toMatchObject({ total: 899, currency: 'INR', gatewayOrderId: 'order_new', buyerState: '33', buyerCountry: 'IN' })
  expect(create.mock.calls[0][0].data.customerName).toBeUndefined()
  expect(create.mock.calls[0][0].data.paymentStatus).toBeUndefined() // schema default PENDING; never SUCCEEDED from checkout
})

test('a retry inside the reuse window returns the SAME order and creates nothing', async () => {
  findFirst.mockResolvedValue({ gatewayOrderId: 'order_existing' })
  fetchRz.mockResolvedValue({ id: 'order_existing', status: 'created', amount: 89900 })
  const res = await post({ productId: '1', currency: 'INR', state: '33', email: 'buyer@example.com', name: 'A' })
  expect(res.status).toBe(200)
  expect((await res.json()).orderId).toBe('order_existing')
  expect(createRz).not.toHaveBeenCalled()
  expect(create).not.toHaveBeenCalled()
})

test('an order the gateway already reports paid is refused (no second charge)', async () => {
  findFirst.mockResolvedValue({ gatewayOrderId: 'order_paid' })
  fetchRz.mockResolvedValue({ id: 'order_paid', status: 'paid', amount: 89900 })
  const res = await post({ productId: '1', currency: 'INR', state: '33', email: 'buyer@example.com' })
  expect(res.status).toBe(409)
  expect(createRz).not.toHaveBeenCalled()
})

test('client-supplied amounts are ignored: the server quote decides the charge', async () => {
  findFirst.mockResolvedValue(null)
  createRz.mockResolvedValue({ id: 'order_new', amount: 299900, currency: 'INR', receipt: 'x' })
  create.mockResolvedValue({})
  await post({ productId: 'bundle', currency: 'INR', state: '33', email: 'buyer@example.com', amount: 1 })
  expect(createRz.mock.calls[0][0]).toBe(299900)
})

test('malformed input (bad email / unknown currency) is rejected before any gateway call', async () => {
  expect((await post({ productId: '1', currency: 'INR', email: 'nope' })).status).toBe(400)
  expect((await post({ productId: '1', currency: 'EUR', email: 'a@b.co' })).status).toBe(400)
  expect((await post({ productId: 'missing', currency: 'INR', state: '33', email: 'a@b.co' })).status).toBe(404)
  expect(createRz).not.toHaveBeenCalled()
})

test('an INR checkout without a valid state is refused before any gateway call', async () => {
  for (const state of [undefined, '99', 'TN']) {
    const res = await post({ productId: '1', currency: 'INR', email: 'buyer@example.com', ...(state ? { state } : {}) })
    expect(res.status).toBe(400)
  }
  expect(createRz).not.toHaveBeenCalled()
  expect(create).not.toHaveBeenCalled()
})

test('a reused unpaid order picks up a corrected state', async () => {
  findFirst.mockResolvedValue({ id: 'ord_1', gatewayOrderId: 'order_existing', buyerState: '33' })
  fetchRz.mockResolvedValue({ id: 'order_existing', status: 'created', amount: 89900 })
  const res = await post({ productId: '1', currency: 'INR', state: '29', email: 'buyer@example.com' })
  expect((await res.json()).orderId).toBe('order_existing')
  expect(updateMany).toHaveBeenCalledWith({ where: { id: 'ord_1', paymentStatus: 'PENDING' }, data: { buyerState: '29' } })
})

test('an international checkout needs the name, billing address and a real country for the export invoice', async () => {
  const ok = { productId: '1', currency: 'USD', email: 'buyer@example.com', name: 'Ada Lovelace', country: 'DE', address: 'Hauptstr. 1, 10115 Berlin' }
  for (const bad of [{ name: undefined }, { name: '  ' }, { address: undefined }, { address: 'x' }, { country: 'OTHER' }, { country: 'IN' }, { country: undefined }]) {
    expect((await post({ ...ok, ...bad })).status).toBe(400)
  }
  expect(createPp).not.toHaveBeenCalled()
  findFirst.mockResolvedValue(null)
  createPp.mockResolvedValue({ id: 'PP1', status: 'CREATED', links: [{ rel: 'approve', href: 'https://paypal.test/approve' }] })
  create.mockResolvedValue({})
  const res = await post(ok)
  expect(res.status).toBe(200)
  expect(create.mock.calls[0][0].data).toMatchObject({ currency: 'USD', tax: 0, buyerCountry: 'DE', billingAddress: 'Hauptstr. 1, 10115 Berlin', customerName: 'Ada Lovelace' })
})
