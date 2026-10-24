import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllQuestions, categoryLabel } from '@/lib/questions'
import { createPageMetadata } from '@/config/site'
import TrackedLink from '@/components/TrackedLink'
import { totalQuestions, BUNDLE_SLUG } from '@/lib/catalog'

export const metadata: Metadata = createPageMetadata({
  title: 'DevOps Interview Questions, Answered Properly',
  description:
    'Real DevOps, Kubernetes, AWS, Terraform and SRE interview questions with the answers interviewers actually want, plus the follow-ups they use to probe deeper.',
  path: '/questions',
})

export default function QuestionsIndexPage() {
  const questions = getAllQuestions()
  const byCategory = new Map<string, typeof questions>()
  for (const q of questions) {
    const list = byCategory.get(q.category) ?? []
    list.push(q)
    byCategory.set(q.category, list)
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)

  return (
    <main id="main" className="container mx-auto px-4 py-12 max-w-4xl">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
          DevOps interview questions, answered properly
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {questions.length} questions from real DevOps, SRE and platform interviews. Each page gives
          you the answer interviewers are listening for, why they ask it, and the follow-ups they use
          to find the edge of your knowledge.
        </p>
        <p className="mt-3 text-sm">
          New:{' '}
          <Link href="/ai-infrastructure-interview-questions" className="font-semibold text-blue-700 underline-offset-4 hover:underline">
            AI infrastructure and MLOps interview questions
          </Link>
        </p>
      </header>

      {categories.map(([category, list]) => (
        <section key={category} className="mb-10">
          <h2 className="text-xl font-semibold mb-4">
            {categoryLabel(category)} <span className="text-muted-foreground font-normal text-base">({list.length})</span>
          </h2>
          <ul className="space-y-2">
            {list.map((q) => (
              <li key={q.slug}>
                <Link href={`/questions/${q.slug}`} className="text-blue-700 underline-offset-4 hover:underline">
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <aside className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold mb-2">Want the full worked answers?</h2>
        <p className="text-sm text-slate-700 mb-4">
          The five-book series covers cloud, Kubernetes, Terraform, CI/CD and SRE with {totalQuestions} interview
          questions: a 30-second answer, the deep dive, the tradeoffs and the follow-ups for each.
          Every purchase includes the free Interview-Day Playbook.
        </p>
        <TrackedLink
          href={`/ebooks/${BUNDLE_SLUG}`}
          eventName="questions_cta_clicked"
          eventProperties={{ destination: 'bundle', page: 'index' }}
          className="btn-primary inline-block"
        >
          See the bundle
        </TrackedLink>
      </aside>
    </main>
  )
}
