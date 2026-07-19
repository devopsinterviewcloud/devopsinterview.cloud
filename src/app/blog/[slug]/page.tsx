import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPost } from '@/lib/blog'
import { siteConfig, truncateMetadataText } from '@/config/site'

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
        <h2 className="text-lg font-semibold mb-2">Preparing for DevOps interviews?</h2>
        <p className="text-sm text-slate-700 mb-4">
          Our five-book series covers cloud, Kubernetes, Terraform, CI/CD and SRE with 250+ real interview
          questions and worked answers. Every purchase includes the free Interview-Day Playbook.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/ebooks" className="btn-primary inline-block">Browse the DevOps ebooks</Link>
          <Link href="/labs" className="font-semibold text-blue-700 underline-offset-4 hover:underline">
            Practice with Incident Labs
          </Link>
        </div>
      </aside>
    </main>
  )
}
