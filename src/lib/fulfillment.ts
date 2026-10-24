/**
 * Idempotent fulfilment: mark a paid order complete, issue its GST invoice, email
 * the download link with the invoice, and tell the store owner about the sale.
 * Called from the payment webhooks (the source of truth), never from the browser.
 */
import { Resend } from 'resend'
import type { Order, PaymentStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { getEbook } from '@/lib/catalog'
import { createDownloadToken } from '@/lib/download-token'
import { claimWithInvoice, countryName, gstSupplier, invoiceHtml, taxSplit } from '@/lib/gst'
import { gstStateName } from '@/lib/gst-states'
import { getPayPalOrder } from '@/lib/payments/paypal'

const resend = new Resend(process.env.RESEND_API_KEY)
// Fall back to the production domain, never localhost: a missing env var must not
// email paying customers a dead download link.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://devopsinterview.cloud'

/**
 * @param paid  the amount/currency actually captured by the gateway, in MAJOR units
 *              (e.g. 24.99 USD or 1999 INR). When provided it is reconciled against
 *              the server-authoritative order total before anything is delivered.
 */
export async function fulfillByGatewayOrderId(
  gatewayOrderId: string,
  gatewayPaymentId: string,
  paid?: { amount: number; currency: string },
  retryOnLostClaim = true,
) {
  const order = await db.order.findUnique({ where: { gatewayOrderId } })
  if (!order) {
    console.warn('fulfillment: no order for gatewayOrderId', gatewayOrderId)
    return { ok: false, reason: 'order-not-found' as const }
  }
  if (order.paymentStatus === 'SUCCEEDED') {
    // Paid, but if status is still PROCESSING the download email never went out
    // (Resend rejected or crashed after the claim). Use this redelivery to retry it.
    // Send BEFORE marking COMPLETED (a crash between the two just retries later),
    // and rely on the per-order Resend idempotency key to collapse duplicate sends
    // from concurrent redeliveries into one delivered email.
    if (order.status === 'PROCESSING' && order.ebookSlug && order.customerEmail) {
      try {
        await sendPurchaseEmail(order.customerEmail, order.id, order.ebookSlug, order.fulfilledAt ?? new Date(), invoiceBlock(order))
        await db.order.updateMany({ where: { id: order.id }, data: { status: 'COMPLETED' } })
        return { ok: true, alreadyFulfilled: true as const }
      } catch (e) {
        console.error('fulfillment: retry of download email failed', { orderId: order.id, error: e })
        return { ok: true, alreadyFulfilled: true as const, emailFailed: true as const }
      }
    }
    return { ok: true, alreadyFulfilled: true as const } // idempotent: webhooks retry
  }

  // Reconcile what was actually paid against the stored, server-authoritative order.
  // Never deliver on an amount/currency we did not charge.
  if (paid) {
    const expected = Number(order.total)
    const currencyOk = paid.currency?.toUpperCase() === order.currency.toUpperCase()
    const amountOk = Number.isFinite(paid.amount) && Math.abs(paid.amount - expected) < 0.01
    if (!currencyOk || !amountOk) {
      console.error('fulfillment: payment does not match order; NOT delivering', {
        gatewayOrderId, expected, expectedCurrency: order.currency, paid,
      })
      // Flag for manual review; only claim a row still PENDING so we never override a real success.
      await db.order.updateMany({
        where: { id: order.id, paymentStatus: 'PENDING' },
        data: { paymentStatus: 'FAILED', status: 'FAILED', gatewayPaymentId },
      })
      return { ok: false, reason: 'amount-mismatch' as const }
    }
  }

  // Atomic claim: exactly one concurrent webhook delivery can flip PENDING -> SUCCEEDED.
  // This avoids the read-then-update race (double email) and the gatewayPaymentId @unique
  // P2002 that would otherwise 500 and make the gateway retry forever.
  // status stays PROCESSING until the download email is actually delivered to
  // Resend; a webhook redelivery retries the email for paid-but-PROCESSING orders.
  // When the caller supplied a capture that just RECONCILED above, that evidence is
  // authoritative: it may also claim a FAILED row, because FAILED marks written by
  // decline/mismatch handlers are provisional and a completed, amount-matched
  // capture proves the money actually moved (e.g. buyer retried after a declined
  // funding source). Without `paid` we never resurrect a FAILED row.
  const fulfilledAt = new Date()
  const claimable: PaymentStatus[] = paid ? ['PENDING', 'FAILED'] : ['PENDING']
  const plainClaim = async () => {
    const r = await db.order.updateMany({
      where: { id: order.id, paymentStatus: { in: claimable } },
      data: {
        paymentStatus: 'SUCCEEDED',
        status: 'PROCESSING',
        gatewayPaymentId,
        fulfilledAt,
      },
    })
    return r.count === 0 ? null : order
  }
  // With GST details configured, the invoice number is taken in the same transaction
  // that claims the order, so no other delivery ever sees it paid without its invoice
  // (and every retried email carries the same one). If that transaction fails, the
  // order is still claimed and delivered; the owner's sale email says to invoice by hand.
  const supplier = gstSupplier()
  let claimed: Order | null
  let invoiceProblem: string | undefined
  if (supplier) {
    try {
      claimed = await claimWithInvoice(order.id, claimable, { gatewayPaymentId, fulfilledAt }, supplier.prefix, await payerDetails(order))
    } catch (e) {
      console.error('invoice: claim with invoice failed, claiming without one', { orderId: order.id, error: e })
      invoiceProblem = `invoice numbering failed (${e instanceof Error ? e.message : String(e)})`
      claimed = await plainClaim()
    }
  } else {
    invoiceProblem = 'GST details are not configured (GSTIN, GST_TRADE_NAME, GST_ADDRESS)'
    claimed = await plainClaim()
  }
  if (!claimed) {
    // Another delivery won the race between our read and our claim. Its email may
    // still have failed, so re-run ONCE against the fresh row: the SUCCEEDED +
    // PROCESSING branch at the top retries the send (Resend's idempotency key
    // collapses any duplicate) and the caller keeps its 503-on-emailFailed signal.
    if (retryOnLostClaim) return fulfillByGatewayOrderId(gatewayOrderId, gatewayPaymentId, paid, false)
    return { ok: true, alreadyFulfilled: true as const }
  }

  // Render from the row as claimed (a state corrected at checkout after our first
  // read is what the invoice, the report and any retry all use).
  const invoiced = claimed
  const problem = invoiceProblem

  if (order.ebookSlug && order.customerEmail) {
    try {
      await sendPurchaseEmail(order.customerEmail, order.id, order.ebookSlug, fulfilledAt, invoiceBlock(invoiced))
    } catch (e) {
      // Order stays paid + PROCESSING; the webhook route returns 5xx so the gateway
      // redelivers and the retry branch above resends. Log enough to do it by hand too.
      console.error('fulfillment: DOWNLOAD EMAIL FAILED - will retry on redelivery', {
        orderId: order.id, email: order.customerEmail, slug: order.ebookSlug, error: e,
      })
      await notifySale(invoiced, false, problem)
      return { ok: true, alreadyFulfilled: false as const, emailFailed: true as const }
    }
  }
  await db.order.updateMany({ where: { id: order.id }, data: { status: 'COMPLETED' } })
  await notifySale(invoiced, Boolean(order.ebookSlug && order.customerEmail), problem)
  return { ok: true, alreadyFulfilled: false as const }
}

const productTitle = (slug: string | null) => (slug && getEbook(slug)?.title) || slug || 'unknown product'

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms) })
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer))
}

