'use client'

import { createContext, useEffect, useState, type ReactNode } from 'react'
import { detectUserCurrency, CURRENCIES, saveCurrencyPreference } from '@/lib/currency'

export interface CurrencyContextValue {
  currency: string
  isLoading: boolean
  changeCurrency: (code: string) => void
}

// Shared so a single switcher updates EVERY price on the page at once.
export const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<string>('USD')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    detectUserCurrency().then((detected) => {
      if (active) {
        setCurrency(detected)
        setIsLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const changeCurrency = (code: string) => {
    if (CURRENCIES[code]) {
      setCurrency(code)
      saveCurrencyPreference(code)
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, isLoading, changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}
