'use client'

import { useEffect } from 'react'

// Simple analytics tracking component
// In production, replace with Google Analytics, Mixpanel, or similar service
export function Analytics() {
  useEffect(() => {
    // Track page views
    const trackPageView = () => {
      // Simple client-side tracking
      const data = {
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        event: 'page_view'
      }

      // Send to analytics endpoint (fire-and-forget)
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {
        // Ignore errors for analytics
      })
    }

    // Track initial page view
    trackPageView()

    // Track navigation changes (for SPA behavior)
    const handleRouteChange = () => {
      setTimeout(trackPageView, 100) // Small delay to ensure URL is updated
    }

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  // Track custom events
  useEffect(() => {
    // Add event listeners for key interactions
    const trackEvent = (eventName: string, data?: Record<string, unknown>) => {
      const eventData = {
        event: eventName,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        ...data
      }

      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      }).catch(() => {
        // Ignore errors for analytics
      })
    }

    // Track button clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const button = target.closest('button')
      if (button) {
        const buttonText = button.textContent?.trim()
        if (buttonText) {
          trackEvent('button_click', { button_text: buttonText })
        }
      }
    }

    // Track link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href) {
        trackEvent('link_click', { 
          href: link.href,
          text: link.textContent?.trim()
        })
      }
    }

    // Track form submissions
    const handleFormSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement
      if (form) {
        trackEvent('form_submit', {
          form_id: form.id || 'unknown',
          action: form.action || 'unknown'
        })
      }
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('click', handleLinkClick)
    document.addEventListener('submit', handleFormSubmit)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('click', handleLinkClick)
      document.removeEventListener('submit', handleFormSubmit)
    }
  }, [])

  // This component renders nothing
  return null
}

// Export tracking function for manual use
export const trackEvent = (eventName: string, data?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return

  const eventData = {
    event: eventName,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    ...data
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  }).catch(() => {
    // Ignore errors for analytics
  })
}