// Currency detection and conversion utilities.
// We charge in exactly two currencies: INR (India, via Razorpay) and USD
// (everyone else, via PayPal). The switcher and detection expose only these, so
// the displayed currency always matches what we can actually charge.

export interface CurrencyConfig {
  code: string
  symbol: string
  rate: number // Rate relative to USD base price
  locale: string
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    rate: 1,
    locale: 'en-US'
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    rate: 95, // 1 USD ~ 95 INR; keeps display in sync with priceINR (e.g. $9.99 -> ₹899)
    locale: 'en-IN'
  }
}

export async function detectUserCurrency(): Promise<string> {
  // Respect a saved preference first.
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('preferred_currency')
    if (saved && CURRENCIES[saved]) return saved
  }

  // India -> INR, everyone else -> USD.
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (/Kolkata|Calcutta|India/i.test(tz)) return 'INR'
    if (tz) return 'USD'
  } catch {
    // ignore and fall through to geolocation
  }

  // Fallback: IP geolocation (only runs if timezone was unavailable).
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(2000)
    })
    if (response.ok) {
      const data = await response.json()
      return data.country_code === 'IN' ? 'INR' : 'USD'
    }
  } catch {
    // geolocation failed
  }

  return 'USD'
}

export function convertPrice(usdPrice: number, currencyCode: string): number {
  const currency = CURRENCIES[currencyCode]
  if (!currency) return usdPrice

  const converted = usdPrice * currency.rate
  if (currencyCode === 'INR') {
    // Round to nearest x99 (e.g. ₹899, ₹2,999)
    return Math.round(converted / 100) * 100 - 1
  }
  // USD: round to .99
  return Math.round(converted) - 0.01
}

export function formatPrice(price: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode]
  if (!currency) return `$${price.toFixed(2)}`

  if (currencyCode === 'INR') {
    // Indian numbering system
    return `${currency.symbol}${Math.round(price).toLocaleString('en-IN')}`
  }
  return `${currency.symbol}${price.toFixed(2)}`
}

export function saveCurrencyPreference(currencyCode: string): void {
  if (typeof window !== 'undefined' && CURRENCIES[currencyCode]) {
    localStorage.setItem('preferred_currency', currencyCode)
  }
}
