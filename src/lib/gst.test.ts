/**
 * @jest-environment node
 */
// GST invoicing rules: financial-year numbering, the CGST/SGST vs IGST split by
// place of supply, what an invoice must show, and the monthly filing summary.
const queryRaw = jest.fn()
const findUnique = jest.fn()
const update = jest.fn()
beforeEach(() => update.mockImplementation((a: { data: object }) => Promise.resolve({ id: 'ord_1', ...a.data })))
jest.mock('@/lib/db', () => ({
  db: { $transaction: (fn: (tx: unknown) => unknown) => fn({ $queryRaw: (...a: unknown[]) => queryRaw(...a), order: { findUnique: (...a: unknown[]) => findUnique(...a), update: (...a: unknown[]) => update(...a) } }) },
}))

import { claimWithInvoice, financialYear, gstSupplier, invoiceHtml, invoiceNumberFor, monthRange, monthlyReport, previousMonth, taxSplit } from './gst'

const supplier = { gstin: '33ABCDE1234F1Z5', tradeName: 'Test Traders', address: '1 Main Road, Chennai 600001', prefix: 'PE' }
const inr = (state: string) => ({ subtotal: 761.86, tax: 137.14, total: 899, currency: 'INR', buyerState: state, buyerCountry: 'IN' })
const base = { customerName: null, billingAddress: null, exportLutRef: null, customerEmail: 'buyer@example.com', invoiceNumber: 'PE/2627/00001', invoiceDate: new Date('2026-10-24T05:00:00Z'), ebookSlug: 'cloud-interview-mastery' }

beforeEach(() => jest.clearAllMocks())

test('financial year turns over at midnight IST on 1 April', () => {
  expect(financialYear(new Date('2026-03-31T18:29:59Z'))).toBe('2526') // 23:59:59 IST, 31 March
  expect(financialYear(new Date('2026-03-31T18:30:00Z'))).toBe('2627') // 00:00 IST, 1 April
  expect(financialYear(new Date('2027-01-15T00:00:00Z'))).toBe('2627')
})

test('supplier details come from env and are validated', () => {
  const keep = { ...process.env }
  try {
    delete process.env.GSTIN
    expect(gstSupplier()).toBeUndefined()
    Object.assign(process.env, { GSTIN: '33ABCDE1234F1Z5', GST_TRADE_NAME: 'Test Traders', GST_ADDRESS: 'Chennai' })
    expect(gstSupplier()).toMatchObject({ prefix: 'PE', lutRef: undefined })
    process.env.GSTIN = 'not-a-gstin'
    expect(gstSupplier()).toBeUndefined()
    Object.assign(process.env, { GSTIN: '33ABCDE1234F1Z5', GST_INVOICE_PREFIX: 'EBOOK' })
    expect(gstSupplier()).toBeUndefined() // EBOOK/2627/100000 would be 17 characters, over GST's 16
    process.env.GST_INVOICE_PREFIX = 'EBOK'
    expect(gstSupplier()?.prefix).toBe('EBOK')
    expect(invoiceNumberFor('EBOK', '2627', 999999)).toBe('EBOK/2627/999999') // 16: the longest allowed
    expect(() => invoiceNumberFor('EBOK', '2627', 1000000)).toThrow()
  } finally {
    process.env = keep
  }
})

test('the seller state pays CGST + SGST, other states IGST; an export keeps the treatment it was invoiced with', () => {
  expect(taxSplit(inr('33'), '33')).toMatchObject({ kind: 'intra', cgst: 68.57, sgst: 68.57, igst: 0, taxable: 761.86, total: 899 })
  expect(taxSplit({ ...inr('33'), tax: 137.15 }, '33')).toMatchObject({ cgst: 68.58, sgst: 68.57 }) // halves still add up
  expect(taxSplit(inr('29'), '33')).toMatchObject({ kind: 'inter', igst: 137.14, cgst: 0, sgst: 0 })
  expect(taxSplit({ subtotal: 31.99, tax: 0, total: 31.99, currency: 'USD', buyerState: null }, '33')).toMatchObject({ kind: 'export', taxable: 31.99, igst: 0 })
  expect(taxSplit({ subtotal: 27.11, tax: 4.88, total: 31.99, currency: 'USD', buyerState: null }, '33')).toMatchObject({ kind: 'export-igst', taxable: 27.11, igst: 4.88, total: 31.99 })
})

