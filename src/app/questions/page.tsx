import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllQuestions, categoryLabel, productForCategory } from '@/lib/questions'
import { createPageMetadata } from '@/config/site'
import TrackedLink from '@/components/TrackedLink'
import { bundle, totalQuestions, BUNDLE_SLUG } from '@/lib/catalog'
import { bookStyle } from '@/lib/book-style'
import BookCallout from '@/components/BookCallout'

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
    <main id="main" className="pb-16 text-[17px]">
      <div className="wrap">
        <header className="pt-8 pb-10 sm:pt-10 sm:pb-12">
          <span className="chip">Questions</span>
          <h1 className="display-1 mt-5 max-w-[12em]">
            DevOps interview questions, answered properly
          </h1>
          <p className="mt-5 max-w-[40em] text-[18px] leading-normal sm:text-[20px]">
            {questions.length} questions from real DevOps, SRE and platform interviews. Each page gives
            you the answer interviewers are listening for, why they ask it, and the follow-ups they use
            to find the edge of your knowledge.
          </p>
          <p className="mt-4 text-[16px]">
            <span className="font-semibold">New:</span>{' '}
            <Link href="/ai-infrastructure-interview-questions" className="font-semibold underline underline-offset-4 hover:decoration-2">
              AI infrastructure and MLOps interview questions
            </Link>
          </p>
        </header>

        <div className="gap-x-6 lg:columns-2">
          {categories.map(([category, list]) => {
            const product = productForCategory(category)
            return (
              <section key={category} className="mb-10 break-inside-avoid border-t-2 border-ink pt-3.5">
                <h2 className="flex items-center gap-3">
                  <span className={`size-3 shrink-0 ${bookStyle(product?.id ?? 'bundle').square}`} aria-hidden="true" />
                  <span className="display-3">{categoryLabel(category)}</span>
                  <span className="meta text-subtle">({list.length})</span>
                </h2>
                <ul className="mt-3 text-[16px] leading-snug">
                  {list.map((q) => (
                    <li key={q.slug} className="py-1">
                      <Link href={`/questions/${q.slug}`} className="underline-offset-4 hover:underline">
                        {q.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        <BookCallout book={bundle} className="mt-4 bg-sheet">
          <span className="chip">{bookStyle(bundle.id).label}</span>
          <h2 className="mt-3 text-[22px] font-bold leading-snug">Want the full worked answers?</h2>
          <p className="mt-2.5 max-w-[42em] text-[16px] leading-relaxed text-subtle">
            The five-book series covers cloud, Kubernetes, Terraform, CI/CD and SRE with {totalQuestions} interview
            questions: a 30-second answer, the deep dive, the tradeoffs and the follow-ups for each.
            Every purchase includes the free Interview-Day Playbook.
          </p>
          <TrackedLink
            href={`/ebooks/${BUNDLE_SLUG}`}
            eventName="questions_cta_clicked"
            eventProperties={{ destination: 'bundle', page: 'index' }}
            className="btn-primary mt-5"
          >
            See the bundle
          </TrackedLink>
        </BookCallout>
      </div>
    </main>
  )
}
