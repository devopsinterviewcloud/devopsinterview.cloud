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

// Interest lists for books that don't exist yet. The page promises one email if the
// book goes ahead, so these signups get no sample and stay out of the broadcast audience.
const WAITLISTS = new Set(['ai-infra-waitlist'])

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

  const waitlist = WAITLISTS.has(source)

  // Capture the lead first so we keep it even if the email vendor hiccups.
  try {
    if (waitlist) {
      // Joining a waitlist is consent to that one email only: an existing row keeps its
      // subscription state, and gets the tag appended (once, in one statement) so the
      // list can be counted and mailed by tag.
      await db.subscriber.upsert({ where: { email }, update: {}, create: { email, name: parsed.name, source } })
      await db.$executeRaw`
        UPDATE subscribers
        SET source = CASE WHEN coalesce(source, '') = '' THEN ${source} ELSE source || '+' || ${source} END
        WHERE email = ${email} AND NOT (${source} = ANY (string_to_array(coalesce(source, ''), '+')))`
    } else {
      await db.subscriber.upsert({
        where: { email },
        update: { isActive: true, unsubscribedAt: null },
        create: { email, name: parsed.name, source },
      })
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Subscriber upsert failed:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  if (waitlist) {
    return NextResponse.json({ ok: true, message: "You're on the list. We'll email you if the book goes ahead." })
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
