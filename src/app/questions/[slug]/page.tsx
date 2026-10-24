import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllQuestions, getQuestion, relatedQuestions, categoryLabel, productForCategory } from '@/lib/questions'
import { siteConfig, truncateMetadataText } from '@/config/site'
import TrackedLink from '@/components/TrackedLink'
import { getContents, sampleHrefFor, totalQuestions } from '@/lib/catalog'
import { bookStyle } from '@/lib/book-style'
import BookCallout from '@/components/BookCallout'

const inlineLink = 'font-semibold text-ink underline underline-offset-4 hover:decoration-2'

const SITE_URL = siteConfig.url

export const dynamicParams = false

export function generateStaticParams() {
  return getAllQuestions().map((q) => ({ slug: q.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const question = getQuestion(slug)
  if (!question) return { title: 'Question not found' }
  const url = `${SITE_URL}/questions/${question.slug}`
  const title = truncateMetadataText(question.title, 60)
  const description = truncateMetadataText(question.description)
  const image = `${SITE_URL}${siteConfig.ogImage}`
  return {
    title: { absolute: title },
    description,
    keywords: question.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: question.date,
      modifiedTime: question.date,
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      images: [{ url: image, width: 1200, height: 630, alt: question.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const question = getQuestion(slug)
  if (!question) notFound()
  const product = productForCategory(question.category)
  const contents = product ? getContents(product.slug) : undefined
  const related = relatedQuestions(question)
  const style = bookStyle(product?.id ?? 'bundle')

  const url = `${SITE_URL}/questions/${question.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': url,
    headline: question.title,
    description: question.description,
    datePublished: question.date,
    dateModified: question.date,
    image: `${SITE_URL}${siteConfig.ogImage}`,
    inLanguage: siteConfig.language,
    isAccessibleForFree: true,
    mainEntityOfPage: url,
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Interview Questions', item: `${SITE_URL}/questions` },
      { '@type': 'ListItem', position: 3, name: question.title, item: url },
    ],
  }

  return (
    <main id="main" className="bg-sheet text-[17px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="wrap pt-5 pb-16 sm:pb-20">
        <div className="mx-auto max-w-[680px]">
          <nav className="text-[14px] font-medium" aria-label="Breadcrumb">
            <Link href="/" className="underline-offset-4 hover:underline">Home</Link>
            <span className="mx-2 text-subtle" aria-hidden="true">/</span>
            <Link href="/questions" className="underline-offset-4 hover:underline">Interview Questions</Link>
            <span className="mx-2 text-subtle" aria-hidden="true">/</span>
            <span className="text-subtle">{question.title.length > 40 ? question.title.slice(0, 40) + '…' : question.title}</span>
          </nav>

          <article>
            <header className="pt-8 pb-9 sm:pt-12 sm:pb-10">
              <span className={`chip ${style.fill}`}>{categoryLabel(question.category)}</span>
              <h1 className="display-2 mt-5 text-[40px] sm:text-[56px]">{question.title}</h1>
              <p className="meta mt-5 text-subtle">{question.readingMinutes} min read</p>
            </header>

            <div className="prose-article" dangerouslySetInnerHTML={{ __html: question.html }} />

            {question.youtubeId && (
              <p className="mt-8 border-t border-hair pt-5 text-[16px] text-subtle">
                Prefer it spoken?{' '}
                <TrackedLink
                  href={`https://www.youtube.com/watch?v=${question.youtubeId}`}
                  target="_blank"
                  eventName="questions_cta_clicked"
                  eventProperties={{ destination: 'youtube', question: question.slug }}
                  className={inlineLink}
                >
                  Watch the 30-second answer on YouTube
                </TrackedLink>
              </p>
            )}
          </article>

          <BookCallout book={product} className="mt-10 bg-paper">
            {product && contents ? (
              <>
                <span className="chip">{style.label}</span>
                <h2 className="mt-3 text-[22px] font-bold leading-snug">
                  Preparing for {categoryLabel(question.category)} interviews? The matching ebook is {product.title}
                </h2>
                <p className="mt-2.5 text-[16px] leading-relaxed text-subtle">
                  {contents.questionCount} questions in {contents.chapters.length} chapters. Each one is answered the way a
                  senior engineer would: a 30-second answer, the deep dive, the tradeoffs and the follow-ups.
                  Read a sample answer free before deciding. Every purchase includes the free Interview-Day Playbook.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <TrackedLink href={`/ebooks/${product.slug}`} eventName="questions_cta_clicked" eventProperties={{ destination: 'product', product: product.id, question: question.slug }} className="btn-primary">
                    See the {contents.questionCount} questions
                  </TrackedLink>
                  <TrackedLink href={sampleHrefFor(product.slug)} eventName="questions_cta_clicked" eventProperties={{ destination: 'sample', product: product.id, question: question.slug }} className={inlineLink}>
                    Read a free sample question
                  </TrackedLink>
                </div>
              </>
            ) : (
              <>
                {product && <span className="chip">{style.label}</span>}
                <h2 className={`text-[22px] font-bold leading-snug ${product ? 'mt-3' : ''}`}>Preparing for DevOps interviews?</h2>
                <p className="mt-2.5 text-[16px] leading-relaxed text-subtle">
                  Our five-book series covers cloud, Kubernetes, Terraform, CI/CD and SRE with {totalQuestions} interview
                  questions and worked answers. Every purchase includes the free Interview-Day Playbook.
                </p>
                {/* categories mapped to the bundle (it has no single-book contents) go straight to it */}
                {product ? (
                  <TrackedLink href={`/ebooks/${product.slug}`} eventName="questions_cta_clicked" eventProperties={{ destination: 'product', product: product.id, question: question.slug }} className="btn-primary mt-5">
                    See the five-book bundle
                  </TrackedLink>
                ) : (
                  <TrackedLink href="/ebooks" eventName="questions_cta_clicked" eventProperties={{ destination: 'ebooks', question: question.slug }} className="btn-primary mt-5">
                    Browse the DevOps ebooks
                  </TrackedLink>
                )}
              </>
            )}
          </BookCallout>

          {related.length > 0 && (
            <section className="mt-14 border-t-2 border-ink pt-3.5">
              <h2 className="display-3">More {categoryLabel(question.category)} questions</h2>
              <ul className="mt-3 text-[16px] leading-snug">
                {related.map((r) => (
                  <li key={r.slug} className="border-b border-hair py-2.5">
                    <Link href={`/questions/${r.slug}`} className="underline-offset-4 hover:underline">
                      {r.title}
                    </Link>
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
