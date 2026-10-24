import type { Metadata } from "next";
import Link from "next/link";
import SampleSignup from "@/components/SampleSignup";
import { createPageMetadata } from "@/config/site";

export const metadata: Metadata = createPageMetadata({
  title: "DevOps Incident Labs | Troubleshooting Interview Practice",
  description: "Practice senior DevOps and SRE troubleshooting with interactive incident investigations, controlled experiments, and postmortem exercises in your browser.",
  path: "/labs",
  imageAlt: "Interactive DevOps and SRE incident troubleshooting labs",
  keywords: [
    "DevOps incident lab",
    "SRE troubleshooting practice",
    "DevOps interview lab",
    "incident investigation",
    "postmortem practice",
  ],
});

const steps = [
  {
    title: "Investigate the evidence",
    description:
      "Read the timeline, inspect telemetry, and separate useful signals from noise.",
  },
  {
    title: "Run controlled experiments",
    description:
      "Test one variable at a time and use the results to challenge your hypothesis.",
  },
  {
    title: "Write the postmortem",
    description:
      "Turn the evidence into a clear causal chain, remediation, and follow-up actions.",
  },
];

export default function LabsPage() {
  return (
    <main id="main" className="text-[17px]">
      <section aria-labelledby="labs-heading" className="on-ink bg-ink text-white">
        <div className="wrap grid items-center gap-10 py-14 lg:grid-cols-12 lg:gap-x-6 lg:py-20">
          <div className="lg:col-span-7">
            <span className="chip bg-paper text-ink">Interactive interview practice</span>
            <h1 id="labs-heading" className="display-1 mt-5 max-w-[11em] max-[389px]:text-[44px]">
              Practice incident troubleshooting like it&apos;s the real interview.
            </h1>
            <p className="mt-6 max-w-[34em] text-[18px] leading-relaxed text-ink-subtle sm:text-[20px]">
              Investigate realistic incidents directly in your browser. Follow the
              evidence, test your theory, and explain the root cause the way you
              would in a senior DevOps or SRE interview.
            </p>
            {/* The lab is a static SPA served from public/ via a rewrite, so keep this as a plain anchor. */}
            <a href="/labs/token-cost/" className="btn-primary mt-8">
              Explore the first lab
            </a>
          </div>

          <div className="border-2 border-ink-rule p-6 sm:p-8 lg:col-span-5">
            <div className="meta flex items-center justify-between border-b border-ink-rule pb-3 text-ink-subtle">
              <span>Incident 01</span>
              <span className="text-highlight">Investigating</span>
            </div>
            <div className="mt-6 flex items-end justify-between gap-5">
              <div>
                <p className="meta text-ink-subtle">Token cost / 24h</p>
                <p className="display-2 mt-2 tabular-nums">$1,847.20</p>
              </div>
              <span className="border-2 border-highlight px-2 py-1 text-[15px] font-semibold tabular-nums text-highlight">
                +43.8%
              </span>
            </div>
            <svg
              viewBox="0 0 360 112"
              className="mt-7 h-28 w-full"
              role="img"
              aria-label="Token cost rises sharply while traffic stays flat"
            >
              <path d="M0 87H360M0 54H360M0 21H360" stroke="currentColor" className="text-ink-rule" />
              <path
                d="M0 82 C45 79 66 81 103 78 S157 76 184 74 S212 72 229 67 S249 33 270 28 S317 22 360 17"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-highlight"
              />
              <path
                d="M0 87 C58 84 108 86 163 83 S265 85 360 82"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="5 6"
                className="text-ink-subtle"
              />
            </svg>
            <dl className="mt-6 border-t border-ink-rule">
              <div className="flex items-center justify-between border-b border-ink-rule py-3 text-[15px]">
                <dt className="text-ink-subtle">Traffic</dt>
                <dd className="font-semibold">Unchanged</dd>
              </div>
              <div className="flex items-center justify-between border-b border-ink-rule py-3 text-[15px]">
                <dt className="text-ink-subtle">Your task</dt>
                <dd className="font-semibold">Find the cause</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section id="available-labs" aria-labelledby="available-labs-heading" className="py-14 sm:py-16">
        <div className="wrap">
          <div className="mb-8 sm:flex sm:items-end sm:justify-between sm:gap-6">
            <div>
              <span className="chip">Available now</span>
              <h2 id="available-labs-heading" className="display-2 mt-4">
                Start with the signal, not the answer
              </h2>
            </div>
            <p className="mt-3.5 max-w-[30em] text-[15px] leading-[1.55] text-subtle sm:mt-0 sm:text-right">
              No setup, cloud account, or local tooling required. Your progress stays in the browser.
            </p>
          </div>

          <article className="grid gap-x-6 gap-y-5 border-t-2 border-b border-ink border-b-hair py-8 lg:grid-cols-12">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:col-span-3 lg:flex-col lg:items-start">
              <span className="chip">Lesson 01</span>
              <span className="meta">Free</span>
              <p className="meta text-subtle">~20 min · Runs in your browser</p>
            </div>

            <div className="lg:col-span-6">
              <h3 className="display-3 text-[32px] sm:text-[40px]">
                Token Cost Increased Without Traffic Growth
              </h3>
              <p className="mt-4 max-w-[38em] text-[16px] leading-relaxed text-subtle">
                Production spend jumped, but request volume did not. Inspect the evidence,
                isolate the change, and build a defensible explanation before the review.
              </p>
              <p className="mt-4 text-[15px] text-subtle">
                Build the underlying observability and incident-response theory with the{" "}
                <Link href="/ebooks/senior-devops-handbook" className="font-semibold text-ink underline underline-offset-4 hover:decoration-2">
                  SRE &amp; Production Operations ebook
                </Link>.
              </p>
            </div>

            <div className="lg:col-span-3 lg:justify-self-end">
              <a href="/labs/token-cost/" className="btn-primary w-full sm:w-auto">
                Start lab
              </a>
            </div>
          </article>
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading" className="border-t-2 border-ink py-14 sm:py-16">
        <div className="wrap">
          <span className="chip">How it works</span>
          <h2 id="how-it-works-heading" className="display-2 mt-4">
            Practice the full incident narrative
          </h2>
          <p className="mt-4 max-w-[40em] text-[18px] leading-relaxed text-subtle">
            The lab rewards disciplined reasoning, not guessing the right answer early.
          </p>

          <ol className="mt-10 grid gap-x-6 gap-y-10 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t-2 border-ink pt-3.5">
                <span className="font-display text-[40px] font-extrabold leading-none tabular-nums" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-[19px] font-bold leading-snug">{step.title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-subtle">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="labs-signup-heading" className="border-t-2 border-ink py-14 sm:py-16">
        <div className="wrap">
          <div className="grid grid-cols-1 items-end gap-x-6 border-l-[6px] border-ink py-1 pl-5 sm:pl-7 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="chip">More incidents are being staged</span>
              <h2 id="labs-signup-heading" className="display-2 mt-4">
                Get notified when new labs ship
              </h2>
              <p className="mt-3.5 max-w-[34em]">
                Join the list for new browser-based incident scenarios and get the free interview sample today.
              </p>
            </div>
            <div className="mt-6 lg:col-span-5 lg:mt-0">
              <SampleSignup
                source="labs-notifications"
                ctaLabel="Notify me about new labs"
                helperText="New browser-based incident scenarios. No spam, unsubscribe anytime."
                successMessage="You are on the list. New labs land in your inbox first."
              />
              <Link
                href="/privacy"
                className="mt-3 inline-block text-[14px] font-medium underline underline-offset-4 hover:decoration-2"
              >
                Privacy policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-hair">
        <div className="wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-6 text-[15px] text-subtle">
          <span>Incident Labs by DevOpsInterview.Cloud</span>
          <Link
            href="/"
            className="font-semibold text-ink underline-offset-4 hover:underline"
          >
            Browse interview resources
          </Link>
        </div>
      </div>
    </main>
  );
}
