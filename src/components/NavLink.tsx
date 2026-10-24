'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

// Marks the link for the current section so the nav can underline it.
export default function NavLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname()
  const current = !href.includes('#') && (pathname === href || pathname.startsWith(`${href}/`))
  return <Link href={href} aria-current={current ? 'page' : undefined} {...props} />
}
