import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSearch,
  FileText,
  FlaskConical,
  Gauge,
  SquareTerminal,
} from "lucide-react";
import SampleSignup from "@/components/SampleSignup";

export const metadata: Metadata = {
  title: "Incident Labs | DevOps Troubleshooting Practice",
  description:
    "Practice the DevOps troubleshooting round with interactive incident investigations, controlled experiments, and postmortem exercises in your browser.",
  keywords: [
    "DevOps incident lab",
    "SRE troubleshooting practice",
    "DevOps interview lab",
    "incident investigation",
    "postmortem practice",
  ],
  alternates: {
    canonical: "/labs",
  },
  openGraph: {
    type: "website",
    url: "/labs",
    title: "Incident Labs — practice the troubleshooting round",
    description:
      "Interactive incident investigations built for DevOps, cloud, and SRE interview practice.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DevOpsInterview.Cloud Incident Labs",
      },
    ],
  },
};

const steps = [
  {
    title: "Investigate the evidence",
    description:
      "Read the timeline, inspect telemetry, and separate useful signals from noise.",
    icon: FileSearch,
  },
  {
    title: "Run controlled experiments",
    description:
      "Test one variable at a time and use the results to challenge your hypothesis.",
    icon: FlaskConical,
  },
  {
    title: "Write the postmortem",
    description:
      "Turn the evidence into a clear causal chain, remediation, and follow-up actions.",
    icon: FileText,
  },
];

export default function LabsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section
        aria-labelledby="labs-heading"
        className="relative border-b border-border px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] lg:gap-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
              <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
              Interactive interview practice
            </div>
            <h1
              id="labs-heading"
              className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.05]"
            >
              Incident Labs — practice the troubleshooting round
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Investigate realistic incidents directly in your browser. Follow the
              evidence, test your theory, and explain the root cause the way you
              would in a senior DevOps or SRE interview.
            </p>
            <a
              href="#available-labs"
              className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-blue-600/20 transition-colors duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Explore the first lab
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rotate-2 rounded-3xl bg-blue-100" aria-hidden="true" />
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-900/20">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 font-mono text-xs uppercase tracking-[0.16em] text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <SquareTerminal className="h-4 w-4 text-blue-400" aria-hidden="true" />
                  Incident 01
                </span>
                <span className="text-amber-300">Investigating</span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-end justify-between gap-5">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-400">
                      Token cost / 24h
                    </p>
                    <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-slate-50">
                      $1,847.20
                    </p>
                  </div>
                  <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-sm font-semibold text-amber-300">
                    +43.8%
                  </span>
                </div>
                <svg
                  viewBox="0 0 360 112"
                  className="mt-7 h-28 w-full"
                  role="img"
                  aria-label="Token cost rises sharply while traffic stays flat"
                >
                  <path d="M0 87H360M0 54H360M0 21H360" stroke="currentColor" className="text-slate-800" />
                  <path
                    d="M0 82 C45 79 66 81 103 78 S157 76 184 74 S212 72 229 67 S249 33 270 28 S317 22 360 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-amber-300"
                  />
                  <path
                    d="M0 87 C58 84 108 86 163 83 S265 85 360 82"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="5 6"
                    className="text-blue-400"
                  />
                </svg>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5 text-sm">
                  <div className="rounded-lg bg-slate-900 p-3">
                    <span className="block text-slate-400">Traffic</span>
                    <strong className="mt-1 block font-mono font-medium text-blue-300">Unchanged</strong>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-3">
                    <span className="block text-slate-400">Your task</span>
                    <strong className="mt-1 block font-mono font-medium text-slate-100">Find the cause</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="available-labs" aria-labelledby="available-labs-heading" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                Available now
              </p>
              <h2 id="available-labs-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Start with the signal, not the answer
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-muted-foreground sm:text-right">
              No setup, cloud account, or local tooling required. Your progress stays in the browser.
            </p>
          </div>

          <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-xl">
            <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_auto]">
              <div className="flex min-h-48 flex-col justify-between border-b border-border bg-slate-950 p-6 text-slate-100 lg:border-b-0 lg:border-r lg:border-slate-800">
                <div className="flex items-center justify-between gap-3 lg:block">
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-blue-300">Lesson 01</span>
                  <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-bold tracking-wide text-emerald-950 lg:mt-4 lg:inline-flex">
                    FREE
                  </span>
                </div>
                <Gauge className="h-10 w-10 text-amber-300" strokeWidth={1.5} aria-hidden="true" />
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                    ~20 min
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    Runs in your browser
                  </span>
                </div>
                <h3 className="mt-5 max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                  Token Cost Increased Without Traffic Growth
                </h3>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                  Production spend jumped, but request volume did not. Inspect the evidence,
                  isolate the change, and build a defensible explanation before the review.
                </p>
              </div>

              <div className="flex items-center border-t border-border p-6 lg:border-l lg:border-t-0 lg:p-8">
                <a
                  href="/labs/token-cost/"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:w-auto"
                >
                  Start lab
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading" className="border-y border-border bg-muted px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
              How it works
            </p>
            <h2 id="how-it-works-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Practice the full incident narrative
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              The lab rewards disciplined reasoning—not guessing the right answer early.
            </p>
          </div>

          <ol className="mt-12 grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative rounded-2xl border border-border bg-card p-7 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-blue-700">0{index + 1}</span>
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{step.description}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section aria-labelledby="labs-signup-heading" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-blue-200 bg-blue-50 px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
            More incidents are being staged
          </p>
          <h2 id="labs-signup-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Get notified when new labs ship
          </h2>
          <p className="mx-auto mb-8 mt-4 max-w-2xl text-lg leading-8 text-slate-700">
            Join the list for new browser-based incident scenarios and get the free interview sample today.
          </p>
          <SampleSignup source="labs-notifications" />
        </div>
      </section>

      <div className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>Incident Labs by DevOpsInterview.Cloud</span>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back to interview resources
          </Link>
        </div>
      </div>
    </main>
  );
}
