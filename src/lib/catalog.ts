/**
 * Catalog helpers shared by the storefront, sample pages and article CTAs.
 * Prices come from src/data/ebooks.json (the same numbers pricing.ts charges).
 * Contents come from src/data/book-contents.json, generated from the built
 * books, so every chapter, question title and excerpt shown on the site is
 * verified source material rather than illustrative copy.
 */
import ebooksData from '@/data/ebooks.json'
import bookContentsData from '@/data/book-contents.json'

export type CatalogEbook = {
  id: string
  slug: string
  title: string
  description: string
  price: number // USD, charged via PayPal outside India
  priceINR: number // INR, GST-inclusive, charged via Razorpay in India
  coverUrl: string
  pageCount: number
  fileSize: string
  tags?: string[]
  category?: string
  isFeatured?: boolean
  isBundle?: boolean
}

export type BookExcerpt = {
  chapter: string
  question: string
  meta: string
  lens: string
  answer30s: string
  followups: { q: string; a: string }[]
  recallHook: string
  recallExpansion: string
}

export type BookContents = {
  source: string
  questionCount: number
  chapters: { title: string; questions: string[] }[]
  excerpt: BookExcerpt
}

export const BUNDLE_SLUG = 'complete-devops-mastery-bundle'
export const PLAYBOOK_SLUG = 'interview-day-playbook'
/** The one downloadable PDF sample: eight complete questions from the Cloud book. */
export const SAMPLE_PDF = '/samples/cloud-interview-mastery-sample.pdf'
export const SAMPLE_PDF_BOOK_SLUG = 'cloud-interview-mastery'
export const SAMPLE_PDF_QUESTIONS = 8

export const ebooks = ebooksData as CatalogEbook[]
const contents = bookContentsData as Record<string, BookContents>

export const singleBooks = ebooks.filter((e) => !e.isBundle && e.slug !== PLAYBOOK_SLUG)
export const bundle = ebooks.find((e) => e.slug === BUNDLE_SLUG) as CatalogEbook

export function getEbook(idOrSlug: string): CatalogEbook | undefined {
  return ebooks.find((e) => e.id === idOrSlug || e.slug === idOrSlug)
}

export function getContents(slug: string): BookContents | undefined {
  return contents[slug]
}

/** Every book's question count comes from the built book, not from marketing copy. */
export const totalQuestions = singleBooks.reduce((n, b) => n + (contents[b.slug]?.questionCount ?? 0), 0)

/**
 * Bundle comparison computed from the catalog in each charged currency. INR and
 * USD are priced independently, so the savings differ by currency and are shown
 * as such rather than as a single "% off" figure.
 */
export function bundleSavings() {
  const separateINR = singleBooks.reduce((n, b) => n + b.priceINR, 0)
  const separateUSD = Math.round(singleBooks.reduce((n, b) => n + b.price, 0) * 100) / 100
  const saveINR = separateINR - bundle.priceINR
  const saveUSD = Math.round((separateUSD - bundle.price) * 100) / 100
  return {
    separateINR,
    separateUSD,
    bundleINR: bundle.priceINR,
    bundleUSD: bundle.price,
    saveINR,
    saveUSD,
    pctINR: Math.round((saveINR / separateINR) * 100),
    pctUSD: Math.round((saveUSD / separateUSD) * 100),
  }
}

/**
 * Topic map: which product an article's reader is most likely preparing for.
 * Articles not listed here fall back to the catalog page.
 */
export const articleProducts: Record<string, string> = {
  'kubernetes-interview-questions-2026': 'container-orchestration-journey',
  'kubernetes-production-debugging-walkthrough': 'container-orchestration-journey',
  'kubernetes-rbac-least-privilege-lockdown': 'container-orchestration-journey',
  'docker-image-optimization-multi-stage-builds': 'container-orchestration-journey',
  'terraform-interview-questions': 'infrastructure-automation-mastery',
  'terraform-mono-repo-20-aws-accounts': 'infrastructure-automation-mastery',
  'aws-azure-gcp-which-certification-first': 'cloud-interview-mastery',
  'devops-interview-preparation-roadmap': BUNDLE_SLUG,
}

export function productForArticle(articleSlug: string): CatalogEbook | undefined {
  const slug = articleProducts[articleSlug]
  return slug ? getEbook(slug) : undefined
}

/** Sample route for a product: the book's own HTML excerpt, or the PDF for the bundle. */
export function sampleHrefFor(slug: string): string {
  return slug === BUNDLE_SLUG || !contents[slug] ? SAMPLE_PDF : `/samples/${slug}`
}