test('the claim and the invoice number are written together, under a row lock', async () => {
  const at = new Date('2026-10-24T05:00:00Z')
  queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ last: 7 }])
  findUnique.mockResolvedValueOnce({ id: 'ord_1', paymentStatus: 'PENDING', invoiceNumber: null, customerName: null, buyerCountry: null, currency: 'INR' })
  const row = await claimWithInvoice('ord_1', ['PENDING'], { gatewayPaymentId: 'pay_1', fulfilledAt: at }, supplier, { buyerCountry: 'DE', customerName: 'Ada' })
  expect(queryRaw.mock.calls[0][0].join('?')).toContain('FOR UPDATE')
  expect(queryRaw.mock.calls[1][0].join('?')).toContain('ON CONFLICT (fy) DO UPDATE')
  expect(update).toHaveBeenCalledWith({ where: { id: 'ord_1' }, data: {
    paymentStatus: 'SUCCEEDED', status: 'PROCESSING', gatewayPaymentId: 'pay_1', fulfilledAt: at,
    invoiceNumber: 'PE/2627/00007', invoiceDate: at, customerName: 'Ada', buyerCountry: 'DE' } })
  expect(row).toMatchObject({ invoiceNumber: 'PE/2627/00007', paymentStatus: 'SUCCEEDED' })
})

test('a delivery that finds the order already claimed takes no number', async () => {
  queryRaw.mockResolvedValueOnce([])
  findUnique.mockResolvedValueOnce({ id: 'ord_1', paymentStatus: 'SUCCEEDED', invoiceNumber: 'PE/2627/00003' })
  await expect(claimWithInvoice('ord_1', ['PENDING'], { gatewayPaymentId: 'pay_1', fulfilledAt: new Date() }, supplier)).resolves.toBeNull()
  expect(queryRaw).toHaveBeenCalledTimes(1) // the lock only: no counter bump
  expect(update).not.toHaveBeenCalled()
})

test('an export is fixed as zero-rated under the LUT in force, or with IGST out of the price without one', async () => {
  const at = new Date('2026-10-24T05:00:00Z')
  const row = { id: 'ord_1', paymentStatus: 'PENDING', invoiceNumber: null, customerName: 'Ada', buyerCountry: 'FR', currency: 'USD', total: 31.99 }
  queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ last: 1 }])
  findUnique.mockResolvedValueOnce(row)
  await claimWithInvoice('ord_1', ['PENDING'], { gatewayPaymentId: 'p', fulfilledAt: at }, { ...supplier, lutRef: 'AD3310260000001' }, { buyerCountry: 'DE' })
  expect(update.mock.calls[0][0].data).toMatchObject({ exportLutRef: 'AD3310260000001' })
  expect(update.mock.calls[0][0].data).not.toHaveProperty('buyerCountry') // the typed billing country stands
  expect(update.mock.calls[0][0].data).not.toHaveProperty('tax')
  queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ last: 2 }])
  findUnique.mockResolvedValueOnce(row)
  await claimWithInvoice('ord_1', ['PENDING'], { gatewayPaymentId: 'p', fulfilledAt: at }, supplier)
  expect(update.mock.calls[1][0].data).toMatchObject({ subtotal: 27.11, tax: 4.88 })
  expect(update.mock.calls[1][0].data).not.toHaveProperty('exportLutRef')
})

test('a domestic invoice shows the seller, number, place of supply and the tax split', () => {
  const intra = invoiceHtml({ ...base, ...inr('33') }, 'Cloud Platforms', supplier)
  for (const s of ['Tax Invoice', 'Test Traders', '33ABCDE1234F1Z5', 'PE/2627/00001', '24-10-2026', 'Tamil Nadu (33)', '998431', 'CGST 9%', 'SGST 9%', '₹68.57', '₹899.00', 'reverse charge: No'])
    expect(intra).toContain(s)
  const inter = invoiceHtml({ ...base, ...inr('29') }, 'Cloud Platforms', supplier)
  expect(inter).toContain('Karnataka (29)')
  expect(inter).toContain('IGST 18%')
  expect(inter).not.toContain('CGST')
})

