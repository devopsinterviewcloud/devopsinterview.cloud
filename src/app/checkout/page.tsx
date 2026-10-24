'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { safeTrack } from '@/lib/analytics'
import { bookStyle } from '@/lib/book-style'
import ebooksData from '@/data/ebooks.json'
import { GST_STATES } from '@/lib/gst-states'
import { countryOptions } from '@/lib/countries'

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

const inlineLink = 'font-semibold text-ink underline underline-offset-4 hover:decoration-2'

// Single shared in-flight load: concurrent callers (mount preload + submit
// precheck) await the same promise instead of tearing down each other's
// <script> tag. window.Razorpay is the real readiness signal; a failed load
// resets the loader so a later retry can attempt a fresh tag.
let rzpLoader: Promise<boolean> | null = null
function loadScript(src: string): Promise<boolean> {
  if ((window as { Razorpay?: unknown }).Razorpay) return Promise.resolve(true)
  if (rzpLoader) return rzpLoader
  rzpLoader = new Promise((resolve) => {
    const s = document.createElement('script')
    let settled = false
    const settle = (ok: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (!ok) { s.remove(); rzpLoader = null }
      resolve(ok)
    }
    // A hung CDN request must not leave the Pay button stuck forever.
    const timer = setTimeout(() => settle(false), 12000)
    s.src = src
    // onload alone is not proof the checkout is usable - verify the global exists.
    s.onload = () => settle(Boolean((window as { Razorpay?: unknown }).Razorpay))
    s.onerror = () => settle(false)
    document.body.appendChild(s)
  })
  return rzpLoader
}

type RazorpayInstance = {
  open: () => void
  on: (event: 'payment.failed', cb: (resp: RazorpayFailure) => void) => void
}
type RazorpayFailure = {
  error?: { code?: string; description?: string; reason?: string; step?: string }
}
type RazorpaySuccess = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

