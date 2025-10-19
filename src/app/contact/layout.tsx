import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - DevopsInterview.Cloud',
  description: 'Get in touch with DevopsInterview.Cloud for support, partnership inquiries, or questions about our DevOps and Cloud ebooks. We respond within 24 hours.',
  openGraph: {
    title: 'Contact Us - DevopsInterview.Cloud',
    description: 'Get in touch with DevopsInterview.Cloud for support and inquiries.',
    url: 'https://devopsinterview.cloud/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
