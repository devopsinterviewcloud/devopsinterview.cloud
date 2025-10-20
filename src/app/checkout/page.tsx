'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const ebookId = searchParams.get('ebook')

  // This would normally fetch ebook details from your data
  // For now, we'll show a placeholder checkout page

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Checkout</h1>
          <p className="text-lg text-muted-foreground">
            Complete your purchase and get instant access to your ebook
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-foreground">Selected Ebook</h3>
                  <p className="text-sm text-muted-foreground">Ebook ID: {ebookId || 'Not selected'}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Formats: PDF, EPUB, MOBI
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹1,999</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600 font-semibold">-₹800</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total</span>
                  <div>
                    <div className="text-right">₹1,199</div>
                    <div className="text-sm text-muted-foreground font-normal">($14.99 USD)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Instant Delivery</h4>
                  <p className="text-sm text-blue-800">
                    You'll receive download links via email within 5-10 minutes after payment
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Payment Details</h2>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Payment Gateway Integration Pending</h4>
                  <p className="text-sm text-amber-800">
                    We are currently integrating with our payment gateway. This checkout page demonstrates the purchase flow for verification purposes.
                  </p>
                </div>
              </div>
            </div>

            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Download links will be sent to this email
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-foreground mb-2">
                  Country *
                </label>
                <select
                  id="country"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Country</option>
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  disabled
                  className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold cursor-not-allowed"
                >
                  Payment Gateway Integration Pending
                </button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Actual payment processing will be available once payment gateway approval is complete
                </p>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1"
                  required
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-foreground mb-3">Accepted Payment Methods</h3>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-2 bg-gray-100 rounded text-sm">💳 Credit Card</div>
                <div className="px-3 py-2 bg-gray-100 rounded text-sm">💳 Debit Card</div>
                <div className="px-3 py-2 bg-gray-100 rounded text-sm">🏦 UPI</div>
                <div className="px-3 py-2 bg-gray-100 rounded text-sm">📱 Wallets</div>
                <div className="px-3 py-2 bg-gray-100 rounded text-sm">🏦 Net Banking</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold text-foreground mb-1">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">
                256-bit SSL encryption
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">↩️</div>
              <h3 className="font-semibold text-foreground mb-1">7-Day Refund</h3>
              <p className="text-sm text-muted-foreground">
                100% money-back guarantee
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-semibold text-foreground mb-1">Instant Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Email delivery within 10 minutes
              </p>
            </div>
          </div>
        </div>

        {/* Back to Ebooks */}
        <div className="text-center mt-8">
          <Link
            href="/#ebooks"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Ebooks
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
