import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sendSampleEmail, addToAudience } from '@/lib/email'
import { checkRateLimit } from '@/lib/rate-limiter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  email: z.string().email().max(200),
  name: z.string().max(120).optional(),
  source: z.string().max(60).optional(),
})

export async function POST(req: NextRequest) {
  // Abuse protection: throttle by IP.
  const limited = await checkRateLimit(req, 'subscribe')
  if (limited) return limited

  let parsed
  try {
    parsed = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  const email = parsed.email.trim().toLowerCase()
  const source = parsed.source || 'free-sample'

  // Capture the lead first so we keep it even if the email vendor hiccups.
  try {
    await db.subscriber.upsert({
      where: { email },
      update: { isActive: true, unsubscribedAt: null },
      create: { email, name: parsed.name, source },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Subscriber upsert failed:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  // Add to the Resend Audience for future broadcasts (newsletter/funnel).
  // Fail-soft: the lead is already saved above, so we never block on this.
  await addToAudience({ email, name: parsed.name })

  // Deliver the sample.
  try {
    await sendSampleEmail({ email })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Sample email send failed:', err)
    return NextResponse.json(
      { error: 'We saved your request but could not send the email just now. Please try again shortly.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, message: 'Check your inbox for the free sample.' })
}
