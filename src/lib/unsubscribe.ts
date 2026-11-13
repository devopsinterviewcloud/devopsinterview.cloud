/**
 * Unsubscribe links for list emails. The link names the subscriber by row id (not
 * email) and carries an HMAC so nobody can unsubscribe someone else. Signed with
 * DOWNLOAD_TOKEN_SECRET under its own prefix, so these tokens can never be
 * confused with download tokens.
 */
import crypto from 'crypto'

const PREFIX = 'unsubscribe:v1:'

function sign(subscriberId: string): string {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET
  if (!secret) throw new Error('DOWNLOAD_TOKEN_SECRET is not set')
  return crypto.createHmac('sha256', secret).update(PREFIX + subscriberId).digest('base64url')
}

export function unsubscribeToken(subscriberId: string): string {
  return sign(subscriberId)
}

export function verifyUnsubscribeToken(subscriberId: string | null | undefined, token: string | null | undefined): boolean {
  if (!subscriberId || !token || !process.env.DOWNLOAD_TOKEN_SECRET) return false
  const a = Buffer.from(token)
  const b = Buffer.from(sign(subscriberId))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function query(subscriberId: string): string {
  return `s=${encodeURIComponent(subscriberId)}&t=${unsubscribeToken(subscriberId)}`
}

/** The page link in the email footer: shows a confirm button (link scanners only GET). */
export function unsubscribePageUrl(appUrl: string, subscriberId: string): string {
  return `${appUrl}/unsubscribe?${query(subscriberId)}`
}

/** The List-Unsubscribe target: mail clients POST to it for one-click unsubscribe (RFC 8058). */
export function unsubscribeApiUrl(appUrl: string, subscriberId: string): string {
  return `${appUrl}/api/unsubscribe?${query(subscriberId)}`
}
