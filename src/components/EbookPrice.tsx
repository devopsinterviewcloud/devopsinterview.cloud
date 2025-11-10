'use client'

import { useCurrency } from '@/hooks/useCurrency'

interface EbookPriceProps {
  usdPrice: number
  originalUsdPrice?: number | null
}

export default function EbookPrice({ usdPrice, originalUsdPrice }: EbookPriceProps) {
  const { formatFromUSD, isLoading, currency } = useCurrency()

  // Show INR as default during loading for better UX in primary market
  if (isLoading) {
    const inrPrice = Math.round(usdPrice * 80 / 100) * 100 - 1
    const originalInrPrice = originalUsdPrice ? Math.round(originalUsdPrice * 80 / 100) * 100 - 1 : null

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">₹{inrPrice.toLocaleString('en-IN')}</span>
          {originalInrPrice && (
            <span className="text-sm text-muted-foreground line-through">₹{originalInrPrice.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    )
  }

  const currentPrice = formatFromUSD(usdPrice)
  const originalPrice = originalUsdPrice ? formatFromUSD(originalUsdPrice) : null

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-foreground">{currentPrice}</span>
        {originalPrice && (
          <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
        )}
      </div>
    </div>
  )
}
