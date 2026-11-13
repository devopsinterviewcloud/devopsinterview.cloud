'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution'

// Records where this visit came from (see src/lib/attribution.ts). Renders nothing.
export default function SourceCapture() {
  useEffect(() => {
    captureAttribution()
  }, [])
  return null
}
