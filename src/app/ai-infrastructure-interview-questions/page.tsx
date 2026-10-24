import type { Metadata } from 'next'
import Link from 'next/link'
import { createPageMetadata, siteConfig } from '@/config/site'
import { getContents, singleBooks } from '@/lib/catalog'
import SampleSignup from '@/components/SampleSignup'

const PATH = '/ai-infrastructure-interview-questions'

export const metadata: Metadata = createPageMetadata({
  title: 'AI Infrastructure & MLOps Interview Questions',
  description:
    'Six AI infrastructure and MLOps interview questions with senior-level answers: GPUs on Kubernetes, LLM inference scaling, cost, monitoring and model rollout.',
  path: PATH,
  keywords: [
    'ai infrastructure interview questions',
    'mlops interview questions',
    'gpu kubernetes interview questions',
    'llm inference scaling',
    'llmops interview questions',
  ],
})

type QA = { q: string; a: string[]; listen: string }

const QUESTIONS: QA[] = [
  {
    q: 'How do you schedule GPU workloads on Kubernetes?',
    a: [
      'The NVIDIA device plugin, usually installed by the GPU Operator, advertises GPUs as an extended resource, nvidia.com/gpu, and a pod asks for them in its limits. In the default setup each unit is a whole physical GPU, so a container cannot ask for half a card and the scheduler will not hand one card to two pods.',
      'Put GPU nodes in their own pool and taint them so ordinary pods stay off. GPU workloads get the matching toleration plus node affinity for the GPU type they need. When a small model would waste a whole card, share it: MIG splits an A100 or H100 into up to seven instances with hardware memory and fault isolation, while time-slicing shares one GPU with no isolation at all, so keep it for dev and trusted batch jobs.',
      'Since Kubernetes 1.34, Dynamic Resource Allocation is GA. A pod can describe the device it needs, such as GPU model or memory, instead of only a count, and the scheduler finds a match.',
    ],
    listen: 'Taints plus affinity for GPU pools, and the isolation difference between MIG and time-slicing.',
  },
  {
    q: 'How do you autoscale an LLM inference service?',
    a: [
      'Not on CPU, and not on GPU utilization either. That number only says a kernel was running, and latency climbs when the request queue and the KV cache fill up, often while utilization looks fine. Scale on what the inference server reports: requests waiting, KV-cache usage or time to first token, through KEDA or a custom-metrics HPA.',
      'Then plan for cold starts. Pulling tens of gigabytes of weights and loading them onto a GPU can take minutes, so keep a floor of warm replicas, cache weights on the node or a fast volume, and scale ahead of known peaks. Round-robin load balancing also works badly for LLM traffic; the Gateway API Inference Extension routes on model-server load instead.',
    ],
    listen: 'A queue or KV-cache signal instead of CPU, and a plan for cold starts.',
  },
  {
    q: 'How would you cut GPU costs without hurting training or latency?',
    a: [
      'Measure first. The DCGM exporter gives per-GPU utilization and memory, and most fleets find cards sitting idle or oversized. Then right-size per workload: a small model serves fine on an L4-class card. Share cards for small models with MIG, batch requests on the inference side, and use a quantized model where the quality holds up.',
      'For training, run on spot or preemptible capacity with frequent checkpoints, so an eviction costs minutes instead of the whole run. Scale dev GPU nodes and idle notebooks to zero outside working hours, and track cost per thousand requests or per training run rather than the monthly bill.',
    ],
    listen: 'Measuring utilization before buying anything, and checkpointing to make spot safe for training.',
  },
  {
    q: 'How do you monitor an LLM service in production?',
    a: [
      'In layers. Requests: time to first token and time per output token tracked separately, throughput, errors and timeouts. Model server: queue depth, KV-cache usage and batch size. Hardware: GPU utilization, memory, temperature and XID errors from DCGM. Money: tokens and cost per request, broken down by tenant or feature.',
      'Then quality, which normal monitoring misses. A model can answer fast and wrong, so every new version runs an offline eval, and a sample of production answers gets reviewed. For tracing, OpenTelemetry has GenAI semantic conventions for model calls, but they are still marked as in development, so pin the version you build on.',
    ],
    listen: 'The two latency numbers kept apart, and evals for quality alongside the usual metrics.',
  },
  {
    q: 'How do you roll out a new model version safely?',
    a: [
      'Treat the model like any other release artifact: versioned in a registry, immutable, with its eval results and a reference to its training data attached. It has to pass an offline eval gate against a fixed test set and the current model’s scores before it sees any traffic.',
      'Next comes shadow traffic, where real requests go to the new model and the outputs are compared but never returned to users. Then a small canary with automatic rollback on latency, errors and quality. Rollback means pointing serving back at the previous version, which is still in the registry and, if you can afford it, still warm.',
    ],
    listen: 'An eval gate before traffic, shadow before canary, and rollback as a pointer change.',
  },
  {
    q: 'How do you secure model files in the supply chain?',
    a: [
      'A model file can be executable. Pickle-based formats, including older PyTorch .bin and .pt files, can run code when they load, so prefer safetensors, which stores only tensors, and scan anything else before loading it. Pull models from a private registry or mirror, not straight from a public hub at deploy time.',
      'Sign models when you publish them and verify before serving; the OpenSSF model-signing project, which reached v1.0 in April 2025, does this with Sigstore. A signature proves who produced the file and that it hasn’t changed, not that it is safe, so scanning still applies. Keep lineage too, so you can say which data and code produced the model running today.',
    ],
    listen: 'Knowing pickle runs code on load, and that signing and scanning answer different questions.',
  },
]