test('an export invoice shows the buyer, address and country, zero-rated under an LUT or with IGST without one', () => {
  const usd = { ...base, subtotal: 31.99, tax: 0, total: 31.99, currency: 'USD', buyerState: null, buyerCountry: 'DE', customerName: 'Ada <b>', billingAddress: 'Hauptstr. 1\n10115 Berlin', exportLutRef: 'AD3310260000001' }
  const lut = invoiceHtml(usd, 'Bundle', supplier) // the LUT recorded on the order, whatever env says now
  expect(lut).toContain('Invoice (export of services)')
  expect(lut).toContain('Billed to: Ada &lt;b&gt;, Hauptstr. 1, 10115 Berlin, Germany, buyer@example.com') // buyer text escaped
  expect(lut).toContain('Outside India (Germany)')
  expect(lut).toContain('under Letter of Undertaking (AD3310260000001) without payment of integrated tax')
  expect(lut).not.toContain('IGST')
  const noLut = invoiceHtml({ ...usd, exportLutRef: null, subtotal: 27.11, tax: 4.88 }, 'Bundle', { ...supplier, lutRef: 'AD3310260000001' })
  expect(noLut).toContain('IGST 18%') // an LUT filed later doesn't change an invoice already issued
  expect(noLut).toContain('USD 4.88')
  expect(noLut).toContain('Supply meant for export on payment of integrated tax.')
  expect(noLut).not.toContain('Letter of Undertaking')
  expect(invoiceHtml({ ...usd, invoiceNumber: null }, 'Bundle', supplier)).toBe('')
})

test('the monthly report groups consumer sales by state and lists exports', () => {
  const orders = [
    { ...base, ...inr('33'), invoiceNumber: 'PE/2627/00001' },
    { ...base, ...inr('33'), invoiceNumber: 'PE/2627/00002' },
    { ...base, ...inr('29'), invoiceNumber: 'PE/2627/00003' },
    { ...base, subtotal: 8.47, tax: 1.52, total: 9.99, currency: 'USD', buyerState: null, buyerCountry: 'US', invoiceNumber: 'PE/2627/00004' },
  ]
  const r = monthlyReport(orders, '2026-10', supplier)
  expect(r.count).toBe(4)
  expect(r.html).toContain('Tamil Nadu (33) intra-state</td><td style="padding:4px 8px;border:1px solid #e2e8f0;font-size:13px">2</td>')
  expect(r.html).toContain('137.14') // CGST for the two Tamil Nadu sales
  expect(r.html).toContain('United States')
  expect(r.html).toContain('invoiced when no LUT was configured')
  expect(r.html).toContain('PayPal\'s payout is net of its fees')
  const lines = r.csv.trim().split('\n')
  expect(lines).toHaveLength(5)
  expect(lines[3]).toBe('PE/2627/00003,24-10-2026,B2C,29,Karnataka,IN,INR,761.86,0.00,0.00,137.14,899.00,cloud-interview-mastery')
  expect(lines[4]).toContain(',EXPORT-IGST,,,US,USD,8.47,0.00,0.00,1.52,9.99,')
})

test('month boundaries are IST calendar months', () => {
  const [start, end] = monthRange('2026-10')
  expect(start.toISOString()).toBe('2026-09-30T18:30:00.000Z')
  expect(end.toISOString()).toBe('2026-10-31T18:30:00.000Z')
  expect(previousMonth(new Date('2026-11-01T03:30:00Z'))).toBe('2026-10') // the cron run on 1 Nov, 09:00 IST
  expect(previousMonth(new Date('2027-01-01T03:30:00Z'))).toBe('2026-12')
  expect(() => monthRange('2026-13')).toThrow()
  expect(() => monthRange('2026-00')).toThrow()
})
