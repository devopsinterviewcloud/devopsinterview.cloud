import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { createPageMetadata } from '@/config/site'
import { productForArticle } from '@/lib/catalog'
import { bookStyle } from '@/lib/book-style'

export const metadata: Metadata = createPageMetadata({
  title: 'DevOps Interview Blog | Questions, Answers & Roadmaps',
  description: 'Study real DevOps, Kubernetes, Terraform, and cloud interview questions with worked answers, practical roadmaps, and preparation strategies for senior roles.',
  path: '/blog',
  imageAlt: 'DevOps interview questions, answers, and study roadmaps',
})

export default function BlogIndexPage() {
  const posts = getAllPosts()
  return (
    <main id="main" className="pb-16 text-[17px]">
      <div className="wrap">
        <nav className="pt-5 text-[14px] font-medium" aria-label="Breadcrumb">
          <Link href="/" className="underline-offset-4 hover:underline">Home</Link>
          <span className="mx-2 text-subtle" aria-hidden="true">/</span>
          <span className="text-subtle">Blog</span>
        </nav>

        <header className="grid gap-x-6 gap-y-6 pt-8 pb-10 sm:pt-10 sm:pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="chip">Blog</span>
            <h1 className="display-1 mt-5">DevOps Interview Blog</h1>
            <p className="mt-5 max-w-[34em] text-[18px] leading-normal sm:text-[20px]">
              Real interview questions, worked answers, and preparation strategy for DevOps, SRE and cloud roles.
            </p>
          </div>
          <aside className="border-2 border-ink bg-sheet p-4 text-[15px] leading-normal sm:p-5 lg:col-span-4 lg:col-start-9">
            Want to practice investigation instead of reading another answer? Try the free{" "}
            <Link href="/labs/token-cost/" className="font-semibold underline underline-offset-4 hover:decoration-2">
              token-cost incident troubleshooting lab
            </Link>.
          </aside>
        </header>

        <ol>
          {posts.map((post) => {
            const product = productForArticle(post.slug)
            const style = bookStyle(product?.id ?? 'bundle')
            return (
              <li key={post.slug}>
                <article className="grid gap-x-6 gap-y-2 border-t-2 border-ink py-6 sm:py-7 lg:grid-cols-12">
                  <p className="meta flex flex-wrap items-center gap-x-2 text-subtle lg:col-span-3">
                    {product && <span className={`size-3 shrink-0 ${style.square}`} aria-hidden="true" />}
                    <time dateTime={post.date}>
                      {new Date(post.date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                    </time>
                    <span>·</span>
                    {post.readingMinutes} min read
                  </p>
                  <div className="lg:col-span-8">
                    <h2 className="text-[22px] font-bold leading-snug tracking-[-0.01em] sm:text-[24px]">
                      <Link href={`/blog/${post.slug}`} className="decoration-2 underline-offset-4 hover:underline">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-2 max-w-[42em] text-[16px] leading-relaxed text-subtle">{post.description}</p>
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </div>
    </main>
  )
}
