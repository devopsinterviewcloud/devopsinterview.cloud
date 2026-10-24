/**
 * GST tax invoices for completed orders, and the monthly summary used to file
 * GST returns. The supplier's details live in env (the repo is public):
 *   GSTIN, GST_TRADE_NAME, GST_ADDRESS   required; without them no invoice is issued
 *   GST_INVOICE_PREFIX                   optional, default "PE" (number = PE/2627/00001)
 *   GST_LUT_REF                          LUT ARN for zero-rated exports; until it is
 *                                        set, export invoices carry no LUT endorsement
 * INR sales: the buyer's state is the place of supply, so the seller's own state
 * (first two digits of the GSTIN) is CGST + SGST and every other state is IGST.
 * USD sales to buyers outside India are exports of services: no GST charged.
 */
import type { Order, Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { GST_RATE } from '@/lib/pricing'
import { gstStateName } from '@/lib/gst-states'

export const SAC = '998431' // on-line text based information such as online books

export type GstSupplier = { gstin: string; tradeName: string; address: string; prefix: string; lutRef?: string }

export function gstSupplier(): GstSupplier | undefined {
  const gstin = process.env.GSTIN?.trim()
  const tradeName = process.env.GST_TRADE_NAME?.trim()
  const address = process.env.GST_ADDRESS?.trim()
  if (!gstin || !tradeName || !address || !/^\d{2}[A-Z0-9]{13}$/.test(gstin)) return undefined
  const prefix = (process.env.GST_INVOICE_PREFIX?.trim() || 'PE').toUpperCase()
  if (!/^[A-Z0-9]{1,6}$/.test(prefix)) return undefined // keeps the number within GST's 16 characters
  return { gstin, tradeName, address, prefix, lutRef: process.env.GST_LUT_REF?.trim() || undefined }
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

/** Indian financial year of a moment, as "2627" for 1 Apr 2026 to 31 Mar 2027 (IST). */
export function financialYear(at: Date): string {
  const ist = new Date(at.getTime() + IST_OFFSET_MS)
  const start = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1
  const yy = (y: number) => String(y % 100).padStart(2, '0')
  return yy(start) + yy(start + 1)
}

export function invoiceNumberFor(prefix: string, fy: string, n: number): string {
  return `${prefix}/${fy}/${String(n).padStart(5, '0')}`
}

/**
 * Give the order its invoice number, once. The order row is locked first, so a
 * concurrent delivery for the same order waits and then sees the number already
 * set instead of taking a second one; the counter upsert is a single statement.
 */
export async function assignInvoiceNumber(
  orderId: string,
  at: Date,
  prefix: string,
  extra: { customerName?: string; buyerCountry?: string } = {},
): Promise<{ invoiceNumber: string; invoiceDate: Date }> {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ invoiceNumber: string | null; invoiceDate: Date | null }[]>`
      SELECT "invoiceNumber", "invoiceDate" FROM orders WHERE id = ${orderId} FOR UPDATE`
    if (rows.length !== 1) throw new Error(`invoice: order ${orderId} not found`)
    if (rows[0].invoiceNumber) return { invoiceNumber: rows[0].invoiceNumber, invoiceDate: rows[0].invoiceDate ?? at }
    const fy = financialYear(at)
    const [{ last }] = await tx.$queryRaw<{ last: number }[]>`
      INSERT INTO invoice_counters (fy, last) VALUES (${fy}, 1)
      ON CONFLICT (fy) DO UPDATE SET last = invoice_counters.last + 1
      RETURNING last`
    const invoiceNumber = invoiceNumberFor(prefix, fy, Number(last))
    const data: Prisma.OrderUpdateInput = { invoiceNumber, invoiceDate: at }
    if (extra.customerName) data.customerName = extra.customerName
    if (extra.buyerCountry) data.buyerCountry = extra.buyerCountry
    await tx.order.update({ where: { id: orderId }, data })
    return { invoiceNumber, invoiceDate: at }
  })
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Amounts arrive as Prisma Decimals from the database; Number() handles both.
type Amount = Prisma.Decimal | number
type Money = { subtotal: Amount; tax: Amount; total: Amount; currency: string; buyerState: string | null }

export type TaxSplit = {
  kind: 'intra' | 'inter' | 'export'
  taxable: number
  cgst: number
  sgst: number
  igst: number
  total: number
  currency: string
}

/** CGST+SGST inside the seller's state, IGST elsewhere in India, nothing on exports. */
export function taxSplit(order: Money, supplierState: string): TaxSplit {
  const taxable = Number(order.subtotal)
  const tax = Number(order.tax)
  const total = Number(order.total)
  if (order.currency !== 'INR') return { kind: 'export', taxable: total, cgst: 0, sgst: 0, igst: 0, total, currency: order.currency }
  if (order.buyerState === supplierState) {
    const cgst = round2(tax / 2)
    return { kind: 'intra', taxable, cgst, sgst: round2(tax - cgst), igst: 0, total, currency: 'INR' }
  }
  return { kind: 'inter', taxable, cgst: 0, sgst: 0, igst: tax, total, currency: 'INR' }
}

