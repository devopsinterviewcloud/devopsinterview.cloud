import { MetadataRoute } from 'next'
import ebooksData from '@/data/ebooks.json'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://devopsinterview.cloud'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refunds`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
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
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...ebookPages]
}
