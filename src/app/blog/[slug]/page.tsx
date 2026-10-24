import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPost } from '@/lib/blog'
import { siteConfig, truncateMetadataText } from '@/config/site'
import TrackedLink from '@/components/TrackedLink'
import { getContents, productForArticle, sampleHrefFor, totalQuestions, BUNDLE_SLUG } from '@/lib/catalog'
import { YOUTUBE_URL } from '@/lib/podcast'
import { bookStyle, topicLine } from '@/lib/book-style'
import BookCallout from '@/components/BookCallout'

const inlineLink = 'font-semibold text-ink underline underline-offset-4 hover:decoration-2'

const SITE_URL = siteConfig.url

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: 'Post not found' }
  const url = `${SITE_URL}/blog/${post.slug}`
  const title = truncateMetadataText(post.title, 60)
  const description = truncateMetadataText(post.description)
  const image = `${SITE_URL}${siteConfig.ogImage}`
  return {
    title: { absolute: title },
    description,
    keywords: post.keywords,
    alternates: {
      canonical: url,
      types: { 'application/rss+xml': `${SITE_URL}/feed.xml` },
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.date,
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()
  const product = productForArticle(post.slug)
  const contents = product ? getContents(product.slug) : undefined
  const style = bookStyle(product?.id ?? 'bundle')
  const topic = product && !product.isBundle ? topicLine(product.title) : 'Blog'

  const url = `${SITE_URL}/blog/${post.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': url,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
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
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  }

  return (
    <main id="main" className="bg-sheet text-[17px]">
      <script
        type="application/ld+json"
        // JSON.stringify escaped for safe inline embedding
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
            <Link href="/blog" className="underline-offset-4 hover:underline">Blog</Link>
            <span className="mx-2 text-subtle" aria-hidden="true">/</span>
            <span className="text-subtle">{post.title.length > 40 ? post.title.slice(0, 40) + '…' : post.title}</span>
          </nav>

          <article>
            <header className="pt-8 pb-9 sm:pt-12 sm:pb-10">
              <span className={`chip ${style.fill}`}>{topic}</span>
              <h1 className="display-2 mt-5 text-[40px] sm:text-[56px]">{post.title}</h1>
              <p className="meta mt-5 text-subtle">
                <time dateTime={post.date}>
                  {new Date(post.date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </time>
                <span className="mx-2">·</span>
                {post.readingMinutes} min read
              </p>
            </header>

            <div className="prose-article" dangerouslySetInnerHTML={{ __html: post.html }} />
          </article>

          <p className="mt-12 border-t border-hair pt-5 text-[16px] leading-relaxed text-subtle">
            Prefer to watch or listen? Answers like these are walked through on{' '}
            <TrackedLink href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" eventName="blog_channel_clicked" eventProperties={{ destination: 'youtube', article: post.slug }} className={inlineLink}>YouTube</TrackedLink>{' '}
            and on the{' '}
            <TrackedLink href="/podcast" eventName="blog_channel_clicked" eventProperties={{ destination: 'podcast', article: post.slug }} className={inlineLink}>podcast</TrackedLink>,
            on Spotify and Amazon Music.
          </p>

          <BookCallout book={product} className="mt-10 bg-paper">
            {product && contents ? (
              <>
                <span className="chip">{style.label}</span>
                <h2 className="mt-3 text-[22px] font-bold leading-snug">Preparing for this interview? The matching ebook is {product.title}</h2>
                <p className="mt-2.5 text-[16px] leading-relaxed text-subtle">
                  {contents.questionCount} questions in {contents.chapters.length} chapters, including {contents.chapters.slice(0, 3).map((c) => c.title).join(', ')}.
                  Each question is answered the way a senior engineer would: a 30-second answer, the deep dive, the tradeoffs and the follow-ups.
                  Read a sample answer free before deciding. Every purchase includes the free Interview-Day Playbook.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <TrackedLink href={`/ebooks/${product.slug}`} eventName="blog_cta_clicked" eventProperties={{ destination: 'product', product: product.id, article: post.slug }} className="btn-primary">
                    See the {contents.questionCount} questions
                  </TrackedLink>
                  <TrackedLink href={sampleHrefFor(product.slug)} eventName="blog_cta_clicked" eventProperties={{ destination: 'sample', product: product.id, article: post.slug }} className={inlineLink}>
                    Read a free sample question
                  </TrackedLink>
                </div>
              </>
            ) : product ? (
              <>
                <span className="chip">{style.label}</span>
                <h2 className="mt-3 text-[22px] font-bold leading-snug">Preparing across the whole DevOps stack? Start with the five-book bundle</h2>
                <p className="mt-2.5 text-[16px] leading-relaxed text-subtle">
                  Cloud, Kubernetes, Terraform, CI/CD and SRE: {totalQuestions} interview questions with worked answers,
                  plus the free Interview-Day Playbook. Read eight full questions free before deciding.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <TrackedLink href={`/ebooks/${BUNDLE_SLUG}`} eventName="blog_cta_clicked" eventProperties={{ destination: 'product', product: product.id, article: post.slug }} className="btn-primary">
                    See the bundle
                  </TrackedLink>
                  <TrackedLink href={sampleHrefFor(BUNDLE_SLUG)} target="_blank" eventName="blog_cta_clicked" eventProperties={{ destination: 'sample', product: product.id, article: post.slug }} className={inlineLink}>
                    Download the free 8-question sample (PDF)
                  </TrackedLink>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-[22px] font-bold leading-snug">Preparing for DevOps interviews?</h2>
                <p className="mt-2.5 text-[16px] leading-relaxed text-subtle">
                  Our five-book series covers cloud, Kubernetes, Terraform, CI/CD and SRE with {totalQuestions} interview
                  questions and worked answers. Every purchase includes the free Interview-Day Playbook.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <TrackedLink href="/ebooks" eventName="blog_cta_clicked" eventProperties={{ destination: 'ebooks', article: post.slug }} className="btn-primary">Browse the DevOps ebooks</TrackedLink>
                </div>
              </>
            )}
            <p className="mt-5 text-[15px]">
              <TrackedLink href="/labs" eventName="blog_cta_clicked" eventProperties={{ destination: 'labs', article: post.slug }} className={inlineLink}>
                Or practice with the free Incident Labs
              </TrackedLink>
            </p>
          </BookCallout>
        </div>
      </div>
    </main>
  )
}
