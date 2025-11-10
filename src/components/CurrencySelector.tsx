'use client'

import { useCurrency } from '@/hooks/useCurrency'
import { CURRENCIES } from '@/lib/currency'

export default function CurrencySelector() {
  const { currency, changeCurrency } = useCurrency()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="currency-select" className="text-sm text-muted-foreground">
        Currency:
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => changeCurrency(e.target.value)}
        className="bg-white border border-gray-300 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
      >
        {Object.entries(CURRENCIES).map(([code, config]) => (
          <option key={code} value={code}>
            {config.symbol} {code}
          </option>
        ))}
      </select>
    </div>
  )
}
