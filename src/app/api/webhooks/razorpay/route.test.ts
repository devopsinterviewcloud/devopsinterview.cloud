/**
 * @jest-environment node
 */
// An unsigned or badly signed callback can never reach fulfilment; a verified
// capture reconciles the paise amount; an email failure asks the gateway to retry.
const fulfill = jest.fn()
jest.mock('@/lib/fulfillment', () => ({ fulfillByGatewayOrderId: (...a: unknown[]) => fulfill(...a) }))
const verify = jest.fn()
jest.mock('@/lib/payments/razorpay', () => ({ verifyRazorpayWebhook: (...a: unknown[]) => verify(...a) }))

import { NextRequest } from 'next/server'
import { POST } from './route'

const post = (body: unknown, sig = 'sig') => POST(new NextRequest('http://localhost/api/webhooks/razorpay', { method: 'POST', body: JSON.stringify(body), headers: { 'x-razorpay-signature': sig } }))
const captured = { event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_1', id: 'pay_1', amount: 89900, currency: 'INR' } } } }

beforeEach(() => { jest.clearAllMocks(); fulfill.mockResolvedValue({ ok: true, alreadyFulfilled: false }) })

test('invalid signature: 400 and fulfilment is never called', async () => {
  verify.mockReturnValue(false)
  const res = await post(captured, 'forged')
  expect(res.status).toBe(400)
  expect(fulfill).not.toHaveBeenCalled()
})

test('verified payment.captured fulfils with the reconciled INR amount', async () => {
  verify.mockReturnValue(true)
  const res = await post(captured)
  expect(res.status).toBe(200)
  expect(fulfill).toHaveBeenCalledWith('order_1', 'pay_1', { amount: 899, currency: 'INR' })
})

test('verified but unrelated event is acknowledged without fulfilment', async () => {
  verify.mockReturnValue(true)
  const res = await post({ event: 'payment.authorized', payload: captured.payload })
  expect(res.status).toBe(200)
  expect(fulfill).not.toHaveBeenCalled()
})

test('paid but email failed: 503 so Razorpay redelivers (no second charge, same order)', async () => {
  verify.mockReturnValue(true)
  fulfill.mockResolvedValue({ ok: true, alreadyFulfilled: false, emailFailed: true })
  const res = await post(captured)
  expect(res.status).toBe(503)
  expect(fulfill).toHaveBeenCalledTimes(1)
})