export function countryName(code: string | null | undefined): string | undefined {
  if (!code || !/^[A-Z]{2}$/.test(code)) return undefined
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function money(n: number, currency: string) {
  return currency === 'INR' ? `₹${n.toFixed(2)}` : `${currency} ${n.toFixed(2)}`
}

export function istDate(at: Date): string {
  const d = new Date(at.getTime() + IST_OFFSET_MS)
  return `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`
}

type InvoiceOrder = Money & Pick<Order, 'buyerCountry' | 'customerName' | 'customerEmail' | 'invoiceNumber' | 'invoiceDate'>

/** The invoice as an email-safe HTML block (inline styles only). */
export function invoiceHtml(order: InvoiceOrder, product: string, s: GstSupplier): string {
  if (!order.invoiceNumber || !order.invoiceDate) return ''
  const supplierState = s.gstin.slice(0, 2)
  const t = taxSplit(order, supplierState)
  const cell = 'padding:6px 8px;border:1px solid #e2e8f0;text-align:left;font-size:13px'
  const taxRows =
    t.kind === 'intra'
      ? [[`CGST ${(GST_RATE * 50).toFixed(0)}%`, t.cgst], [`SGST ${(GST_RATE * 50).toFixed(0)}%`, t.sgst]]
      : t.kind === 'inter'
        ? [[`IGST ${(GST_RATE * 100).toFixed(0)}%`, t.igst]]
        : []
  const place =
    t.kind === 'export'
      ? `Outside India${countryName(order.buyerCountry) ? ` (${esc(countryName(order.buyerCountry)!)})` : ''}`
      : `${esc(gstStateName(order.buyerState) ?? 'Unknown')} (${esc(order.buyerState ?? '--')})`
  const endorsement =
    t.kind !== 'export'
      ? ''
      : s.lutRef
        ? `<p style="font-size:12px;margin:8px 0">Supply meant for export under Letter of Undertaking (${esc(s.lutRef)}) without payment of integrated tax.</p>`
        : '<p style="font-size:12px;margin:8px 0">Export of services.</p>'
  return `
    <div style="border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:24px 0;font-family:Arial,sans-serif;color:#0f172a">
      <h3 style="margin:0 0 8px">${t.kind === 'export' ? 'Invoice (export of services)' : 'Tax Invoice'}</h3>
      <p style="font-size:13px;margin:0 0 12px">
        <strong>${esc(s.tradeName)}</strong><br>${esc(s.address)}<br>
        GSTIN: ${esc(s.gstin)} &middot; State: ${esc(gstStateName(supplierState) ?? supplierState)} (${esc(supplierState)})
      </p>
      <p style="font-size:13px;margin:0 0 12px">
        Invoice no.: <strong>${esc(order.invoiceNumber)}</strong> &middot; Date: ${istDate(order.invoiceDate)}<br>
        Billed to: ${order.customerName ? `${esc(order.customerName)}, ` : ''}${esc(order.customerEmail)}<br>
        Place of supply: ${place}
      </p>
      <table style="border-collapse:collapse;width:100%">
        <tr><th style="${cell}">Description</th><th style="${cell}">SAC</th><th style="${cell}">Qty</th><th style="${cell}">Amount</th></tr>
        <tr><td style="${cell}">${esc(product)} (ebook, PDF download)</td><td style="${cell}">${SAC}</td><td style="${cell}">1</td><td style="${cell}">${money(t.taxable, t.currency)}</td></tr>
        ${taxRows.map(([label, v]) => `<tr><td style="${cell}" colspan="3">${label}</td><td style="${cell}">${money(v as number, t.currency)}</td></tr>`).join('')}
        <tr><td style="${cell}" colspan="3"><strong>Total</strong></td><td style="${cell}"><strong>${money(t.total, t.currency)}</strong></td></tr>
      </table>
      ${endorsement}
      <p style="font-size:11px;color:#64748b;margin:8px 0 0">Tax payable on reverse charge: No. This is a computer-generated invoice.</p>
    </div>`
}

type ReportOrder = Money & Pick<Order, 'buyerCountry' | 'invoiceNumber' | 'invoiceDate' | 'ebookSlug'>

/** Month (IST) as [start, end) in UTC, for "2026-10". */
export function monthRange(month: string): [Date, Date] {
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m) throw new Error(`bad month ${month}`)
  const y = Number(m[1]), mo = Number(m[2]) - 1
  return [new Date(Date.UTC(y, mo, 1) - IST_OFFSET_MS), new Date(Date.UTC(y, mo + 1, 1) - IST_OFFSET_MS)]
}

