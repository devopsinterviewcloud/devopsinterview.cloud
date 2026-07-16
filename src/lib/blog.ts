/**
 * File-based blog: posts live in content/blog/<slug>.md with a small YAML-ish
 * frontmatter block. Everything is read at build time (SSG), so there is no
 * runtime fs access and no client-side markdown parsing.
 *
 * TRUST BOUNDARY: post markdown is repo-committed content authored by us and
 * rendered without HTML sanitisation (marked passes raw HTML through). That is
 * fine ONLY while every .md here goes through code review. If posts ever come
 * from a CMS, user input, or any external source, add an allowlist sanitiser
 * (e.g. sanitize-html) over the rendered output before shipping that change.
 */
import fs from 'fs'
import path from 'path'
import { marked } from 'marked'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string // ISO yyyy-mm-dd (publish date, shown + used in sitemap/JSON-LD)
  keywords: string[]
  readingMinutes: number
  html: string
}

type Frontmatter = Record<string, string>

/**
 * Minimal frontmatter parser: `key: value` lines between --- fences. Values are
 * plain strings; `keywords` is comma-separated. Deliberately not full YAML.
 */
function parseFrontmatter(raw: string): { fm: Frontmatter; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) return { fm: {}, body: raw }
  const fm: Frontmatter = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { fm, body: raw.slice(m[0].length) }
}

function loadPost(file: string): BlogPost {
  const slug = file.replace(/\.md$/, '')
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
  const { fm, body } = parseFrontmatter(raw)
  const words = body.split(/\s+/).length
  return {
    slug,
    title: fm.title ?? slug,
    description: fm.description ?? '',
    date: fm.date ?? '2026-01-01',
    keywords: (fm.keywords ?? '').split(',').map((k) => k.trim()).filter(Boolean),
    readingMinutes: Math.max(1, Math.round(words / 220)),
    html: marked.parse(body, { async: false }) as string,
  }
}

export function getAllPosts(): BlogPost[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(loadPost)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPost(slug: string): BlogPost | null {
  // Slugs come from generateStaticParams, but guard against path tricks anyway.
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  const file = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(file)) return null
  return loadPost(`${slug}.md`)
}
