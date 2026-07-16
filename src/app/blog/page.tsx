import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

const SITE_URL = 'https://devopsinterview.cloud'

export const metadata: Metadata = {
  title: 'DevOps Interview Blog | DevOpsInterview.Cloud',
  description:
    'Real DevOps, Kubernetes, Terraform and cloud interview questions with worked answers, study roadmaps, and preparation strategy from DevOpsInterview.Cloud.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'DevOps Interview Blog | DevOpsInterview.Cloud',
    description:
      'Real DevOps, Kubernetes, Terraform and cloud interview questions with worked answers and study roadmaps.',
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()
  return (
    <main id="main" className="container mx-auto px-4 py-12 max-w-3xl">
      <nav className="text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Blog</span>
      </nav>

      <h1 className="text-4xl font-bold mb-3">DevOps Interview Blog</h1>
      <p className="text-muted-foreground mb-10">
        Real interview questions, worked answers, and preparation strategy for DevOps, SRE and cloud roles.
      </p>

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-muted-foreground mb-3">{post.description}</p>
            <div className="text-xs text-muted-foreground">
              <time dateTime={post.date}>
                {new Date(post.date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
              </time>
              <span className="mx-2">·</span>
              {post.readingMinutes} min read
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
