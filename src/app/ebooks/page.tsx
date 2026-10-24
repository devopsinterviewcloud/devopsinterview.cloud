import type { Metadata } from 'next'
import Link from 'next/link'
import EbookPrice from '@/components/EbookPrice'
import ebooksData from '@/data/ebooks.json'
import { createPageMetadata, siteConfig } from '@/config/site'
import { getContents } from '@/lib/catalog'
import { bookStyle, splitTitle, topicLine } from '@/lib/book-style'

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
  isBundle?: boolean
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
    <main id="main" className="pb-16 text-[17px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <div className="wrap">
        <nav className="pt-5 text-[14px] font-medium" aria-label="Breadcrumb">
          <Link href="/" className="underline-offset-4 hover:underline">
            Home
          </Link>
          <span className="mx-2 text-subtle" aria-hidden="true">/</span>
          <span className="text-subtle">Ebooks</span>
        </nav>

        <header className="pt-8 pb-10 sm:pt-10 sm:pb-12">
          <span className="chip">The books</span>
          <h1 className="display-1 mt-5">DevOps Interview Ebooks</h1>
          <p className="mt-5 max-w-[40em] text-[18px] leading-normal sm:text-[20px]">
            Prepare for senior DevOps, SRE, cloud, platform engineering, and
            infrastructure interviews with practical questions and in-depth answers.
          </p>
          <p className="mt-3 text-[15px] text-subtle">
            The free Interview-Day Playbook is included as a bonus.
          </p>
        </header>

        <ol>
          {ebooks.map((ebook) => {
            const style = bookStyle(ebook.id)
            const contents = getContents(ebook.slug)
            const { name } = splitTitle(ebook.title)
            const topic = ebook.isBundle ? '' : topicLine(ebook.title)
            return (
              <li
                key={ebook.slug}
                className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-5 gap-y-4 border-t-2 border-ink py-8 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-x-8 lg:grid-cols-[200px_minmax(0,1fr)_200px]"
              >
                <Link
                  href={`/ebooks/${ebook.slug}`}
                  aria-label={`View ${ebook.title}`}
                  className="self-start sm:row-span-3 lg:row-span-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ebook.coverUrl}
                    alt={`Cover of ${ebook.title}`}
                    width={200}
                    height={300}
                    className="aspect-[2/3] w-full object-cover"
                  />
                </Link>

                <div className="min-w-0">
                  <span className="chip">{style.label}</span>
                  <h2 className="display-3 mt-3 text-[32px] sm:text-[40px]">
                    <Link
                      href={`/ebooks/${ebook.slug}`}
                      className="decoration-2 underline-offset-4 hover:underline"
                    >
                      {ebook.isBundle ? splitTitle(ebook.title).rest : name}
                    </Link>
                  </h2>
                  {topic && <p className="mt-2 text-[16px] font-medium leading-snug text-subtle">{topic}</p>}
                  <p className="meta mt-3 text-subtle">
                    {contents
                      ? `${contents.questionCount} questions · ${contents.chapters.length} chapters · `
                      : ''}
                    PDF · {ebook.pageCount} pages · Instant download
                  </p>
                </div>

                <p className="col-span-2 max-w-[42em] text-[16px] leading-relaxed text-subtle sm:col-span-1 sm:col-start-2">
                  {ebook.description}
                </p>

                <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:col-start-2 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:flex-col lg:items-end lg:justify-start">
                  <EbookPrice
                    usdPrice={ebook.price}
                    originalUsdPrice={ebook.originalPrice ?? null}
                  />
                  <Link href={`/ebooks/${ebook.slug}`} className="btn-primary">
                    View ebook
                  </Link>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </main>
  )
}
