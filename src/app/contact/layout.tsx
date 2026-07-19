import { Metadata } from 'next'
import { createPageMetadata } from '@/config/site'

export const metadata: Metadata = createPageMetadata({
  title: 'Contact DevOpsInterview.Cloud | Support & Inquiries',
  description: 'Contact DevOpsInterview.Cloud for ebook support, download help, team pricing, partnerships, or questions about DevOps and cloud interview resources.',
  path: '/contact',
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
