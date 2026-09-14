import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPost } from '@/lib/blog'
import { siteConfig, truncateMetadataText } from '@/config/site'
import TrackedLink from '@/components/TrackedLink'
import { getContents, productForArticle, sampleHrefFor, totalQuestions, BUNDLE_SLUG } from '@/lib/catalog'

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
    <main id="main" className="container mx-auto px-4 py-12 max-w-3xl">
      <script
        type="application/ld+json"
        // JSON.stringify escaped for safe inline embedding
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />

      <nav className="text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:underline">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{post.title.length > 40 ? post.title.slice(0, 40) + '…' : post.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{post.title}</h1>
          <div className="text-sm text-muted-foreground">
            <time dateTime={post.date}>
              {new Date(post.date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
            </time>
            <span className="mx-2">·</span>
            {post.readingMinutes} min read
          </div>
        </header>

        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>

      <aside className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-6">
        {product && contents ? (
          <>
            <h2 className="text-lg font-semibold mb-2">Preparing for this interview? The matching ebook is {product.title}</h2>
            <p className="text-sm text-slate-700 mb-4">
              {contents.questionCount} questions in {contents.chapters.length} chapters, including {contents.chapters.slice(0, 3).map((c) => c.title).join(', ')}.
              Each question is answered the way a senior engineer would: a 30-second answer, the deep dive, the tradeoffs and the follow-ups.
              Read one full question free before deciding. Every purchase includes the free Interview-Day Playbook.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <TrackedLink href={`/ebooks/${product.slug}`} eventName="blog_cta_clicked" eventProperties={{ destination: 'product', product: product.id, article: post.slug }} className="btn-primary inline-block">
                See the {contents.questionCount} questions
              </TrackedLink>
              <TrackedLink href={sampleHrefFor(product.slug)} eventName="blog_cta_clicked" eventProperties={{ destination: 'sample', product: product.id, article: post.slug }} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
                Read a free sample question
              </TrackedLink>
            </div>
          </>
        ) : product ? (
          <>
            <h2 className="text-lg font-semibold mb-2">Preparing across the whole DevOps stack? Start with the five-book bundle</h2>
            <p className="text-sm text-slate-700 mb-4">
              Cloud, Kubernetes, Terraform, CI/CD and SRE: {totalQuestions} interview questions with worked answers,
              plus the free Interview-Day Playbook. Read eight full questions free before deciding.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <TrackedLink href={`/ebooks/${BUNDLE_SLUG}`} eventName="blog_cta_clicked" eventProperties={{ destination: 'product', product: product.id, article: post.slug }} className="btn-primary inline-block">
                See the bundle
              </TrackedLink>
              <TrackedLink href={sampleHrefFor(BUNDLE_SLUG)} target="_blank" eventName="blog_cta_clicked" eventProperties={{ destination: 'sample', product: product.id, article: post.slug }} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
                Download the free 8-question sample (PDF)
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
            <div className="flex flex-wrap items-center gap-4">
              <TrackedLink href="/ebooks" eventName="blog_cta_clicked" eventProperties={{ destination: 'ebooks', article: post.slug }} className="btn-primary inline-block">Browse the DevOps ebooks</TrackedLink>
            </div>
          </>
        )}
        <p className="mt-4 text-sm">
          <TrackedLink href="/labs" eventName="blog_cta_clicked" eventProperties={{ destination: 'labs', article: post.slug }} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
            Or practice with the free Incident Labs
          </TrackedLink>
        </p>
      </aside>
    </main>
  )
}
