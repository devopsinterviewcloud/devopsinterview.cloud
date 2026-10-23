import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllQuestions, getQuestion, relatedQuestions, categoryLabel, productForCategory } from '@/lib/questions'
import { siteConfig, truncateMetadataText } from '@/config/site'
import TrackedLink from '@/components/TrackedLink'
import { getContents, sampleHrefFor, totalQuestions } from '@/lib/catalog'

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
    <main id="main" className="container mx-auto px-4 py-12 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />

      <nav className="text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/questions" className="hover:underline">Interview Questions</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{question.title.length > 40 ? question.title.slice(0, 40) + '…' : question.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{question.title}</h1>
          <div className="text-sm text-muted-foreground">
            <span>{categoryLabel(question.category)}</span>
            <span className="mx-2">·</span>
            {question.readingMinutes} min read
          </div>
        </header>

        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: question.html }} />

        {question.youtubeId && (
          <p className="mt-6 text-sm text-muted-foreground">
            Prefer it spoken?{' '}
            <TrackedLink
              href={`https://www.youtube.com/watch?v=${question.youtubeId}`}
              target="_blank"
              eventName="questions_cta_clicked"
              eventProperties={{ destination: 'youtube', question: question.slug }}
              className="font-semibold text-blue-700 underline-offset-4 hover:underline"
            >
              Watch the 30-second answer on YouTube
            </TrackedLink>
          </p>
        )}
      </article>

      <aside className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-6">
        {product && contents ? (
          <>
            <h2 className="text-lg font-semibold mb-2">
              Preparing for {categoryLabel(question.category)} interviews? The matching ebook is {product.title}
            </h2>
            <p className="text-sm text-slate-700 mb-4">
              {contents.questionCount} questions in {contents.chapters.length} chapters. Each one is answered the way a
              senior engineer would: a 30-second answer, the deep dive, the tradeoffs and the follow-ups.
              Read a sample answer free before deciding. Every purchase includes the free Interview-Day Playbook.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <TrackedLink href={`/ebooks/${product.slug}`} eventName="questions_cta_clicked" eventProperties={{ destination: 'product', product: product.id, question: question.slug }} className="btn-primary inline-block">
                See the {contents.questionCount} questions
              </TrackedLink>
              <TrackedLink href={sampleHrefFor(product.slug)} eventName="questions_cta_clicked" eventProperties={{ destination: 'sample', product: product.id, question: question.slug }} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
                Read a free sample question
              </TrackedLink>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-2">Preparing for DevOps interviews?</h2>
            <p className="text-sm text-slate-700 mb-4">
              Our five-book series covers cloud, Kubernetes, Terraform, CI/CD and SRE with {totalQuestions} interview
              questions and worked answers. Every purchase includes the free Interview-Day Playbook.
            </p>
            {/* categories mapped to the bundle (it has no single-book contents) go straight to it */}
            {product ? (
              <TrackedLink href={`/ebooks/${product.slug}`} eventName="questions_cta_clicked" eventProperties={{ destination: 'product', product: product.id, question: question.slug }} className="btn-primary inline-block">
                See the five-book bundle
              </TrackedLink>
            ) : (
              <TrackedLink href="/ebooks" eventName="questions_cta_clicked" eventProperties={{ destination: 'ebooks', question: question.slug }} className="btn-primary inline-block">
                Browse the DevOps ebooks
              </TrackedLink>
            )}
          </>
        )}
      </aside>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">More {categoryLabel(question.category)} questions</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/questions/${r.slug}`} className="text-blue-700 underline-offset-4 hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
