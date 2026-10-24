import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Page Not Found | DevOpsInterview.Cloud' },
  description: 'The page you are looking for could not be found.',
  // Clear inherited index directives; Next.js emits noindex for not-found responses.
  robots: null,
  alternates: { canonical: null },
}

export default function NotFound() {
  return (
    <main id="main" className="pb-16 text-[17px]">
      <div className="wrap pt-10 sm:pt-14">
        <h1 className="font-display text-[120px] leading-[0.85] font-extrabold sm:text-[180px]">
          404
        </h1>

        <div className="mt-6 max-w-[40em]">
          <h2 className="display-2">
            Page Not Found
          </h2>
          <p className="mt-4 text-[18px] leading-normal text-subtle">
            The page you are looking for could not be found.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn-primary">
            Back to Homepage
          </Link>
          <Link href="/#ebooks" className="btn-secondary">
            Browse Ebooks
          </Link>
        </div>

        <div className="mt-12 max-w-[680px] border-t-2 border-ink pt-3.5">
          <h3 className="display-3">Quick Links</h3>
          <ul className="mt-3 flex flex-wrap gap-x-7 gap-y-2 text-[16px] font-semibold">
            <li><Link href="/#ebooks" className="underline-offset-4 hover:underline">Ebooks</Link></li>
            <li><Link href="/#categories" className="underline-offset-4 hover:underline">Categories</Link></li>
            <li><Link href="/contact" className="underline-offset-4 hover:underline">Contact Us</Link></li>
            <li><Link href="/privacy" className="underline-offset-4 hover:underline">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
    </main>
  )
}
