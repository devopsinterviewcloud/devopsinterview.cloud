'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { safeTrack } from '@/lib/analytics'

type Props = ComponentProps<typeof Link> & {
  eventName: string
  eventProperties?: Record<string, string | number | boolean>
}

export default function TrackedLink({ eventName, eventProperties, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        safeTrack(eventName, eventProperties)
        onClick?.(event)
      }}
    />
  )
}
