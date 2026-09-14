/**
 * @jest-environment node
 */
import crypto from 'crypto'

// The module reads its secrets at import time, so each variant is imported fresh.
async function load(env: Record<string, string>) {
  jest.resetModules()
  Object.assign(process.env, env)
  return await import('./razorpay')
}

describe('Razorpay signature verification', () => {
  let rz: Awaited<ReturnType<typeof load>>
  beforeAll(async () => { rz = await load({ RAZORPAY_KEY_ID: 'rzp_test_x', RAZORPAY_KEY_SECRET: 'key-secret', RAZORPAY_WEBHOOK_SECRET: 'hook-secret' }) })

  test('webhook: accepts the HMAC of the raw body and rejects anything else', () => {
    const raw = '{"event":"payment.captured"}'
    const good = crypto.createHmac('sha256', 'hook-secret').update(raw).digest('hex')
    expect(rz.verifyRazorpayWebhook(raw, good)).toBe(true)
    expect(rz.verifyRazorpayWebhook(raw + ' ', good)).toBe(false)
    expect(rz.verifyRazorpayWebhook(raw, good.replace(/^./, (c) => (c === 'a' ? 'b' : 'a')))).toBe(false)
    expect(rz.verifyRazorpayWebhook(raw, '')).toBe(false)
    expect(rz.verifyRazorpayWebhook(raw, 'zz')).toBe(false)
  })

  test('browser callback: only order|payment signed with the key secret verifies', () => {
    const sig = crypto.createHmac('sha256', 'key-secret').update('order_1|pay_1').digest('hex')
    expect(rz.verifyCheckoutSignature('order_1', 'pay_1', sig)).toBe(true)
    expect(rz.verifyCheckoutSignature('order_1', 'pay_2', sig)).toBe(false)
    expect(rz.verifyCheckoutSignature('order_1', 'pay_1', crypto.createHmac('sha256', 'hook-secret').update('order_1|pay_1').digest('hex'))).toBe(false)
  })

  test('configured only when key, secret and webhook secret are all present', async () => {
    expect(rz.razorpayConfigured()).toBe(true)
    const noHook = await load({ RAZORPAY_KEY_ID: 'rzp_test_x', RAZORPAY_KEY_SECRET: 'key-secret', RAZORPAY_WEBHOOK_SECRET: '' })
    expect(noHook.razorpayConfigured()).toBe(false)
  })
})
