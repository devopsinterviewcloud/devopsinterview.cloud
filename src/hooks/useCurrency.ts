'use client'

import { useContext, useEffect, useState } from 'react'
import { detectUserCurrency, convertPrice, formatPrice, CURRENCIES, saveCurrencyPreference } from '@/lib/currency'
import { CurrencyContext } from '@/components/CurrencyProvider'

export function useCurrency() {
  // Prefer the shared context (so the currency switcher updates every price at
  // once). Fall back to a local instance if used outside the provider.
  const ctx = useContext(CurrencyContext)

  const [localCurrency, setLocalCurrency] = useState<string>('USD')
  const [localLoading, setLocalLoading] = useState(true)

  useEffect(() => {
    if (ctx) return // context owns the state; no local detection needed
    detectUserCurrency().then((detected) => {
      setLocalCurrency(detected)
      setLocalLoading(false)
    })
  }, [ctx])

  const currency = ctx ? ctx.currency : localCurrency
  const isLoading = ctx ? ctx.isLoading : localLoading
  const changeCurrency = ctx
    ? ctx.changeCurrency
    : (newCurrency: string) => {
        if (CURRENCIES[newCurrency]) {
          setLocalCurrency(newCurrency)
          saveCurrencyPreference(newCurrency)
        }
      }

  const getPrice = (usdPrice: number) => convertPrice(usdPrice, currency)
  const format = (price: number) => formatPrice(price, currency)
  const formatFromUSD = (usdPrice: number) => formatPrice(convertPrice(usdPrice, currency), currency)

  return {
    currency,
    isLoading,
    changeCurrency,
    getPrice,
    format,
    formatFromUSD,
    currencySymbol: CURRENCIES[currency]?.symbol || '$',
    currencyConfig: CURRENCIES[currency],
  }
}
