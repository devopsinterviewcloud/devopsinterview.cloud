import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyDownloadToken } from '@/lib/download-token'
import { signedUrlsForSlug } from '@/lib/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const payload = verifyDownloadToken(token)
  if (!payload) {
    return new NextResponse('This download link is invalid or has expired.', { status: 403 })
  }

  // Entitlement check: the order must exist, match the product, and be paid.
  const order = await db.order.findUnique({ where: { id: payload.orderId } })
  if (!order || order.ebookSlug !== payload.slug || order.paymentStatus !== 'SUCCEEDED') {
    return new NextResponse('No valid purchase found for this link.', { status: 403 })
  }

  let files
  try {
    // 30 min: the bundle hands out several links the buyer clicks in turn, and the
    // PDFs are large, so give a generous window. The token itself stays valid 3 days.
    files = await signedUrlsForSlug(payload.slug, 1800)
  } catch (e) {
    console.error('download: signed url error', e)
    return new NextResponse('Download temporarily unavailable. Please try again shortly.', { status: 503 })
  }
  if (files.length === 0) {
    return new NextResponse('This title is not available for download yet.', { status: 404 })
  }

  // Single file: redirect straight to the signed URL. Bundle: list the links.
  if (files.length === 1) {
    return NextResponse.redirect(files[0].url, 302)
  }
  const list = files
    .map((f) => `<li style="margin:10px 0"><a href="${f.url}">${f.name}</a></li>`)
    .join('')
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Your downloads</title></head>
     <body style="font-family:Arial,sans-serif;max-width:560px;margin:60px auto;color:#0f172a">
     <h2>Your downloads</h2><p>These links expire in 30 minutes; reopen the link from your email any time in the next 3 days to regenerate them.</p>
     <ul>${list}</ul></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } },
  )
}
