import type { Metadata } from 'next'
import Link from 'next/link'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'Unsubscribe | DevOpsInterview.Cloud' },
  robots: { index: false, follow: false },
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; t?: string; done?: string; error?: string }>
}) {
  const { s, t, done, error } = await searchParams
  const valid = !done && !error && verifyUnsubscribeToken(s, t)

  return (
    <main id="main" className="bg-sheet text-[17px]">
      <div className="mx-auto w-[min(680px,100%_-_32px)] pt-10 pb-20 sm:pt-14">
        <h1 className="display-2 text-[40px] sm:text-[56px]">Unsubscribe</h1>
        {done ? (
          <>
            <p className="mt-6">You&apos;re unsubscribed. You won&apos;t get any more emails from this list.</p>
            <p className="mt-3 text-subtle">If you buy a book later, the receipt and download link still come by email.</p>
          </>
        ) : valid ? (
          <form method="post" action={`/api/unsubscribe?s=${encodeURIComponent(s!)}&t=${encodeURIComponent(t!)}`} className="mt-6">
            <input type="hidden" name="from" value="page" />
            <p>Stop the welcome emails and any future list emails to this address?</p>
            <button type="submit" className="btn-primary mt-6">Unsubscribe</button>
          </form>
        ) : (
          <p className="mt-6">
            This link doesn&apos;t work. Reply to any of our emails, or write to{' '}
            <a href="mailto:devopsinterview.cloud@gmail.com" className="font-semibold underline underline-offset-4">devopsinterview.cloud@gmail.com</a>,
            and we&apos;ll take you off the list by hand.
          </p>
        )}
        <p className="mt-10 text-[15px]">
          <Link href="/" className="underline underline-offset-4">Back to the site</Link>
        </p>
      </div>
    </main>
  )
}
