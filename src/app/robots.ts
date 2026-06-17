import type { MetadataRoute } from 'next'

const SITE = 'https://devopsinterview.cloud'

// We WANT to be discoverable in AI answer engines (ChatGPT, Claude, Perplexity,
// Gemini) as well as classic search, so the AI crawlers are explicitly allowed.
// Private/transactional paths are disallowed for everyone.
export default function robots(): MetadataRoute.Robots {
  const aiCrawlers = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', // OpenAI / ChatGPT search
    'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', // Anthropic / Claude
    'PerplexityBot', 'Perplexity-User', // Perplexity
    'Google-Extended', // Google Gemini / Vertex
    'Applebot-Extended', // Apple Intelligence
    'CCBot', // Common Crawl (feeds many models)
  ]
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/checkout', '/_next/'],
      },
      {
        userAgent: aiCrawlers,
        allow: '/',
        disallow: ['/api/', '/admin/', '/checkout'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
