'use client'

import { useCurrency } from '@/hooks/useCurrency'
import { formatPrice } from '@/lib/currency'

type Savings = {
  separateINR: number; separateUSD: number
  bundleINR: number; bundleUSD: number
  saveINR: number; saveUSD: number
  pctINR: number; pctUSD: number
}

/**
 * Currency-aware bundle comparison. The numbers are the catalog prices that are
 * actually charged in each currency (passed in from the server), so the saving
 * shown always matches the two totals a buyer would see at checkout.
 */
export default function BundleSavings({ savings, className = '' }: { savings: Savings; className?: string }) {
  const { currency, isLoading } = useCurrency()
  const inr = isLoading || currency === 'INR'
  const separate = inr ? formatPrice(savings.separateINR, 'INR') : formatPrice(savings.separateUSD, 'USD')
  const bundlePrice = inr ? formatPrice(savings.bundleINR, 'INR') : formatPrice(savings.bundleUSD, 'USD')
  const save = inr ? formatPrice(savings.saveINR, 'INR') : formatPrice(savings.saveUSD, 'USD')
  const pct = inr ? savings.pctINR : savings.pctUSD
  return (
    <span className={className}>
      Five books separately {separate} · bundle {bundlePrice} · you save {save} ({pct}%)
    </span>
  )
}
