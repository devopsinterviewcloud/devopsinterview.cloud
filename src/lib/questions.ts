/**
 * File-based interview Q&A pages: one question per content/questions/<slug>.md
 * with the same minimal frontmatter format as the blog (see lib/blog.ts). Same
 * trust boundary applies: repo-committed, code-reviewed markdown only.
 */
import fs from 'fs'
import path from 'path'
import { marked } from 'marked'
import { getEbook, BUNDLE_SLUG, type CatalogEbook } from '@/lib/catalog'

const QUESTIONS_DIR = path.join(process.cwd(), 'content', 'questions')

export type Question = {
  slug: string
  title: string
  description: string
  date: string // ISO yyyy-mm-dd
  keywords: string[]
  category: string
  youtubeId: string | null
  readingMinutes: number
  html: string
}

export const categoryLabels: Record<string, string> = {
  aws: 'AWS',
  azure: 'Azure',
  career: 'Career',
  cicd: 'CI/CD',
  compliance: 'Compliance',
  config_mgmt: 'Configuration Management',
  devsecops: 'DevSecOps',
  docker: 'Docker',
  finops: 'FinOps',
  gcp: 'GCP',
  gitops: 'GitOps',
  iac: 'Infrastructure as Code',
  kubernetes: 'Kubernetes',
  linux: 'Linux',
  microservices: 'Microservices',
  mlops: 'MLOps',
  networking: 'Networking',
  observability: 'Observability',
  platform_eng: 'Platform Engineering',
  scenario: 'Scenario-Based',
  sre: 'SRE',
  terraform: 'Terraform',
}

export function categoryLabel(category: string): string {
  return categoryLabels[category] ?? category
}

// Which book a category's CTA points at. Categories outside any single book's
// scope get the senior handbook; the index page itself pitches the bundle.
const categoryProducts: Record<string, string> = {
  kubernetes: 'container-orchestration-journey',
  docker: 'container-orchestration-journey',
  microservices: 'container-orchestration-journey',
  aws: 'cloud-interview-mastery',
  azure: 'cloud-interview-mastery',
  gcp: 'cloud-interview-mastery',
  networking: 'cloud-interview-mastery',
  finops: 'cloud-interview-mastery',
  terraform: 'infrastructure-automation-mastery',
  iac: 'infrastructure-automation-mastery',
  config_mgmt: 'infrastructure-automation-mastery',
  cicd: 'modern-cicd-gitops',
  gitops: 'modern-cicd-gitops',
  devsecops: 'modern-cicd-gitops',
  compliance: 'modern-cicd-gitops',
  sre: 'senior-devops-handbook',
  observability: 'senior-devops-handbook',
  platform_eng: 'senior-devops-handbook',
  linux: 'senior-devops-handbook',
  scenario: 'senior-devops-handbook',
  career: BUNDLE_SLUG,
  mlops: 'senior-devops-handbook',
}

export function productForCategory(category: string): CatalogEbook | undefined {
  const slug = categoryProducts[category]
  return slug ? getEbook(slug) : undefined
}

type Frontmatter = Record<string, string>

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

function loadQuestion(file: string): Question {
  const slug = file.replace(/\.md$/, '')
  const raw = fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf8')
  const { fm, body } = parseFrontmatter(raw)
  const words = body.split(/\s+/).length
  return {
    slug,
    title: fm.title ?? slug,
    description: fm.description ?? '',
    date: fm.date ?? '2026-01-01',
    keywords: (fm.keywords ?? '').split(',').map((k) => k.trim()).filter(Boolean),
    category: fm.category ?? 'scenario',
    youtubeId: fm.youtube ?? null,
    readingMinutes: Math.max(1, Math.round(words / 220)),
    html: marked.parse(body, { async: false }) as string,
  }
}

export function getAllQuestions(): Question[] {
  if (!fs.existsSync(QUESTIONS_DIR)) return []
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(loadQuestion)
    .sort((a, b) => a.title.localeCompare(b.title))
}

export function getQuestion(slug: string): Question | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  const file = path.join(QUESTIONS_DIR, `${slug}.md`)
  if (!fs.existsSync(file)) return null
  return loadQuestion(`${slug}.md`)
}

export function relatedQuestions(q: Question, limit = 4): Question[] {
  return getAllQuestions()
    .filter((o) => o.category === q.category && o.slug !== q.slug)
    .slice(0, limit)
}
