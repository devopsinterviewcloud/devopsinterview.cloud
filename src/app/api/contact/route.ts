import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/rate-limiter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(5000),
})

export async function POST(req: NextRequest) {
  // Anti-spam: throttle by IP.
  const limited = await checkRateLimit(req, 'contact')
  if (limited) return limited

  let parsed
  try {
    parsed = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Please fill in all fields with valid values.' }, { status: 400 })
  }

  try {
    await sendContactEmail({
      name: parsed.name,
      email: parsed.email.trim().toLowerCase(),
      subject: parsed.subject,
      message: parsed.message,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Contact form send failed:', err)
    return NextResponse.json(
      { error: 'We could not send your message right now. Please email us directly at devopsinterview.cloud@gmail.com.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, message: "Thanks! We'll get back to you soon." })
}
