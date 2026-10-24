'use client'

import { useCurrency } from '@/hooks/useCurrency'
import { CURRENCIES } from '@/lib/currency'

export default function CurrencySwitcher({ className = '' }: { className?: string }) {
  const { currency, changeCurrency } = useCurrency()

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">Currency</span>
      <select
        value={currency}
        onChange={(e) => changeCurrency(e.target.value)}
        aria-label="Select currency"
        className="h-10 cursor-pointer appearance-none border-2 border-ink bg-transparent pl-2 pr-7 text-[14px] font-semibold text-ink hover:bg-highlight sm:pl-3 sm:pr-8 sm:text-[15px]"
      >
        {Object.values(CURRENCIES).map((c) => (
          <option key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 h-4 w-4 text-ink"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    </label>
  )
}
