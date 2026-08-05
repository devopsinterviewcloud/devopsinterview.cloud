'use client'

/**
 * PayPal lands the buyer here (?token=<orderId>) after approval. We poll the
 * confirm endpoint, which captures if the webhook hasn't yet, so the buyer sees
 * a definitive answer instead of being stranded on paypal.com.
 */
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'

type ConfirmState = 'confirming' | 'paid' | 'processing' | 'pending' | 'failed' | 'unknown'

const POLL_MS = 3000
const MAX_POLLS = 10

function SuccessContent() {
  const token = useSearchParams().get('token')
  const [state, setState] = useState<ConfirmState>(token ? 'confirming' : 'unknown')
  const polls = useRef(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      polls.current += 1
      let next: ConfirmState = 'processing'
      try {
        const res = await fetch('/api/paypal/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          // Bound each poll so MAX_POLLS is a real upper limit on total wait.
          signal: AbortSignal.timeout(8000),
        })
        const data = await res.json().catch(() => ({}))
        if (['paid', 'processing', 'pending', 'failed', 'unknown'].includes(data.state)) {
          next = data.state
        }
      } catch {
        // network blip: keep polling
      }
      if (cancelled) return
      // Keep polling while the outcome can still improve (capture/webhook racing us).
      if ((next === 'processing' || next === 'pending') && polls.current < MAX_POLLS) {
        setState('confirming')
        timer = setTimeout(poll, POLL_MS)
      } else {
        setState(next)
        track('paypal_return_result', { state: next, polls: polls.current })
      }
    }

    poll()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [token])

  const card = (emoji: string, title: string, body: React.ReactNode, cta?: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center bg-white rounded-lg shadow-md p-10">
        <div className="text-4xl mb-3">{emoji}</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <div className="text-muted-foreground">{body}</div>
        {cta ?? (
          <Link href="/" className="inline-block mt-6 text-blue-600 font-medium hover:underline">Back to home</Link>
        )}
      </div>
    </div>
  )

  switch (state) {
    case 'confirming':
      return card('⏳', 'Confirming your payment…', 'One moment - we are checking with PayPal. Do not close this page.')
    case 'paid':
      return card('✅', 'Payment received', (
        <>
          <p>Your download link (plus the free Interview-Day Playbook) is on its way to the
          email you used at checkout. It can take a moment to arrive - check your inbox and spam.</p>
        </>
      ))
    case 'processing':
      return card('📬', 'Payment is being confirmed', 'PayPal accepted your payment and confirmation is in progress. Your download link will arrive by email shortly - no further action is needed.')
    case 'pending':
      return card('🛒', 'Payment not completed', 'The payment was not completed (the approval was not finished or the payment method was declined), so you have not been charged. You can try again - PayPal will let you pick a different payment method.', (
        <Link href="/#ebooks" className="inline-block mt-6 text-blue-600 font-medium hover:underline">Return to the store to try again</Link>
      ))
    case 'failed':
      return card('❌', 'Payment did not go through', (
        <p>Your payment was declined or cancelled, so nothing was delivered. If you believe you
        were charged, <Link href="/contact" className="text-blue-600 hover:underline">contact us</Link> with
        your PayPal receipt and we will sort it out.</p>
      ), (
        <Link href="/#ebooks" className="inline-block mt-6 text-blue-600 font-medium hover:underline">Return to the store</Link>
      ))
    default:
      return card('📖', 'Thanks for your purchase', 'If you completed a payment, your download link will arrive by email shortly. Check your inbox and spam folder.')
  }
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  )
}
