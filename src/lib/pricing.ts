/**
 * Authoritative, server-side pricing. NEVER trust an amount sent by the client.
 * The catalog source of truth is src/data/ebooks.json.
 *
 * Domestic (India) is charged in INR via Razorpay; international in USD via PayPal.
 * INR prices are GST-INCLUSIVE; the invoice itemises 18% GST (back-calculated).
 */
import ebooksData from '@/data/ebooks.json'

export const GST_RATE = 0.18

type RawEbook = {
  id: string
  slug: string
  title: string
  price: number // USD
  priceINR: number // INR, GST-inclusive
}

const ebooks = ebooksData as RawEbook[]

export type PriceQuote = {
  slug: string
  title: string
  // Razorpay (INR)
  inrAmount: number // rupees, GST-inclusive (what the customer pays)
  inrAmountPaise: number // for Razorpay API
  inrTaxable: number // taxable value (ex-GST)
  inrGst: number // 18% GST component
  // PayPal (USD)
  usdAmount: number // dollars
  usdAmountString: string // "24.99" for PayPal API
}

/** Look up a product by its json id OR slug. Returns null if unknown. */
export function getProduct(idOrSlug: string): RawEbook | null {
  return ebooks.find((e) => e.id === idOrSlug || e.slug === idOrSlug) ?? null
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function quote(idOrSlug: string): PriceQuote | null {
  const e = getProduct(idOrSlug)
  if (!e) return null
  const inrAmount = round2(e.priceINR)
  const inrTaxable = round2(inrAmount / (1 + GST_RATE))
  const inrGst = round2(inrAmount - inrTaxable)
  const usdAmount = round2(e.price)
  return {
    slug: e.slug,
    title: e.title,
    inrAmount,
    inrAmountPaise: Math.round(inrAmount * 100),
    inrTaxable,
    inrGst,
    usdAmount,
    usdAmountString: usdAmount.toFixed(2),
  }
}

export type Gateway = 'razorpay' | 'paypal'

/** Domestic (INR) → Razorpay; everything else → PayPal. */
export function gatewayForCurrency(currency: string): Gateway {
  return currency?.toUpperCase() === 'INR' ? 'razorpay' : 'paypal'
}