/**
 * For a PayPal (export) order about to be invoiced, the payer's name and country from
 * PayPal: better evidence of the place of supply than the checkout menu. If PayPal
 * doesn't answer in 5s the checkout data stands.
 */
async function payerDetails(order: Order): Promise<{ customerName?: string; buyerCountry?: string }> {
  if (order.gateway !== 'paypal' || !order.gatewayOrderId || order.invoiceNumber) return {}
  try {
    const pp = await withTimeout(getPayPalOrder(order.gatewayOrderId), 5000)
    const out: { customerName?: string; buyerCountry?: string } = {}
    const name = [pp?.payer?.name?.given_name, pp?.payer?.name?.surname].filter(Boolean).join(' ').trim()
    if (name) out.customerName = name.slice(0, 120)
    const cc = pp?.payer?.address?.country_code
    if (typeof cc === 'string' && /^[A-Z]{2}$/.test(cc)) out.buyerCountry = cc
    return out
  } catch (e) {
    console.error('invoice: PayPal payer lookup failed, using checkout data', { orderId: order.id, error: e })
    return {}
  }
}

function invoiceBlock(order: Order): string {
  const s = gstSupplier()
  return s ? invoiceHtml(order, productTitle(order.ebookSlug), s) : ''
}

/** One line for the owner: the invoice, or why there isn't one. */
function invoiceNote(order: Order, problem?: string): string {
  const s = gstSupplier()
  if (!s || !order.invoiceNumber) return `Invoice: NOT ISSUED, ${problem ?? 'unknown reason'}. Issue one by hand.`
  const t = taxSplit(order, s.gstin.slice(0, 2), Boolean(s.lutRef))
  if (t.kind === 'export' || t.kind === 'export-igst') {
    const where = countryName(order.buyerCountry) ?? 'country not recorded'
    const warn = order.buyerCountry === 'IN' ? ' WARNING: PayPal says the payer is in India, so this is not an export; it needs IGST.' : ''
    const treatment = t.kind === 'export' ? 'under LUT' : `no LUT configured, IGST ${t.igst.toFixed(2)} ${t.currency} payable`
    return `Invoice: ${order.invoiceNumber}, export to ${where}, ${treatment}.${warn}`
  }
  const state = `${gstStateName(order.buyerState) ?? 'unknown state'} (${order.buyerState ?? '--'})`
  const tax = t.kind === 'intra' ? `CGST ${t.cgst.toFixed(2)} + SGST ${t.sgst.toFixed(2)}` : `IGST ${t.igst.toFixed(2)}`
  return `Invoice: ${order.invoiceNumber}, ${state}, taxable ${t.taxable.toFixed(2)}, ${tax}`
}

