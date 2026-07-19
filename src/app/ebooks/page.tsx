import type { Metadata } from 'next'
import Link from 'next/link'
import EbookPrice from '@/components/EbookPrice'
import ebooksData from '@/data/ebooks.json'
import { createPageMetadata, siteConfig } from '@/config/site'

const SITE_URL = siteConfig.url

type Ebook = {
  id: string
  slug: string
  title: string
  description: string
  price: number
  originalPrice?: number | null
  coverUrl: string
  pageCount: number
  category?: string
}

const ebooks = (ebooksData as Ebook[]).filter(
  (ebook) => ebook.slug !== 'interview-day-playbook',
)

export const metadata: Metadata = createPageMetadata({
  title: 'DevOps Interview Ebooks | Cloud, Kubernetes, SRE',
  description: 'Explore senior DevOps interview ebooks covering AWS, Azure, GCP, Kubernetes, Terraform, CI/CD, GitOps, SRE, observability, security, and reliability.',
  path: '/ebooks',
  imageAlt: 'DevOps and cloud interview ebook collection',
})

export default function EbooksPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'DevOps Interview Ebooks',
    numberOfItems: ebooks.length,
    itemListElement: ebooks.map((ebook, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: ebook.title,
      url: `${SITE_URL}/ebooks/${ebook.slug}`,
    })),
  }

  return (
    <main id="main" className="container mx-auto px-4 py-12 max-w-5xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <nav
        className="text-sm text-muted-foreground mb-8"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Ebooks</span>
      </nav>

      <h1 className="text-4xl font-bold mb-3">DevOps Interview Ebooks</h1>
      <p className="text-muted-foreground mb-3 max-w-3xl">
        Prepare for senior DevOps, SRE, cloud, platform engineering, and
        infrastructure interviews with practical questions and in-depth answers.
      </p>
      <p className="text-sm text-muted-foreground mb-10">
        The free Interview-Day Playbook is included as a bonus.
      </p>

      <div className="space-y-8">
        {ebooks.map((ebook) => (
          <article
            key={ebook.slug}
            className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="grid gap-6 sm:grid-cols-[140px_1fr]">
              <Link
                href={`/ebooks/${ebook.slug}`}
                aria-label={`View ${ebook.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ebook.coverUrl}
                  alt={`Cover of ${ebook.title}`}
                  width={140}
                  height={210}
                  className="w-full max-w-[140px] rounded-lg border shadow-sm"
                />
              </Link>

              <div>
                {ebook.category && (
                  <span className="inline-block text-xs font-semibold uppercase tracking-wide text-blue-700 bg-blue-100 rounded-full px-3 py-1 mb-3">
                    {ebook.category}
                  </span>
                )}

                <h2 className="text-xl font-semibold mb-2">
                  <Link
                    href={`/ebooks/${ebook.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {ebook.title}
                  </Link>
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                  {ebook.description}
                </p>

                <div className="mb-4">
                  <EbookPrice
                    usdPrice={ebook.price}
                    originalUsdPrice={ebook.originalPrice ?? null}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link
                    href={`/ebooks/${ebook.slug}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View ebook
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    PDF · {ebook.pageCount} pages · Instant download
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
