/**
 * Monthly GST summary for filing GSTR-1 and GSTR-3B, emailed to the owner with a
 * CSV of every invoice. Vercel cron (vercel.json) calls it on the 1st of each
 * month for the previous month (IST) and sends "Authorization: Bearer $CRON_SECRET";
 * without CRON_SECRET set it refuses to run. `?month=YYYY-MM` reruns a month.
 */
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { gstSupplier, monthlyReport, monthRange, previousMonth } from '@/lib/gst'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  return got.length === want.length && crypto.timingSafeEqual(got, want)
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supplier = gstSupplier()
  if (!supplier) return NextResponse.json({ error: 'GST details not configured' }, { status: 503 })

  const month = req.nextUrl.searchParams.get('month') ?? previousMonth(new Date())
  let start: Date, end: Date
  try {
    ;[start, end] = monthRange(month)
  } catch {
    return NextResponse.json({ error: 'month must be YYYY-MM' }, { status: 400 })
  }

  const orders = await db.order.findMany({
    where: { paymentStatus: 'SUCCEEDED', invoiceNumber: { not: null }, invoiceDate: { gte: start, lt: end } },
    orderBy: { invoiceDate: 'asc' },
  })
  // Paid orders with no invoice (numbering failed, or sold before invoicing started)
  // still have to go into the returns, so the report names them.
  const uninvoiced = await db.order.count({
    where: { paymentStatus: 'SUCCEEDED', invoiceNumber: null, fulfilledAt: { gte: start, lt: end } },
  })
  const report = monthlyReport(orders, month, supplier)
  const warning = uninvoiced
    ? `<p style="font-family:Arial,sans-serif"><strong>${uninvoiced} paid order${uninvoiced === 1 ? '' : 's'} this month ha${uninvoiced === 1 ? 's' : 've'} no invoice.</strong> They still belong in the returns; check the orders table.</p>`
    : ''

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'DevOpsInterview.Cloud <noreply@devopsinterview.cloud>',
    to: [process.env.EMAIL_REPLY_TO || 'devopsinterview.cloud@gmail.com'],
    subject: `GST summary ${month}: ${report.count} invoice${report.count === 1 ? '' : 's'}${uninvoiced ? `, ${uninvoiced} without invoice` : ''}`,
    html: report.html + warning,
    attachments: [{ filename: `gst-${month}.csv`, content: Buffer.from(report.csv) }],
  })
  if (error) {
    console.error('gst-report: email rejected', error)
    return NextResponse.json({ error: 'email failed' }, { status: 502 })
  }
  return NextResponse.json({ ok: true, month, invoices: report.count, uninvoiced })
}
