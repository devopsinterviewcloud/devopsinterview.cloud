/**
 * Daily welcome-series run (vercel.json). For each enrolled, still-subscribed
 * signup whose next email is due, claims the step in the database first and then
 * sends, so overlapping runs can't double-send; a failed send gives the step back
 * for the next run. Anyone who has bought leaves the series.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cronAuthorized } from '@/lib/cron-auth'
import { sendListEmail } from '@/lib/email'
import { unsubscribeApiUrl, unsubscribePageUrl } from '@/lib/unsubscribe'
import { WELCOME_EMAIL_COUNT, WELCOME_GAPS_DAYS, welcomeEmail } from '@/lib/welcome-emails'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000
// Hobby crons fire anywhere in their hour, so allow half a day of slack rather
// than letting a few minutes push an email to the next day's run.
const SLACK_MS = 12 * 60 * 60 * 1000
const BATCH = 200

export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const now = new Date()

  const candidates = await db.subscriber.findMany({
    where: { isActive: true, welcomeStep: { gte: 0, lt: WELCOME_EMAIL_COUNT }, welcomeSentAt: { not: null } },
    orderBy: { welcomeSentAt: 'asc' },
    take: BATCH,
    select: { id: true, email: true, welcomeStep: true, welcomeSentAt: true },
  })

  let sent = 0, buyers = 0, failed = 0
  for (const s of candidates) {
    const step = s.welcomeStep!
    const last = s.welcomeSentAt!
    if (now.getTime() - last.getTime() < WELCOME_GAPS_DAYS[step] * DAY_MS - SLACK_MS) continue

    const bought = await db.order.count({
      where: { customerEmail: { equals: s.email, mode: 'insensitive' }, paymentStatus: 'SUCCEEDED' },
    })
    if (bought > 0) {
      await db.subscriber.updateMany({ where: { id: s.id, welcomeStep: step }, data: { welcomeStep: WELCOME_EMAIL_COUNT } })
      buyers++
      continue
    }

    const claim = await db.subscriber.updateMany({
      where: { id: s.id, welcomeStep: step, isActive: true },
      data: { welcomeStep: step + 1, welcomeSentAt: now },
    })
    if (claim.count !== 1) continue

    const n = step + 1
    const email = welcomeEmail(n, appUrl, unsubscribePageUrl(appUrl, s.id))
    try {
      await sendListEmail({
        to: s.email,
        ...email,
        unsubscribeApiUrl: unsubscribeApiUrl(appUrl, s.id),
        idempotencyKey: `welcome-email/${s.id}/${n}`,
      })
      sent++
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Welcome email send failed:', err)
      await db.subscriber.updateMany({ where: { id: s.id, welcomeStep: n }, data: { welcomeStep: step, welcomeSentAt: last } })
      failed++
    }
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, sent, buyers, failed })
}