const BLOCKED_MSG =
  'Your browser blocked the payment window (usually an ad-blocker or privacy ' +
  'extension). Please allow it for this site or try an incognito window - or ' +
  'contact us and we will send you a direct payment link.'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const ebookId = searchParams.get('ebook')
  // Accept json id or slug: PayPal's cancel_url round-trips the slug.
  const ebook = ebooksData.find((e) => e.id === ebookId || e.slug === ebookId)
  const ebookTitle = ebook?.title || 'Selected Ebook'
  const paypalCancelled = searchParams.get('cancelled') === 'paypal'

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [gstState, setGstState] = useState('')
  const [address, setAddress] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  // Whether the Razorpay callback signature checked out server-side; softens the
  // success copy when we could not verify (webhook still fulfils either way).
  const [verified, setVerified] = useState(true)
  // 'loading' | 'ready' | 'blocked' - preloaded on mount so a blocked script is
  // known BEFORE any order is created (blocked scripts used to mint a PENDING
  // order per retry click with zero payment attempts behind it).
  const [rzpScript, setRzpScript] = useState<'loading' | 'ready' | 'blocked'>('loading')
  const viewedProduct = useRef<string | null>(null)

  useEffect(() => {
    loadScript(RAZORPAY_SRC).then((ok) => {
      setRzpScript(ok ? 'ready' : 'blocked')
      if (!ok) safeTrack('razorpay_script_blocked')
    })
  }, [])

  useEffect(() => {
    if (!ebook || viewedProduct.current === ebook.id) return
    viewedProduct.current = ebook.id
    safeTrack('checkout_viewed', { product: ebook.id })
  }, [ebook])

  // What you SEE must equal what you PAY. The charge currency/gateway is decided
  // by country (India -> INR/Razorpay, everywhere else -> USD/PayPal), so derive
  // the displayed price from country too -- not from the header display switcher.
  const isIndia = country === 'IN'
  const isExport = country !== '' && !isIndia // an export invoice needs the buyer's name and address
  const priceDisplay = isIndia
    ? `₹${(ebook?.priceINR ?? 899).toLocaleString('en-IN')}`
    : `$${(ebook?.price ?? 9.99).toFixed(2)}`
  const gatewayName = isIndia ? 'Razorpay' : 'PayPal'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!ebook) { setError('No product selected.'); return }
    if (!agree) { setError('Please accept the Terms and Privacy Policy.'); return }
    const currency = country === 'IN' ? 'INR' : 'USD'
    // Busy state covers the script precheck too, so slow networks can't
    // stack repeated clicks while the script is still downloading.
    setLoading(true)
    // For INR the Razorpay script must be loadable BEFORE we create an order,
    // otherwise a blocked script strands a PENDING order per retry.
    if (currency === 'INR' && rzpScript !== 'ready') {
      const ok = await loadScript(RAZORPAY_SRC)
      setRzpScript(ok ? 'ready' : 'blocked')
      if (!ok) { safeTrack('razorpay_script_blocked'); setError(BLOCKED_MSG); setLoading(false); return }
    }
    safeTrack('checkout_submitted', { currency, product: ebook.id })
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: ebook.id, currency, email, name, country, ...(currency === 'INR' ? { state: gstState } : { address }) }),
      })
      const data = await res.json()
      if (!res.ok) {
        safeTrack('checkout_api_failed', { stage: 'response', status: res.status, currency, product: ebook.id })
        setError(data.error || 'Could not start checkout.'); setLoading(false); return
      }

      if (data.gateway === 'razorpay') {
        const ok = await loadScript(RAZORPAY_SRC)
        if (!ok) { safeTrack('razorpay_script_blocked'); setError(BLOCKED_MSG); setLoading(false); return }
        const openedAt = Date.now()
        const rzp = new (window as unknown as { Razorpay: new (o: unknown) => RazorpayInstance }).Razorpay({
          key: data.keyId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          name: 'DevOpsInterview.Cloud',
          description: data.name,
          prefill: { email, name },
          theme: { color: '#2563eb' },
          handler: async (resp: RazorpaySuccess) => {
            safeTrack('payment_window_completed')
            // Show a VERIFIED confirmation, not a raw client callback. Fulfilment
            // stays webhook-driven; this only decides the success-screen copy.
            let ok = false
            try {
              const vres = await fetch('/api/checkout/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resp),
                // A hung verify must not strand the buyer on a dead screen.
                signal: AbortSignal.timeout(10000),
              })
              ok = vres.ok && (await vres.json()).valid === true
            } catch { /* verification unreachable; keep the softer copy */ }
            if (!ok) safeTrack('payment_signature_unverified')
            setVerified(ok)
            setDone(email)
            setLoading(false)
          },
          modal: {
            ondismiss: () => {
              safeTrack('payment_window_dismissed', { elapsedMs: Date.now() - openedAt })
              setLoading(false)
            },
          },
        })
        // A failed attempt otherwise gives zero feedback and zero telemetry; this
        // is the only signal separating "modal broke" from "buyer walked away".
        rzp.on('payment.failed', (resp) => {
          safeTrack('payment_failed', {
            code: resp?.error?.code ?? 'unknown',
            step: resp?.error?.step ?? '',
            reason: resp?.error?.reason ?? '',
          })
          setError(resp?.error?.description || 'The payment failed and you have not been charged. Please try again.')
        })
        rzp.open()
        safeTrack('payment_window_opened')
        // loading stays true while the modal is up (released by handler/ondismiss),
        // so repeat clicks cannot stack checkout windows.
      } else if (data.gateway === 'paypal' && data.approvalUrl) {
        safeTrack('paypal_redirect')
        window.location.href = data.approvalUrl
      } else {
        setError('Payment could not be started.'); setLoading(false)
      }
    } catch {
      safeTrack('checkout_api_failed', { stage: 'network', status: 'unavailable', currency, product: ebook.id })
      setError('Something went wrong. Please try again.'); setLoading(false)
    }
  }

  if (done) {
    return (
      <main id="main" className="pb-16 text-[17px]">
        <div className="wrap pt-10 sm:pt-14">
          <div role="status" className="max-w-[560px] border-2 border-ink bg-sheet p-6 sm:p-8">
            <h1 className="display-2">
              {verified ? 'Payment received' : 'Payment is being confirmed'}
            </h1>
            <p className="mt-4 leading-relaxed text-subtle [overflow-wrap:anywhere]">
              {verified
                ? <>Your download link is on its way to <strong className="text-ink">{done}</strong>. It can take a moment to
                  arrive. Check your inbox (and spam).</>
                : <>Your payment went through and is being confirmed. The download link will arrive
                  at <strong className="text-ink">{done}</strong> shortly - check your inbox (and spam).</>}
            </p>
            <Link href="/" className="btn-primary mt-6">Back to home</Link>
          </div>
        </div>
      </main>
    )
  }

  const style = ebook ? bookStyle(ebook.id) : null

  return (
    <main id="main" className="pb-16 text-[17px]">
      <div className="wrap pt-8 sm:pt-10">
        <header className="pb-8 sm:pb-10">
          <h1 className="display-1">Checkout</h1>
          <p className="mt-4 text-[18px] leading-normal sm:text-[20px]">Complete your purchase and get your ebook by email</p>
        </header>

        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-8 lg:grid-cols-12">
          {/* Order Summary */}
          <section aria-labelledby="summary-heading" className="min-w-0 border-2 border-ink bg-sheet p-5 sm:p-6 lg:col-span-5">
            <h2 id="summary-heading" className="display-3">Order Summary</h2>
            <div className="mt-5 flex gap-4">
              {ebook && (
                <Image
                  src={ebook.coverUrl}
                  alt=""
                  width={1024}
                  height={1536}
                  sizes="72px"
                  className="aspect-[2/3] w-[72px] shrink-0 self-start object-cover"
                />
              )}
              <div className="min-w-0">
                {style && <span className={`chip ${style.fill}`}>{style.label}</span>}
                <h3 className="mt-2 font-semibold leading-snug">{ebookTitle}</h3>
                <p className="mt-1 text-[14px] text-subtle">Format: PDF</p>
              </div>
            </div>
            <dl className="mt-5 border-t-2 border-ink">
              <div className="flex justify-between gap-4 border-b border-hair py-2.5">
                <dt className="text-subtle">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{priceDisplay}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-[18px] font-bold">Total</dt>
                <dd className="price">{priceDisplay}</dd>
              </div>
            </dl>
            <p className="text-[14px] leading-normal text-subtle">
              {country
                ? `You'll be charged ${priceDisplay} via ${gatewayName}${isIndia ? ' (GST-inclusive)' : ''}.`
                : 'Select your country to see the exact amount. India is billed in INR via Razorpay (GST-inclusive); elsewhere in USD via PayPal.'}
            </p>
            <div className="mt-6 border-l-[6px] border-ink bg-paper px-4 py-4">
              <h4 className="font-semibold">What happens after you pay</h4>
              <ul className="mt-2 space-y-1.5 text-[14px] leading-normal">
                <li>A download link is emailed as soon as the payment is confirmed (PDF plus the free Interview-Day Playbook).</li>
                <li>The link stays valid for 3 days; reply to the email to get a fresh one.</li>
                <li>Problems or a duplicate charge? <Link href="/contact" className={inlineLink}>Contact us</Link>. Digital downloads are final once accessed; see the <Link href="/refunds" className={inlineLink}>refund policy</Link>.</li>
              </ul>
            </div>
          </section>

          {/* Checkout Form */}
          <section aria-labelledby="details-heading" className="min-w-0 border-2 border-ink bg-sheet p-5 sm:p-6 lg:col-span-7">
            <h2 id="details-heading" className="display-3">Your details</h2>
            {paypalCancelled && !error && (
              <div role="status" className="mt-5 border-l-[6px] border-ink bg-paper px-4 py-3 text-[15px] leading-normal">
                Your PayPal payment was cancelled - you have not been charged. You can try again below.
              </div>
            )}
            {error && <div role="alert" className="mt-5 border-l-[6px] border-book-red bg-paper px-4 py-3 text-[15px] font-medium leading-normal">{error}</div>}
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="field-label">Email Address *</label>
                <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="field" />
                <p className="field-help">Your download link is sent here.</p>
                <p className="field-error">Enter a valid email address.</p>
              </div>
              <div>
                <label htmlFor="name" className="field-label">Full Name {isExport ? '*' : <span className="font-normal text-subtle">(optional)</span>}</label>
                <input type="text" id="name" required={isExport} value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="field" />
                <p className="field-error">Enter your full name.</p>
              </div>
              <div>
                <label htmlFor="country" className="field-label">Country *</label>
                <select id="country" required value={country} onChange={(e) => setCountry(e.target.value)}
                  className="field">
                  <option value="">Select Country</option>
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option disabled>──────────</option>
                  {countryOptions().filter((c) => c.code !== 'IN' && c.code !== 'US').map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <p className="field-error">Select your country.</p>
              </div>
              {isExport && (
                <div>
                  <label htmlFor="address" className="field-label">Billing address *</label>
                  <textarea id="address" required minLength={5} maxLength={300} rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, city, postal code"
                    className="field" />
                  <p className="field-help">Printed on your invoice.</p>
                  <p className="field-error">Enter your billing address.</p>
                </div>
              )}
              {isIndia && (
                <div>
                  <label htmlFor="gst-state" className="field-label">State *</label>
                  <select id="gst-state" required value={gstState} onChange={(e) => setGstState(e.target.value)}
                    className="field">
                    <option value="">Select State</option>
                    {GST_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                  <p className="field-help">Used for your GST invoice.</p>
                  <p className="field-error">Select your state.</p>
                </div>
              )}
              {isIndia && rzpScript === 'blocked' && (
                <div role="alert" className="border-l-[6px] border-book-red bg-paper px-4 py-3 text-[15px] leading-normal">
                  Your browser is blocking the payment window (usually an ad-blocker).
                  Please allow it for this site or use an incognito window, or{' '}
                  <a href="/contact" className={inlineLink}>contact us</a> for a
                  direct payment link.
                </div>
              )}
              <div className="flex flex-wrap items-start gap-x-3 pt-1">
                <input type="checkbox" id="terms" className="check mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
                <label htmlFor="terms" className="min-w-0 flex-1 text-[15px] leading-normal">
                  I agree to the <a href="/terms" className={inlineLink}>Terms of Service</a> and{' '}
                  <a href="/privacy" className={inlineLink}>Privacy Policy</a>
                </label>
                <p className="field-error basis-full pl-8">Tick the box to accept the Terms and Privacy Policy.</p>
              </div>
              <div className="pt-1">
                <button type="submit" disabled={loading}
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? 'Starting secure checkout…' : country ? `Pay ${priceDisplay} via ${gatewayName}` : 'Pay & get instant access'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <p className="mt-8">
          <Link href="/#ebooks" className={inlineLink}>
            ← Back to Ebooks
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="wrap py-16 text-subtle">Loading…</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
