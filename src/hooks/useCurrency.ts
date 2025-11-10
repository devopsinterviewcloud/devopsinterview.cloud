'use client'

import { useState, useEffect } from 'react'
import { detectUserCurrency, convertPrice, formatPrice, CURRENCIES, saveCurrencyPreference } from '@/lib/currency'

export function useCurrency() {
  const [currency, setCurrency] = useState<string>('USD')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function initCurrency() {
      const detectedCurrency = await detectUserCurrency()
      setCurrency(detectedCurrency)
      setIsLoading(false)
    }
    initCurrency()
  }, [])

  const changeCurrency = (newCurrency: string) => {
    if (CURRENCIES[newCurrency]) {
      setCurrency(newCurrency)
      saveCurrencyPreference(newCurrency)
    }
  }

  const getPrice = (usdPrice: number) => {
    return convertPrice(usdPrice, currency)
  }

  const format = (price: number) => {
    return formatPrice(price, currency)
  }

  const formatFromUSD = (usdPrice: number) => {
    const convertedPrice = convertPrice(usdPrice, currency)
    return formatPrice(convertedPrice, currency)
  }

  return {
    currency,
    isLoading,
    changeCurrency,
    getPrice,
    format,
    formatFromUSD,
    currencySymbol: CURRENCIES[currency]?.symbol || '$',
    currencyConfig: CURRENCIES[currency]
  }
}
