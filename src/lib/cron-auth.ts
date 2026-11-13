import crypto from 'crypto'
import type { NextRequest } from 'next/server'

/** Vercel cron sends "Authorization: Bearer $CRON_SECRET"; without the secret set, nothing runs. */
export function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  return got.length === want.length && crypto.timingSafeEqual(got, want)
}
