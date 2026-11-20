'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { safeTrack } from '@/lib/analytics'

type Props = ComponentProps<typeof Link> & {
  eventName: string
  eventProperties?: Record<string, string | number | boolean>
}

export default function TrackedLink({ eventName, eventProperties, onClick, ...props }: Props) {
  // A file (the sample PDF) isn't a route: prefetching it requests it as a page and gets a 404.
  const isFile = typeof props.href === 'string' && /\.[a-z0-9]+$/i.test(props.href.split(/[?#]/)[0])
  return (
    <Link
      {...props}
      prefetch={isFile ? false : props.prefetch}
      onClick={(event) => {
        safeTrack(eventName, eventProperties)
        onClick?.(event)
      }}
    />
  )
}
