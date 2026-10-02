import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TrackedLink from '@/components/TrackedLink'
import { createPageMetadata, siteConfig } from '@/config/site'
import { getContents, getEbook, singleBooks, SAMPLE_PDF, SAMPLE_PDF_QUESTIONS } from '@/lib/catalog'

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
    <main id="main" className="container mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/ebooks" className="hover:underline">Ebooks</Link>
        <span className="mx-2">/</span>
        <Link href={`/ebooks/${slug}`} className="hover:underline">{ebook.title}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Sample question</span>
      </nav>

      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Free sample question</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground md:text-4xl">{ex.question}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {ex.meta} · Chapter {chapterIndex + 1}: {ex.chapter}
        {questionNumber > 0 ? `, question ${questionNumber} of ${chapter.questions.length}` : ''} · from{' '}
        <Link href={`/ebooks/${slug}`} className="text-blue-700 hover:underline">{ebook.title}</Link>
      </p>

      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">What the interviewer is really testing</h2>
        <p className="mt-2 leading-7 text-slate-800">{ex.lens}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-foreground">The 30-second answer</h2>
        <p className="mt-3 leading-8 text-slate-800">{ex.answer30s}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-foreground">Follow-ups the interviewer will probe</h2>
        <dl className="mt-4 space-y-5">
          {ex.followups.map((fu) => (
            <div key={fu.q} className="rounded-lg border border-slate-200 p-4">
              <dt className="font-semibold text-foreground">{fu.q}</dt>
              <dd className="mt-2 leading-7 text-slate-700">{fu.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">Recall hook</h2>
        <p className="mt-2 text-lg font-semibold text-slate-900">&ldquo;{ex.recallHook}&rdquo;</p>
        <p className="mt-2 leading-7 text-slate-800">{ex.recallExpansion}</p>
      </section>

      <section className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-bold text-foreground">What the book adds to this question</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          In the ebook every question runs three pages. Between the 30-second answer and the follow-ups it adds a
          deep dive with a diagram, a decision framework, and a pitfalls-and-signals table. {ebook.title} has{' '}
          {contents.questionCount} questions across {contents.chapters.length} chapters and includes the free
          Interview-Day Playbook.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <TrackedLink
            href={`/checkout?ebook=${ebook.id}`}
            eventName="checkout_started"
            eventProperties={{ product: ebook.id, location: 'sample_page' }}
            className="btn-primary inline-flex items-center justify-center px-6 py-3"
          >
            Buy this ebook
          </TrackedLink>
          <TrackedLink
            href={`/ebooks/${slug}`}
            eventName="product_view_clicked"
            eventProperties={{ product: ebook.id, location: 'sample_page' }}
            className="inline-flex items-center justify-center px-4 py-3 font-semibold text-blue-700 hover:underline"
          >
            See all {contents.questionCount} questions and prices
          </TrackedLink>
        </div>
        <p className="mt-4 text-sm text-slate-700">
          Want full three-page questions?{' '}
          <TrackedLink href={SAMPLE_PDF} target="_blank" eventName="sample_opened" eventProperties={{ location: 'sample_page', product: ebook.id, kind: 'pdf' }} className="font-semibold text-blue-700 hover:underline">
            Download the free {SAMPLE_PDF_QUESTIONS}-question PDF sample
          </TrackedLink>{' '}
          (from Cloud Interview Mastery).
        </p>
      </section>

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-foreground">Sample questions from the other books</h2>
          <ul className="mt-3 space-y-2">
            {others.map((b) => (
              <li key={b.slug}>
                <TrackedLink href={`/samples/${b.slug}`} eventName="sample_opened" eventProperties={{ location: 'sample_page_related', product: b.id, kind: 'html' }} className="text-blue-700 hover:underline">
                  {getContents(b.slug)!.excerpt.question}
                </TrackedLink>
                <span className="text-sm text-muted-foreground"> · {b.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
