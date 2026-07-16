import { MetadataRoute } from 'next'
import ebooksData from '@/data/ebooks.json'
import { getAllPosts } from '@/lib/blog'

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

  // Blog: the index plus every post, dated from the post frontmatter so Google
  // sees real lastModified values instead of a moving build timestamp.
  const posts = getAllPosts()
  const blogPages = [
    {
      url: `${baseUrl}/blog`,
      lastModified: posts.length ? new Date(posts[0].date) : new Date(),
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
