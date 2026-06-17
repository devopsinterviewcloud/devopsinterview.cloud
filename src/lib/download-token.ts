/**
 * Short-lived, tamper-proof download tokens (HMAC-SHA256, no external dep).
 * A token binds an order + product + expiry so download links can't be guessed
 * or shared indefinitely. Used by /api/download/[token].
 */
import crypto from 'crypto'

const SECRET = process.env.DOWNLOAD_TOKEN_SECRET || ''

type Payload = { orderId: string; slug: string; exp: number }

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

export function createDownloadToken(orderId: string, slug: string, ttlSeconds = 60 * 60 * 24 * 3): string {
  if (!SECRET) throw new Error('DOWNLOAD_TOKEN_SECRET is not set')
  const payload: Payload = { orderId, slug, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const body = b64url(Buffer.from(JSON.stringify(payload)))
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(body).digest())
  return `${body}.${sig}`
}

export function verifyDownloadToken(token: string): Payload | null {
  if (!SECRET || !token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = b64url(crypto.createHmac('sha256', SECRET).update(body).digest())
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(fromB64url(body).toString()) as Payload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
