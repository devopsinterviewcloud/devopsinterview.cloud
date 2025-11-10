'use client'

import { useCurrency } from '@/hooks/useCurrency'

interface DynamicPriceTextProps {
  usdPrice: number
  prefix?: string
  suffix?: string
}

export function DynamicPriceText({ usdPrice, prefix = '', suffix = '' }: DynamicPriceTextProps) {
  const { formatFromUSD, isLoading } = useCurrency()

  if (isLoading) {
    // Show INR as default during loading for better UX
    const inrPrice = Math.round(usdPrice * 80 / 100) * 100 - 1
    return <span>₹{inrPrice.toLocaleString('en-IN')}</span>
  }

  return (
    <span>
      {prefix}{formatFromUSD(usdPrice)}{suffix}
    </span>
  )
}
