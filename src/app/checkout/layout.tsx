import type { Metadata } from 'next'
import { createPageMetadata } from '@/config/site'

// Transactional page: keep it out of search indexes.
export const metadata: Metadata = createPageMetadata({
  title: 'Secure Ebook Checkout | DevOpsInterview.Cloud',
  description: 'Complete your DevOpsInterview.Cloud ebook purchase securely and receive your PDF download links by email after payment confirmation.',
  path: '/checkout',
  robots: { index: false, follow: false },
})

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
