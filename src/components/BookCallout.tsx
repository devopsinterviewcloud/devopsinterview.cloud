import Image from 'next/image'
import { bookStyle } from '@/lib/book-style'

type Book = { id: string; coverUrl: string }

// The cover system's book callout: a 6px rule in the book's colour beside the
// cover, ink text and an ink button. Without a book it falls back to ink.
export default function BookCallout({
  book,
  className = '',
  children,
}: {
  book?: Book
  className?: string
  children: React.ReactNode
}) {
  const style = bookStyle(book?.id ?? 'bundle')
  return (
    <aside className={`border-l-[6px] ${style.border} py-6 pr-5 pl-5 sm:pr-7 sm:pl-7 ${className}`}>
      <div className="flex gap-6">
        {book && (
          <Image
            src={book.coverUrl}
            alt=""
            width={1024}
            height={1536}
            sizes="96px"
            className="hidden aspect-[2/3] w-24 shrink-0 self-start object-cover sm:block"
          />
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </aside>
  )
}
