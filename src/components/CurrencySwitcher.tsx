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
        className="appearance-none cursor-pointer rounded-md border border-slate-300 bg-white py-1.5 pl-2 pr-6 text-xs font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:pl-3 sm:pr-8 sm:text-sm"
      >
        {Object.values(CURRENCIES).map((c) => (
          <option key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 h-4 w-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </label>
  )
}
