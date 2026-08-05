/**
 * Verifies the Razorpay browser-callback signature so the success screen shows
 * a VERIFIED confirmation instead of trusting a raw client callback. Fulfilment
 * still happens exclusively in the payment.captured webhook.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyCheckoutSignature } from '@/lib/payments/razorpay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
})

export async function POST(req: NextRequest) {
  let parsed
  try {
    parsed = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 })
  }
  const valid = verifyCheckoutSignature(
    parsed.razorpay_order_id,
    parsed.razorpay_payment_id,
    parsed.razorpay_signature,
  )
  if (!valid) {
    console.warn('razorpay checkout signature verification FAILED', { orderId: parsed.razorpay_order_id })
  }
  return NextResponse.json({ valid })
}