/** The month before the one `at` falls in (IST), as "YYYY-MM". */
export function previousMonth(at: Date): string {
  const ist = new Date(at.getTime() + IST_OFFSET_MS)
  const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - 1, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Summary for GSTR-1 / GSTR-3B: consumer sales by state, and the export invoices. */
export function monthlyReport(orders: ReportOrder[], month: string, s: GstSupplier) {
  const supplierState = s.gstin.slice(0, 2)
  const byState = new Map<string, { count: number; taxable: number; cgst: number; sgst: number; igst: number; total: number }>()
  const exports: { invoiceNumber: string; date: string; country: string; currency: string; total: number }[] = []
  const csv = [['invoice_no', 'date', 'type', 'state_code', 'state', 'country', 'currency', 'taxable', 'cgst', 'sgst', 'igst', 'total', 'product'].join(',')]
  for (const o of orders) {
    if (!o.invoiceNumber || !o.invoiceDate) continue
    const t = taxSplit(o, supplierState)
    const date = istDate(o.invoiceDate)
    if (t.kind === 'export') {
      exports.push({ invoiceNumber: o.invoiceNumber, date, country: o.buyerCountry ?? '', currency: t.currency, total: t.total })
    } else {
      const key = o.buyerState ?? '--'
      const r = byState.get(key) ?? { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
      r.count += 1; r.taxable = round2(r.taxable + t.taxable); r.cgst = round2(r.cgst + t.cgst)
      r.sgst = round2(r.sgst + t.sgst); r.igst = round2(r.igst + t.igst); r.total = round2(r.total + t.total)
      byState.set(key, r)
    }
    csv.push([o.invoiceNumber, date, t.kind === 'export' ? 'EXPORT' : 'B2C', o.buyerState ?? '', gstStateName(o.buyerState) ?? '',
      o.buyerCountry ?? '', t.currency, t.taxable.toFixed(2), t.cgst.toFixed(2), t.sgst.toFixed(2), t.igst.toFixed(2), t.total.toFixed(2), o.ebookSlug ?? '']
      .map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))).join(','))
  }
  const cell = 'padding:4px 8px;border:1px solid #e2e8f0;font-size:13px'
  const stateRows = [...byState.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([code, r]) =>
    `<tr><td style="${cell}">${esc(gstStateName(code) ?? code)} (${esc(code)})${code === supplierState ? ' intra-state' : ''}</td><td style="${cell}">${r.count}</td>` +
    `<td style="${cell}">${r.taxable.toFixed(2)}</td><td style="${cell}">${r.cgst.toFixed(2)}</td><td style="${cell}">${r.sgst.toFixed(2)}</td><td style="${cell}">${r.igst.toFixed(2)}</td><td style="${cell}">${r.total.toFixed(2)}</td></tr>`).join('')
  const exportRows = exports.map((e) =>
    `<tr><td style="${cell}">${esc(e.invoiceNumber)}</td><td style="${cell}">${e.date}</td><td style="${cell}">${esc(countryName(e.country) ?? (e.country || 'not recorded'))}</td><td style="${cell}">${esc(e.currency)} ${e.total.toFixed(2)}</td></tr>`).join('')
  const count = csv.length - 1
  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:720px">
      <h2>GST summary for ${esc(month)} (${esc(s.tradeName)}, ${esc(s.gstin)})</h2>
      <p>${count} invoice${count === 1 ? '' : 's'} this month. The CSV attached lists each one.</p>
      <h3>Sales to consumers in India (GSTR-1 B2C, by place of supply), INR</h3>
      ${stateRows ? `<table style="border-collapse:collapse"><tr><th style="${cell}">State</th><th style="${cell}">Invoices</th><th style="${cell}">Taxable</th><th style="${cell}">CGST</th><th style="${cell}">SGST</th><th style="${cell}">IGST</th><th style="${cell}">Total</th></tr>${stateRows}</table>` : '<p>None.</p>'}
      <h3>Exports of services (GSTR-1 Table 6A, GSTR-3B 3.1(b))</h3>
      ${exportRows ? `<table style="border-collapse:collapse"><tr><th style="${cell}">Invoice</th><th style="${cell}">Date</th><th style="${cell}">Country</th><th style="${cell}">Value</th></tr>${exportRows}</table>
      <p style="font-size:13px">GST returns need these in INR: use the exchange rate for each invoice date, or the INR amount PayPal settled.${s.lutRef ? '' : ' <strong>No LUT reference is configured (GST_LUT_REF), so these exports are not covered by an LUT yet.</strong>'}</p>` : '<p>None.</p>'}
    </div>`
  return { html, csv: csv.join('\n') + '\n', count }
}
