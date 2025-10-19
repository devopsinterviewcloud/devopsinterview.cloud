'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    // Set initial state
    setIsOnline(navigator.onLine)

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showOfflineMessage) return null

  return (
    <div 
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-orange-100 border border-orange-200 rounded-lg px-4 py-2 shadow-lg"
      role="alert"
      aria-live="polite"
      aria-label={isOnline ? "Connection restored" : "No internet connection"}
    >
      <div className="flex items-center gap-2 text-sm">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span className="text-green-800">Connection restored</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-orange-600" aria-hidden="true" />
            <span className="text-orange-800">
              You're offline. Some features may not work.
            </span>
          </>
        )}
      </div>
    </div>
  )
}