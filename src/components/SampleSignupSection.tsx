import SampleSignup from '@/components/SampleSignup'
import { SAMPLE_PDF_QUESTIONS } from '@/lib/catalog'

// The email gate under articles and question pages, where search visitors land.
// The copy promises the welcome series, so these sources are enrolled in it.
export default function SampleSignupSection({ source, className = '' }: { source: 'blog-sample' | 'question-sample'; className?: string }) {
  return (
    <section aria-labelledby="sample-signup-heading" className={`border-t-2 border-ink pt-3.5 ${className}`}>
      <h2 id="sample-signup-heading" className="display-3">Get {SAMPLE_PDF_QUESTIONS} free questions by email</h2>
      <p className="mt-2.5 text-[16px] leading-relaxed text-subtle">
        One complete question from every chapter of Cloud Platforms, as a PDF. Then three short emails over the next
        week: two more worked answers and an overview of the series.
      </p>
      <div className="mt-5">
        <SampleSignup source={source} className="max-w-xl" helperText="Unsubscribe with one click from any of the emails." />
      </div>
    </section>
  )
}
