/**
 * @jest-environment node
 */
// Proves the fulfilment invariants the checkout relies on:
//  - a second delivery for an already-fulfilled order sends nothing again,
//  - a lost atomic claim never sends a second email,
//  - a capture that does not match the stored amount/currency is never delivered,
//  - an email failure keeps the order paid+PROCESSING for a retry,
//  - the owner gets one sale email per claimed order, and its failure changes nothing,
//  - a GST invoice is numbered once, rides in the download email, and never blocks delivery.
const sendMock = jest.fn()
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send: (...a: unknown[]) => sendMock(...a) } })) }))
const findUnique = jest.fn()
const updateMany = jest.fn()
const txQuery = jest.fn()
const txUpdate = jest.fn()
const transaction = jest.fn((fn: (tx: unknown) => unknown) => fn({ $queryRaw: (...a: unknown[]) => txQuery(...a), order: { update: (...a: unknown[]) => txUpdate(...a) } }))
jest.mock('@/lib/db', () => ({ db: {
  order: { findUnique: (...a: unknown[]) => findUnique(...a), updateMany: (...a: unknown[]) => updateMany(...a) },
  $transaction: (fn: (tx: unknown) => unknown) => transaction(fn),
} }))
const getPayPalOrder = jest.fn()
jest.mock('@/lib/payments/paypal', () => ({ getPayPalOrder: (...a: unknown[]) => getPayPalOrder(...a) }))

process.env.DOWNLOAD_TOKEN_SECRET = 'test-secret'

import { fulfillByGatewayOrderId } from './fulfillment'

const pending = { id: 'ord_1', gatewayOrderId: 'order_gw', paymentStatus: 'PENDING', status: 'PENDING', total: 899, currency: 'INR', ebookSlug: 'cloud-interview-mastery', customerEmail: 'buyer@example.com', fulfilledAt: null }

beforeEach(() => { jest.clearAllMocks(); sendMock.mockResolvedValue({ error: null }) })

test('first verified delivery claims the order, emails the buyer and the owner once, marks COMPLETED', async () => {
  findUnique.mockResolvedValueOnce(pending)
  updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 })
  const r = await fulfillByGatewayOrderId('order_gw', 'pay_1', { amount: 899, currency: 'INR' })
  expect(r).toEqual({ ok: true, alreadyFulfilled: false })
  expect(sendMock).toHaveBeenCalledTimes(2)
  expect(sendMock.mock.calls[0][0].to).toEqual(['buyer@example.com'])
  expect(sendMock.mock.calls[0][1]).toEqual({ idempotencyKey: 'purchase-email/ord_1' })
  const [sale, saleOpts] = sendMock.mock.calls[1]
  expect(saleOpts).toEqual({ idempotencyKey: 'sale-email/ord_1' })
  expect(sale.to).toEqual([process.env.EMAIL_REPLY_TO || 'devopsinterview.cloud@gmail.com'])
  expect(sale.replyTo).toBe('buyer@example.com')
  expect(sale.subject).toBe('New sale: Cloud Platforms: AWS, Azure & GCP Interview Questions (899 INR)')
  expect(sale.text).toContain('Download email: sent')
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
  expect(sendMock).toHaveBeenCalledTimes(2)
  expect(sendMock.mock.calls[1][0].text).toContain('Download email: FAILED')
})

test.each([
  ['rejects', () => sendMock.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { name: 'rate_limit_exceeded', message: 'slow down' } })],
  ['throws', () => sendMock.mockResolvedValueOnce({ error: null }).mockRejectedValueOnce(new Error('network'))],
  ['hangs', () => sendMock.mockResolvedValueOnce({ error: null }).mockReturnValueOnce(new Promise(() => {}))],
])('a sale notification that %s does not change the fulfilment result', async (_label, arrange) => {
  findUnique.mockResolvedValueOnce(pending)
  updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 })
  arrange()
  jest.useFakeTimers()
  const pendingResult = fulfillByGatewayOrderId('order_gw', 'pay_1', { amount: 899, currency: 'INR' })
  await jest.advanceTimersByTimeAsync(5000)
  const r = await pendingResult
  jest.useRealTimers()
  expect(r).toEqual({ ok: true, alreadyFulfilled: false })
  expect(updateMany.mock.calls[1][0].data).toEqual({ status: 'COMPLETED' })
})

test('a paid PROCESSING order retries the email on redelivery and then completes', async () => {
  findUnique.mockResolvedValueOnce({ ...pending, paymentStatus: 'SUCCEEDED', status: 'PROCESSING', fulfilledAt: new Date('2026-09-01T00:00:00Z') })
  updateMany.mockResolvedValueOnce({ count: 1 })
  const r = await fulfillByGatewayOrderId('order_gw', 'pay_1')
  expect(r).toEqual({ ok: true, alreadyFulfilled: true })
  expect(sendMock).toHaveBeenCalledTimes(1) // buyer only: the owner was told when the order was claimed
  expect(sendMock.mock.calls[0][1]).toEqual({ idempotencyKey: 'purchase-email/ord_1' })
  expect(updateMany.mock.calls[0][0].data).toEqual({ status: 'COMPLETED' })
})