const RELATED = [
  { slug: 'mlops-vs-devops-what-s-different', title: 'MLOps vs DevOps: what is actually different' },
  { slug: 'feature-stores-3-reasons-your-ml-pipeline-needs-one', title: 'Feature stores: 3 reasons your ML pipeline needs one' },
  { slug: 'ai-devops-copilot-is-it-actually-useful', title: 'AI DevOps copilots: are they actually useful?' },
]

const AI_TOPIC = /\b(AI|ML|GPU|MLOps|AIOps)\b|machine learning/

// AI and ML questions the existing books already answer in full.
const inTheBooks = singleBooks.flatMap((book) =>
  (getContents(book.slug)?.chapters ?? []).flatMap((ch) =>
    ch.questions.filter((q) => AI_TOPIC.test(q)).map((q) => ({ q, slug: book.slug, book: book.title.split(':')[0] })),
  ),
)

export default function AiInfrastructurePage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${siteConfig.url}${PATH}`,
    mainEntity: QUESTIONS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a.join(' ') },
    })),
  }

  return (
    <main id="main" className="container mx-auto px-4 py-12 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      <nav className="text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/questions" className="hover:underline">Interview Questions</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">AI Infrastructure</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">AI Infrastructure &amp; MLOps Interview Questions</h1>
        <p className="text-lg text-muted-foreground">
          Platform and DevOps interviews now often include a round on running AI workloads: GPUs on Kubernetes,
          model serving, and the cost and reliability problems that come with them. These six come up a lot.
          Each answer is the short version a senior engineer would give, followed by what the interviewer is
          listening for.
        </p>
      </header>

      <div className="blog-prose">
        {QUESTIONS.map(({ q, a, listen }, i) => (
          <section key={q}>
            <h2>{i + 1}. {q}</h2>
            {a.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
            <p><strong>What they listen for:</strong> {listen}</p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-2">Already answered in full in the books</h2>
        <p className="text-sm text-muted-foreground mb-4">
          These AI and ML questions are in the current series, each with the deep dive, trade-offs and follow-ups.
        </p>
        <ul className="space-y-3">
          {inTheBooks.map(({ q, slug, book }) => (
            <li key={q}>
              <span className="text-slate-800">{q}</span>{' '}
              <Link href={`/ebooks/${slug}`} className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline whitespace-nowrap">
                {book}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Related free questions</h2>
        <ul className="space-y-2">
          {RELATED.map((r) => (
            <li key={r.slug}>
              <Link href={`/questions/${r.slug}`} className="text-blue-700 underline-offset-4 hover:underline">{r.title}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Want a full book on AI infrastructure?</h2>
        <p className="text-sm text-slate-700 mb-5">
          We&apos;re deciding whether to write one: around 50 questions on GPUs, model serving, MLOps pipelines and
          LLM operations, answered like the rest of the series. Leave your email and we&apos;ll tell you if it goes
          ahead. That&apos;s the only email this list gets.
        </p>
        <SampleSignup
          source="ai-infra-waitlist"
          ctaLabel="Tell me if it goes ahead"
          helperText="One email if the book happens. Nothing else."
          successMessage="You're on the list. We'll email you if the book goes ahead."
          successNote={null}
        />
      </section>
    </main>
  )
}
