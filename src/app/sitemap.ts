import { MetadataRoute } from 'next'
import ebooksData from '@/data/ebooks.json'
import { getAllPosts } from '@/lib/blog'
import { siteConfig } from '@/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ebooks`,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/labs`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      // Full-page interactive content served by the static SPA rewrite.
      url: `${baseUrl}/labs/token-cost`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/refunds`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/shipping`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    // /checkout is a transactional page; intentionally NOT in the sitemap (and noindex on the page).
  ]

  // Ebook pages. The Interview-Day Playbook is a free bonus, not a listed product,
  // so it is excluded here to match the storefront and structured data.
  const ebookPages = ebooksData
    .filter((ebook) => ebook.slug !== 'interview-day-playbook')
    .map((ebook) => ({
      url: `${baseUrl}/ebooks/${ebook.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

  // Blog: the index plus every post, dated from the post frontmatter so Google
  // sees real lastModified values instead of a moving build timestamp.
  const posts = getAllPosts()
  const blogPages = [
    {
      url: `${baseUrl}/blog`,
      ...(posts.length ? { lastModified: new Date(posts[0].date) } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  return [...staticPages, ...ebookPages, ...blogPages]
}
