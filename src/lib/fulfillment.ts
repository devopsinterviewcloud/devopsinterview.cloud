/**
 * Idempotent fulfilment: mark a paid order complete and email the download link.
 * Called from the payment webhooks (the source of truth), never from the browser.
 */
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { createDownloadToken } from '@/lib/download-token'

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
        await sendPurchaseEmail(order.customerEmail, order.id, order.ebookSlug, order.fulfilledAt ?? new Date())
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
  const fulfilledAt = new Date()
  const claim = await db.order.updateMany({
    where: { id: order.id, paymentStatus: 'PENDING' },
    data: {
      paymentStatus: 'SUCCEEDED',
      status: 'PROCESSING',
      gatewayPaymentId,
      fulfilledAt,
    },
  })
  if (claim.count === 0) {
    return { ok: true, alreadyFulfilled: true as const } // another delivery won the race
  }

  if (order.ebookSlug && order.customerEmail) {
    try {
      await sendPurchaseEmail(order.customerEmail, order.id, order.ebookSlug, fulfilledAt)
    } catch (e) {
      // Order stays paid + PROCESSING; the webhook route returns 5xx so the gateway
      // redelivers and the retry branch above resends. Log enough to do it by hand too.
      console.error('fulfillment: DOWNLOAD EMAIL FAILED - will retry on redelivery', {
        orderId: order.id, email: order.customerEmail, slug: order.ebookSlug, error: e,
      })
      return { ok: true, alreadyFulfilled: false as const, emailFailed: true as const }
    }
  }
  await db.order.updateMany({ where: { id: order.id }, data: { status: 'COMPLETED' } })
  return { ok: true, alreadyFulfilled: false as const }
}

/**
 * `anchor` must be stable per order (fulfilledAt): it pins the download-token
 * expiry so retried sends are byte-identical and dedupe under the idempotency key.
 */
async function sendPurchaseEmail(email: string, orderId: string, slug: string, anchor: Date) {
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
