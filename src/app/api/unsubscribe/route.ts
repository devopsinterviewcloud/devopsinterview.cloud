import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe'
import { removeFromAudience } from '@/lib/email'
import { WELCOME_EMAIL_COUNT } from '@/lib/welcome-emails'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST only, so a link scanner opening the email can't unsubscribe anyone. Two
 * callers: mail clients' one-click unsubscribe (List-Unsubscribe-Post, gets a
 * plain 200) and the confirm button on /unsubscribe (sends from=page, gets
 * redirected back to the page).
 */
export async function POST(req: NextRequest) {
  const s = req.nextUrl.searchParams.get('s')
  const t = req.nextUrl.searchParams.get('t')
  let fromPage = false
  try {
    const form = await req.formData()
    fromPage = form.get('from') === 'page'
  } catch {
    // One-click bodies are form-encoded too; anything else is fine to ignore.
  }

  if (!verifyUnsubscribeToken(s, t)) {
    if (fromPage) return NextResponse.redirect(new URL('/unsubscribe?error=1', req.url), 303)
    return NextResponse.json({ error: 'invalid link' }, { status: 400 })
  }

  const sub = await db.subscriber.findUnique({ where: { id: s! }, select: { email: true, isActive: true, welcomeStep: true } })
  if (sub) {
    if (sub.isActive) {
      // Ending the series too means a later signup from a page that doesn't
      // promise it (labs) can't quietly resume it.
      await db.subscriber.update({
        where: { id: s! },
        data: { isActive: false, unsubscribedAt: new Date(), ...(sub.welcomeStep === null ? {} : { welcomeStep: WELCOME_EMAIL_COUNT }) },
      })
    }
    // Every request retries the vendor side, so a Resend hiccup the first time isn't permanent.
    await removeFromAudience(sub.email)
  }

  if (fromPage) return NextResponse.redirect(new URL('/unsubscribe?done=1', req.url), 303)
  return NextResponse.json({ ok: true })
}
