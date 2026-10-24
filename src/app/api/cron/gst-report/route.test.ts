/**
 * @jest-environment node
 */
// The monthly GST summary runs only with the cron secret, only when the seller's
// GST details are configured, and emails the report with its CSV.
const findMany = jest.fn()
const count = jest.fn()
jest.mock('@/lib/db', () => ({ db: { order: { findMany: (...a: unknown[]) => findMany(...a), count: (...a: unknown[]) => count(...a) } } }))
const sendMock = jest.fn()
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send: (...a: unknown[]) => sendMock(...a) } })) }))

import { NextRequest } from 'next/server'
import { GET } from './route'

const env = { ...process.env }
const get = (query = '', auth = 'Bearer s3cret') =>
  GET(new NextRequest(`http://localhost/api/cron/gst-report${query}`, { headers: auth ? { authorization: auth } : {} }))

beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(process.env, { CRON_SECRET: 's3cret', GSTIN: '33ABCDE1234F1Z5', GST_TRADE_NAME: 'Test Traders', GST_ADDRESS: 'Chennai' })
  findMany.mockResolvedValue([])
  count.mockResolvedValue(0)
  sendMock.mockResolvedValue({ error: null })
})
afterEach(() => { process.env = { ...env } })

test('without the cron secret nothing runs', async () => {
  expect((await get('', '')).status).toBe(401)
  expect((await get('', 'Bearer wrong')).status).toBe(401)
  delete process.env.CRON_SECRET
  expect((await get()).status).toBe(401)
  expect(findMany).not.toHaveBeenCalled()
})

test('without GST details it refuses instead of sending an empty report', async () => {
  delete process.env.GSTIN
  expect((await get()).status).toBe(503)
  expect(sendMock).not.toHaveBeenCalled()
})

test('a requested month is reported over its IST bounds and emailed with the CSV', async () => {
  findMany.mockResolvedValue([{ subtotal: 761.86, tax: 137.14, total: 899, currency: 'INR', buyerState: '33', buyerCountry: 'IN', invoiceNumber: 'PE/2627/00001', invoiceDate: new Date('2026-10-24T05:00:00Z'), ebookSlug: 'cloud-interview-mastery' }])
  count.mockResolvedValue(1)
  const res = await get('?month=2026-10')
  expect(await res.json()).toEqual({ ok: true, month: '2026-10', invoices: 1, uninvoiced: 1 })
  expect(findMany.mock.calls[0][0].where.invoiceDate).toEqual({ gte: new Date('2026-09-30T18:30:00Z'), lt: new Date('2026-10-31T18:30:00Z') })
  const mail = sendMock.mock.calls[0][0]
  expect(mail.subject).toBe('GST summary 2026-10: 1 invoice, 1 without invoice')
  expect(mail.attachments[0].filename).toBe('gst-2026-10.csv')
  expect(String(mail.attachments[0].content)).toContain('PE/2627/00001,24-10-2026,B2C,33,Tamil Nadu')
  expect(mail.html).toContain('1 paid order this month has no invoice')
})

test('a malformed month is rejected', async () => {
  expect((await get('?month=October')).status).toBe(400)
})
