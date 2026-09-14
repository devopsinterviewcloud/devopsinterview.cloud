'use client'

import { Analytics } from '@vercel/analytics/react'
import { redactAnalyticsUrl } from '@/lib/analytics'

export default function SiteAnalytics() {
  return <Analytics beforeSend={redactAnalyticsUrl} />
}
