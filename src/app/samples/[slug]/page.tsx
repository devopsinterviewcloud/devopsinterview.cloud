import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TrackedLink from '@/components/TrackedLink'
import { createPageMetadata, siteConfig } from '@/config/site'
import { getContents, getEbook, singleBooks, SAMPLE_PDF, SAMPLE_PDF_QUESTIONS } from '@/lib/catalog'
import { bookStyle } from '@/lib/book-style'
import BookCallout from '@/components/BookCallout'

const inlineLink = 'font-semibold text-ink underline underline-offset-4 hover:decoration-2'
const sectionHeading = 'display-3 border-t-2 border-ink pt-3.5'

// One real question per book, taken verbatim from the built ebook. Nothing here is
// composed for the website: the question, the interviewer lens, the 30-second
// answer, the follow-ups and the recall hook are the book's own text.
export const dynamicParams = false

export function generateStaticParams() {
  return singleBooks.filter((b) => getContents(b.slug)).map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ebook = getEbook(slug)
  const contents = getContents(slug)
  if (!ebook || !contents) return {}
  return createPageMetadata({
    title: `Sample question from ${ebook.title} | DevOpsInterview.Cloud`,
    description: `Read one complete interview question from ${ebook.title}: ${contents.excerpt.question}`,
    path: `/samples/${slug}`,
    image: ebook.coverUrl,
    imageAlt: `Cover of ${ebook.title}`,
    type: 'article',
  })
}

export default async function SamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ebook = getEbook(slug)
  const contents = getContents(slug)
  if (!ebook || !contents) notFound()
  const ex = contents.excerpt
  const chapterIndex = contents.chapters.findIndex((c) => c.title === ex.chapter)
  const chapter = contents.chapters[chapterIndex]
  const questionNumber = chapter ? chapter.questions.indexOf(ex.question) + 1 : 0
  const others = singleBooks.filter((b) => b.slug !== slug && getContents(b.slug))
  const style = bookStyle(ebook.id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Sample question from ${ebook.title}`,
    description: ex.question,
    url: `${siteConfig.url}/samples/${slug}`,
    isPartOf: { '@type': 'Book', name: ebook.title, url: `${siteConfig.url}/ebooks/${slug}` },
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
  }

  return (
    <main id="main" className="bg-sheet text-[17px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <div className="wrap pt-5 pb-16 sm:pb-20">
        <div className="mx-auto max-w-[680px]">
          <nav className="text-[14px] font-medium" aria-label="Breadcrumb">
            <Link href="/" className="underline-offset-4 hover:underline">Home</Link>
            <span className="mx-2 text-subtle" aria-hidden="true">/</span>
            <Link href="/ebooks" className="underline-offset-4 hover:underline">Ebooks</Link>
            <span className="mx-2 text-subtle" aria-hidden="true">/</span>
            <Link href={`/ebooks/${slug}`} className="underline-offset-4 hover:underline">{ebook.title}</Link>
            <span className="mx-2 text-subtle" aria-hidden="true">/</span>
            <span className="text-subtle">Sample question</span>
          </nav>

          <header className="pt-8 pb-9 sm:pt-12 sm:pb-10">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className={`chip ${style.fill}`}>From {style.label}{chapterIndex >= 0 ? `, Ch. ${chapterIndex + 1}` : ''}</span>
              <p className="meta text-subtle">Free sample question</p>
            </div>
            <h1 className="display-2 mt-5 text-[40px] sm:text-[56px]">{ex.question}</h1>
            <p className="mt-5 text-[15px] leading-normal text-subtle">
              {ex.meta} · Chapter {chapterIndex + 1}: {ex.chapter}
              {questionNumber > 0 ? `, question ${questionNumber} of ${chapter.questions.length}` : ''} · from{' '}
              <Link href={`/ebooks/${slug}`} className={inlineLink}>{ebook.title}</Link>
            </p>
          </header>

          <section className="bg-paper px-5 py-5 sm:px-6">
            <h2 className="meta text-subtle">What the interviewer is really testing</h2>
            <p className="mt-2 text-[18px] leading-relaxed">{ex.lens}</p>
          </section>

          <section className="mt-12">
            <h2 className={sectionHeading}>The 30-second answer</h2>
            <p className="mt-4 text-[18px] leading-relaxed">{ex.answer30s}</p>
          </section>

          <section className="mt-12">
            <h2 className={sectionHeading}>Follow-ups the interviewer will probe</h2>
            <dl className="mt-4">
              {ex.followups.map((fu) => (
                <div key={fu.q} className="border-b border-hair py-4 first:pt-1">
                  <dt className="text-[18px] font-semibold leading-snug">{fu.q}</dt>
                  <dd className="mt-2 text-[17px] leading-relaxed">{fu.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-12">
            <h2 className={sectionHeading}>Recall hook</h2>
            <p className="mt-4 text-[20px] font-semibold leading-normal">
              <span className="bg-highlight px-1.5 py-0.5 [box-decoration-break:clone]">&ldquo;{ex.recallHook}&rdquo;</span>
            </p>
            <p className="mt-3 text-[18px] leading-relaxed">{ex.recallExpansion}</p>
          </section>

          <BookCallout book={ebook} className="mt-14 bg-paper">
            <span className="chip">{style.label}</span>
            <h2 className="mt-3 text-[22px] font-bold leading-snug">What the book adds to this question</h2>
            <p className="mt-2.5 text-[16px] leading-relaxed text-subtle">
              In the ebook every question runs three pages. Between the 30-second answer and the follow-ups it adds a
              deep dive with a diagram, a decision framework, and a pitfalls-and-signals table. {ebook.title} has{' '}
              {contents.questionCount} questions across {contents.chapters.length} chapters and includes the free
              Interview-Day Playbook.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
              <TrackedLink
                href={`/checkout?ebook=${ebook.id}`}
                eventName="checkout_started"
                eventProperties={{ product: ebook.id, location: 'sample_page' }}
                className="btn-primary"
              >
                Buy this ebook
              </TrackedLink>
              <TrackedLink
                href={`/ebooks/${slug}`}
                eventName="product_view_clicked"
                eventProperties={{ product: ebook.id, location: 'sample_page' }}
                className={inlineLink}
              >
                See all {contents.questionCount} questions and prices
              </TrackedLink>
            </div>
            <p className="mt-5 text-[15px] text-subtle">
              Want full three-page questions?{' '}
              <TrackedLink href={SAMPLE_PDF} target="_blank" eventName="sample_opened" eventProperties={{ location: 'sample_page', product: ebook.id, kind: 'pdf' }} className={inlineLink}>
                Download the free {SAMPLE_PDF_QUESTIONS}-question PDF sample
              </TrackedLink>{' '}
              (from Cloud Platforms).
            </p>
          </BookCallout>

          {others.length > 0 && (
            <section className="mt-14">
              <h2 className={sectionHeading}>Sample questions from the other books</h2>
              <ul className="mt-3 text-[16px] leading-snug">
                {others.map((b) => (
                  <li key={b.slug} className="flex gap-3 border-b border-hair py-3">
                    <span className={`mt-[5px] size-3 shrink-0 ${bookStyle(b.id).square}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <TrackedLink href={`/samples/${b.slug}`} eventName="sample_opened" eventProperties={{ location: 'sample_page_related', product: b.id, kind: 'html' }} className="font-semibold underline-offset-4 hover:underline">
                        {getContents(b.slug)!.excerpt.question}
                      </TrackedLink>
                      <span className="text-[14px] text-subtle"> · {b.title}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