/**
 * Email the owner once per sale, from the delivery that won the claim. Best effort:
 * a failure is logged and never fails fulfilment or makes the gateway redeliver,
 * and a slow Resend call is abandoned after 5s so it can't hold up the response.
 */
async function notifySale(order: Order, downloadEmailSent: boolean, invoiceProblem?: string) {
  const product = productTitle(order.ebookSlug)
  const text = [
    `Product: ${product}`,
    `Amount: ${order.total} ${order.currency}${order.gateway ? ` via ${order.gateway}` : ''}`,
    `Buyer: ${order.customerEmail}`,
    `Order: ${order.id}`,
    downloadEmailSent ? 'Download email: sent' : 'Download email: FAILED (a webhook redelivery will retry it)',
    invoiceNote(order, invoiceProblem),
  ].join('\n')
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const sent = resend.emails.send(
      {
        from: process.env.EMAIL_FROM || 'DevOpsInterview.Cloud <noreply@devopsinterview.cloud>',
        replyTo: order.customerEmail,
        to: [process.env.EMAIL_REPLY_TO || 'devopsinterview.cloud@gmail.com'],
        subject: `New sale: ${product} (${order.total} ${order.currency})`,
        text,
      },
      { idempotencyKey: `sale-email/${order.id}` },
    )
    const timedOut = new Promise<'timeout'>((resolve) => { timer = setTimeout(resolve, 5000, 'timeout') })
    const res = await Promise.race([sent, timedOut])
    if (res === 'timeout') console.error('fulfillment: sale notification timed out', { orderId: order.id })
    else if (res.error) console.error('fulfillment: sale notification rejected', { orderId: order.id, error: res.error })
  } catch (e) {
    console.error('fulfillment: sale notification failed', { orderId: order.id, error: e })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * `anchor` must be stable per order (fulfilledAt): it pins the download-token
 * expiry so retried sends are byte-identical and dedupe under the idempotency key.
 */
async function sendPurchaseEmail(email: string, orderId: string, slug: string, anchor: Date, invoice = '') {
  const token = createDownloadToken(orderId, slug, undefined, anchor)
  const link = `${APP_URL}/api/download/${token}`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h2>Thanks for your purchase!</h2>
      <p>Your DevOpsInterview.Cloud download is ready. The link is valid for 3 days; you can
      re-request it any time by replying to this email.</p>
      <p style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin:20px 0">
        🎁 <strong>Bonus included:</strong> The Interview-Day Playbook is on your download page, free with your purchase.
      </p>
      <p style="margin:28px 0">
        <a href="${link}" style="background:#2563eb;color:#fff;text-decoration:none;
           padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block">Download your ebook + bonus</a>
      </p>
      <p style="color:#64748b;font-size:13px">If the button doesn't work, copy this link:<br>${link}</p>
      ${invoice}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="color:#94a3b8;font-size:12px">DevOpsInterview.Cloud &middot; Order ${orderId}</p>
    </div>`
  // Resend reports API rejections via { error } WITHOUT throwing; surface them.
  // The per-order idempotency key makes concurrent/retried sends deliver ONE email
  // (Resend dedupes the key for 24h, which covers the webhook redelivery window).
  const { error } = await resend.emails.send(
    {
      from: process.env.EMAIL_FROM || 'DevOpsInterview.Cloud <noreply@devopsinterview.cloud>',
      replyTo: process.env.EMAIL_REPLY_TO || 'devopsinterview.cloud@gmail.com',
      to: [email],
      subject: 'Your DevOpsInterview.Cloud download',
      html,
    },
    { idempotencyKey: `purchase-email/${orderId}` },
  )
  if (error) throw new Error(`Resend rejected purchase email: ${error.name ?? ''} ${error.message ?? JSON.stringify(error)}`)
}
