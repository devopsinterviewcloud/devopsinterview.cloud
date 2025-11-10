// Currency detection and conversion utilities

export interface CurrencyConfig {
  code: string
  symbol: string
  rate: number // Rate relative to USD base price
  locale: string
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    rate: 80, // Approximate rate: 1 USD = 80 INR
    locale: 'en-IN'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    rate: 1,
    locale: 'en-US'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    rate: 0.92, // Approximate rate: 1 USD = 0.92 EUR
    locale: 'en-EU'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    rate: 0.79, // Approximate rate: 1 USD = 0.79 GBP
    locale: 'en-GB'
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    rate: 1.52, // Approximate rate: 1 USD = 1.52 AUD
    locale: 'en-AU'
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    rate: 1.36, // Approximate rate: 1 USD = 1.36 CAD
    locale: 'en-CA'
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    rate: 1.34, // Approximate rate: 1 USD = 1.34 SGD
    locale: 'en-SG'
  }
}

// Map countries to their currencies
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  CA: 'CAD',
  SG: 'SGD',
  // European countries
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR',
  FR: 'EUR', DE: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR',
  LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR', NL: 'EUR',
  PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR'
}

export async function detectUserCurrency(): Promise<string> {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const savedCurrency = localStorage.getItem('preferred_currency')
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      return savedCurrency
    }
  }

  // Try to detect from timezone/locale
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Timezone-based detection (most reliable for local testing)
    if (timeZone.includes('Kolkata') || timeZone.includes('India') || timeZone.includes('Asia/Calcutta')) {
      return 'INR'
    }
    if (timeZone.includes('London') || timeZone.includes('Europe/London')) {
      return 'GBP'
    }
    if (timeZone.includes('Europe/')) {
      // Most European countries use EUR
      return 'EUR'
    }
    if (timeZone.includes('Australia') || timeZone.includes('Sydney') || timeZone.includes('Melbourne')) {
      return 'AUD'
    }
    if (timeZone.includes('America/Toronto') || timeZone.includes('Canada')) {
      return 'CAD'
    }
    if (timeZone.includes('Singapore')) {
      return 'SGD'
    }
    if (timeZone.includes('America/')) {
      // Most American timezones use USD
      return 'USD'
    }

    // Try to get country from geolocation API (free tier) as fallback
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(2000)
      })
      if (response.ok) {
        const data = await response.json()
        const countryCode = data.country_code
        if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
          return COUNTRY_CURRENCY_MAP[countryCode]
        }
      }
    } catch {
      // Geolocation failed, continue with fallback
    }
  } catch {
    // Detection failed
  }

  // Default to INR for better user experience in primary market
  return 'INR'
}

export function convertPrice(usdPrice: number, currencyCode: string): number {
  const currency = CURRENCIES[currencyCode]
  if (!currency) return usdPrice

  const convertedPrice = usdPrice * currency.rate

  // Round to nearest 99 or 49 for pricing psychology
  if (currencyCode === 'INR') {
    // For INR, round to nearest 99 (e.g., 1999, 2999)
    return Math.round(convertedPrice / 100) * 100 - 1
  } else if (currencyCode === 'USD' || currencyCode === 'EUR' || currencyCode === 'GBP') {
    // For USD/EUR/GBP, round to .99 or .49
    const rounded = Math.round(convertedPrice)
    return rounded - 0.01
  } else {
    // For other currencies, round to nearest 99
    return Math.round(convertedPrice / 100) * 100 - 1
  }
}

export function formatPrice(price: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode]
  if (!currency) return `$${price.toFixed(2)}`

  if (currencyCode === 'INR') {
    // Indian numbering system
    return `${currency.symbol}${Math.round(price).toLocaleString('en-IN')}`
  } else {
    return `${currency.symbol}${price.toFixed(2)}`
  }
}

export function saveCurrencyPreference(currencyCode: string): void {
  if (typeof window !== 'undefined' && CURRENCIES[currencyCode]) {
    localStorage.setItem('preferred_currency', currencyCode)
  }
}
