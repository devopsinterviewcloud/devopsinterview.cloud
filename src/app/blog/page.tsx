import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { createPageMetadata } from '@/config/site'

export const metadata: Metadata = createPageMetadata({
  title: 'DevOps Interview Blog | Questions, Answers & Roadmaps',
  description: 'Study real DevOps, Kubernetes, Terraform, and cloud interview questions with worked answers, practical roadmaps, and preparation strategies for senior roles.',
  path: '/blog',
  imageAlt: 'DevOps interview questions, answers, and study roadmaps',
})

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

      <aside className="mb-10 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700">
        Want to practice investigation instead of reading another answer? Try the free{" "}
        <Link href="/labs/token-cost/" className="font-semibold text-blue-700 underline-offset-4 hover:underline">
          token-cost incident troubleshooting lab
        </Link>.
      </aside>

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