describe('GST invoice', () => {
  const env = { ...process.env }
  beforeEach(() => Object.assign(process.env, { GSTIN: '33ABCDE1234F1Z5', GST_TRADE_NAME: 'Test Traders', GST_ADDRESS: 'Chennai' }))
  afterEach(() => { process.env = { ...env } })
  const karnataka = { ...pending, subtotal: 761.86, tax: 137.14, buyerState: '29', buyerCountry: 'IN', invoiceNumber: null, invoiceDate: null }

  test('the claiming delivery numbers the invoice and sends it with the download link', async () => {
    findUnique.mockResolvedValueOnce(karnataka)
    updateMany.mockResolvedValue({ count: 1 })
    txQuery.mockResolvedValueOnce([{ invoiceNumber: null, invoiceDate: null }]).mockResolvedValueOnce([{ last: 7 }])
    const r = await fulfillByGatewayOrderId('order_gw', 'pay_1', { amount: 899, currency: 'INR' })
    expect(r).toEqual({ ok: true, alreadyFulfilled: false })
    expect(transaction).toHaveBeenCalledTimes(1)
    const purchase = sendMock.mock.calls[0][0]
    expect(purchase.html).toMatch(/PE\/\d{4}\/00007/)
    expect(purchase.html).toContain('Tax Invoice')
    expect(purchase.html).toContain('Karnataka (29)')
    expect(purchase.html).toContain('IGST 18%')
    expect(sendMock.mock.calls[1][0].text).toMatch(/Invoice: PE\/\d{4}\/00007, Karnataka \(29\), taxable 761\.86, IGST 137\.14/)
    expect(getPayPalOrder).not.toHaveBeenCalled()
  })

  test('a PayPal order takes the payer name and country from PayPal for its export invoice', async () => {
    findUnique.mockResolvedValueOnce({ ...pending, gateway: 'paypal', currency: 'USD', total: 31.99, subtotal: 31.99, tax: 0, buyerState: null, buyerCountry: null, invoiceNumber: null, invoiceDate: null })
    updateMany.mockResolvedValue({ count: 1 })
    getPayPalOrder.mockResolvedValueOnce({ payer: { name: { given_name: 'Ada', surname: 'Lovelace' }, address: { country_code: 'DE' } } })
    txQuery.mockResolvedValueOnce([{ invoiceNumber: null, invoiceDate: null }]).mockResolvedValueOnce([{ last: 1 }])
    await fulfillByGatewayOrderId('order_gw', 'pay_1', { amount: 31.99, currency: 'USD' })
    expect(txUpdate.mock.calls[0][0].data).toMatchObject({ customerName: 'Ada Lovelace', buyerCountry: 'DE' })
    const purchase = sendMock.mock.calls[0][0]
    expect(purchase.html).toContain('Invoice (export of services)')
    expect(purchase.html).toContain('Outside India (Germany)')
    expect(purchase.html).toContain('Ada Lovelace')
    expect(sendMock.mock.calls[1][0].text).toContain('export to Germany, NO LUT configured')
  })

  test('if numbering fails the buyer still gets the download and the owner is told', async () => {
    findUnique.mockResolvedValueOnce(karnataka)
    updateMany.mockResolvedValue({ count: 1 })
    transaction.mockImplementationOnce(() => Promise.reject(new Error('db down')))
    const r = await fulfillByGatewayOrderId('order_gw', 'pay_1', { amount: 899, currency: 'INR' })
    expect(r).toEqual({ ok: true, alreadyFulfilled: false })
    expect(sendMock.mock.calls[0][0].html).not.toContain('Tax Invoice')
    expect(updateMany.mock.calls[1][0].data).toEqual({ status: 'COMPLETED' })
    expect(sendMock.mock.calls[1][0].text).toContain('Invoice: NOT ISSUED, invoice numbering failed (db down). Issue one by hand.')
  })

  test('an email retry reuses the stored invoice and never takes a new number', async () => {
    findUnique.mockResolvedValueOnce({ ...karnataka, paymentStatus: 'SUCCEEDED', status: 'PROCESSING', fulfilledAt: new Date('2026-10-24T05:00:00Z'), invoiceNumber: 'PE/2627/00003', invoiceDate: new Date('2026-10-24T05:00:00Z') })
    updateMany.mockResolvedValueOnce({ count: 1 })
    await fulfillByGatewayOrderId('order_gw', 'pay_1')
    expect(transaction).not.toHaveBeenCalled()
    expect(sendMock.mock.calls[0][0].html).toContain('PE/2627/00003')
  })
})
