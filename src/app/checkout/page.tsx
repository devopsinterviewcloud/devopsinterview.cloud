'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import ebooksData from '@/data/ebooks.json'

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

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
    s.src = src
    s.onload = () => resolve(true)
    s.onerror = () => { s.remove(); rzpLoader = null; resolve(false) }
    document.body.appendChild(s)
  })
  return rzpLoader
}

const BLOCKED_MSG =
  'Your browser blocked the payment window (usually an ad-blocker or privacy ' +
  'extension). Please allow it for this site or try an incognito window - or ' +
  'contact us and we will send you a direct payment link.'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const ebookId = searchParams.get('ebook')
  const ebook = ebooksData.find((e) => e.id === ebookId)
  const ebookTitle = ebook?.title || 'Selected Ebook'

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  // 'loading' | 'ready' | 'blocked' - preloaded on mount so a blocked script is
  // known BEFORE any order is created (blocked scripts used to mint a PENDING
  // order per retry click with zero payment attempts behind it).
  const [rzpScript, setRzpScript] = useState<'loading' | 'ready' | 'blocked'>('loading')

  useEffect(() => {
    loadScript(RAZORPAY_SRC).then((ok) => {
      setRzpScript(ok ? 'ready' : 'blocked')
      if (!ok) track('razorpay_script_blocked')
    })
  }, [])

  // What you SEE must equal what you PAY. The charge currency/gateway is decided
  // by country (India -> INR/Razorpay, everywhere else -> USD/PayPal), so derive
  // the displayed price from country too -- not from the header display switcher.
  const isIndia = country === 'IN'
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
      if (!ok) { track('razorpay_script_blocked'); setError(BLOCKED_MSG); setLoading(false); return }
    }
    track('checkout_submitted', { currency, product: ebook.id })
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: ebook.id, currency, email, name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not start checkout.'); setLoading(false); return }

      if (data.gateway === 'razorpay') {
        const ok = await loadScript(RAZORPAY_SRC)
        if (!ok) { track('razorpay_script_blocked'); setError(BLOCKED_MSG); setLoading(false); return }
        const rzp = new (window as unknown as { Razorpay: new (o: unknown) => { open: () => void } }).Razorpay({
          key: data.keyId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          name: 'DevOpsInterview.Cloud',
          description: data.name,
          prefill: { email, name },
          theme: { color: '#2563eb' },
          handler: () => { track('payment_window_completed'); setDone(email) },
          modal: { ondismiss: () => track('payment_window_dismissed') },
        })
        rzp.open()
        track('payment_window_opened')
        setLoading(false)
      } else if (data.gateway === 'paypal' && data.approvalUrl) {
        track('paypal_redirect')
        window.location.href = data.approvalUrl
      } else {
        setError('Payment could not be started.'); setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.'); setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white rounded-lg shadow-md p-10">
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment received</h1>
          <p className="text-muted-foreground">
            Your download link is on its way to <strong>{done}</strong>. It can take a moment to
            arrive. Check your inbox (and spam).
          </p>
          <Link href="/" className="inline-block mt-6 text-blue-600 font-medium hover:underline">Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Checkout</h1>
          <p className="text-lg text-muted-foreground">Complete your purchase and get your ebook by email</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-foreground">{ebookTitle}</h3>
                <p className="text-sm text-muted-foreground mt-2">Format: PDF</p>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{priceDisplay}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>{priceDisplay}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {country
                    ? `You'll be charged ${priceDisplay} via ${gatewayName}${isIndia ? ' (GST-inclusive)' : ''}.`
                    : 'Select your country to see the exact amount. India is billed in INR via Razorpay (GST-inclusive); elsewhere in USD via PayPal.'}
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-1">Instant digital delivery</h4>
              <p className="text-sm text-blue-800">A secure download link is emailed as soon as payment is confirmed.</p>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Your details</h2>
            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-800 text-sm p-3 rounded mb-4">{error}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email Address *</label>
                <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-muted-foreground mt-1">Your download link is sent here.</p>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                <input type="text" id="name" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-foreground mb-2">Country *</label>
                <select id="country" required value={country} onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Country</option>
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              {isIndia && rzpScript === 'blocked' && (
                <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-sm p-3 rounded">
                  Your browser is blocking the payment window (usually an ad-blocker).
                  Please allow it for this site or use an incognito window, or{' '}
                  <a href="/contact" className="underline font-medium">contact us</a> for a
                  direct payment link.
                </div>
              )}
              <div className="flex items-start space-x-2 pt-2">
                <input type="checkbox" id="terms" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                </label>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 px-4 rounded-lg font-semibold">
                  {loading ? 'Starting secure checkout…' : country ? `Pay ${priceDisplay} via ${gatewayName}` : 'Pay & get instant access'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/#ebooks" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Ebooks
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
