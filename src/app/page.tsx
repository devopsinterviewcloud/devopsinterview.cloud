import Image from "next/image";
import Link from "next/link";
import ebooksData from "@/data/ebooks.json";
import Script from "next/script";
import EbookPrice from "@/components/EbookPrice";
import { DynamicPriceText } from "@/components/DynamicPriceText";
import SampleSignup from "@/components/SampleSignup";
import TrackedLink from "@/components/TrackedLink";
import BundleSavings from "@/components/BundleSavings";
import { bundle, bundleSavings, ebooks, getContents, sampleHrefFor, singleBooks, totalQuestions, PLAYBOOK_SLUG, SAMPLE_PDF, SAMPLE_PDF_QUESTIONS, type CatalogEbook } from "@/lib/catalog";
import { bookStyle, splitTitle, topicLine } from "@/lib/book-style";
import { SPOTIFY_URL } from "@/lib/podcast";

const playbook = ebooks.find((e) => e.slug === PLAYBOOK_SLUG)!;
const totalChapters = singleBooks.reduce((n, b) => n + (getContents(b.slug)?.chapters.length ?? 0), 0);

const topics = [
  {
    title: "Cloud Architecture",
    slug: "cloud-interview-mastery",
    description: "Compare AWS, Azure, and GCP across architecture, networking, security, cost, and disaster recovery interview scenarios.",
  },
  {
    title: "Container Orchestration",
    slug: "container-orchestration-journey",
    description: "Practice Kubernetes questions covering scheduling, networking, security, storage, and production debugging.",
  },
  {
    title: "Infrastructure as Code",
    slug: "infrastructure-automation-mastery",
    description: "Prepare for Terraform and OpenTofu questions on state, modules, testing, drift, policy, and delivery at scale.",
  },
  {
    title: "CI/CD Pipelines",
    slug: "modern-cicd-gitops",
    description: "Work through pipeline, GitOps, progressive delivery, rollback, and software supply-chain security questions.",
  },
  {
    title: "Monitoring & Observability",
    slug: "senior-devops-handbook",
    description: "Explain SLOs, alert design, logs, metrics, traces, incident response, and reliability tradeoffs in senior interviews.",
  },
  {
    title: "Interview Preparation",
    slug: "complete-devops-mastery-bundle",
    description: "Use answer frameworks, system-design prompts, STAR worksheets, reverse questions, and a focused interview-week plan.",
  },
];

const coverSizes = "(min-width: 1280px) 221px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw";

function BookCard({ ebook }: { ebook: CatalogEbook }) {
  const style = bookStyle(ebook.id);
  const contents = getContents(ebook.slug);
  return (
    <article id={`book-${ebook.id}`} className="flex scroll-mt-6 flex-col">
      <TrackedLink href={`/ebooks/${ebook.slug}`} eventName="product_view_clicked" eventProperties={{ product: ebook.id, location: "home_cover" }} className="block">
        <Image src={ebook.coverUrl} alt={`Cover of ${ebook.title}`} width={1024} height={1536} sizes={coverSizes} className="aspect-[2/3] w-full object-cover" />
      </TrackedLink>
      <div className="mt-4 flex flex-1 flex-col border-t-2 border-ink pt-3.5">
        <div><span className="chip">{style.label}</span></div>
        <h3 className="display-3 mt-3 text-[32px]">
          <TrackedLink href={`/ebooks/${ebook.slug}`} eventName="product_view_clicked" eventProperties={{ product: ebook.id, location: "home_title" }} className="decoration-2 underline-offset-4 hover:underline">
            {splitTitle(ebook.title).name}
          </TrackedLink>
        </h3>
        <p className="mt-2 text-[15px] font-medium leading-snug text-subtle">{topicLine(ebook.title)}</p>
        <p className="meta mt-1.5 text-subtle">{contents?.questionCount} questions · {ebook.pageCount} pages</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-[18px]">
          <EbookPrice usdPrice={ebook.price} />
          <TrackedLink href={`/ebooks/${ebook.slug}`} eventName="product_view_clicked" eventProperties={{ product: ebook.id, location: "home_card" }} className="btn-primary">
            See inside<span className="sr-only"> {splitTitle(ebook.title).name}</span>
          </TrackedLink>
        </div>
        <p className="mt-3 text-[14px]">
          <TrackedLink href={sampleHrefFor(ebook.slug)} eventName="sample_opened" eventProperties={{ location: "home_card", product: ebook.id, kind: "html" }} className="underline underline-offset-4 hover:decoration-2">
            Read a free sample question
          </TrackedLink>
        </p>
      </div>
    </article>
  );
}

export default function Home() {
  const savings = bundleSavings();
  // Escape "<" so the JSON-LD can never break out of the <script> tag.
  const escapeJsonLd = (obj: unknown) => JSON.stringify(obj).replace(/</g, '\\u003c')

  // Single source of truth for the on-page FAQ AND the FAQPage structured data.
  const faqs = [
    { question: "What formats are the ebooks available in?", answer: "All ebooks are delivered in PDF format, professionally designed for technical reading with code syntax highlighting, diagrams, and easy navigation. Compatible with all devices including computers, tablets, and smartphones." },
    { question: "How long does delivery take?", answer: "Instant digital delivery: within minutes of your payment being confirmed, you'll receive download links directly at your registered email address. No physical shipping involved." },
    { question: "Do you offer bundle discounts?", answer: `Yes. In India the five-book bundle is ₹${savings.bundleINR.toLocaleString("en-IN")} against ₹${savings.separateINR.toLocaleString("en-IN")} for the books bought separately (you save ₹${savings.saveINR.toLocaleString("en-IN")}, about ${savings.pctINR}%). Elsewhere it is $${savings.bundleUSD.toFixed(2)} against $${savings.separateUSD.toFixed(2)} (you save $${savings.saveUSD.toFixed(2)}, about ${savings.pctUSD}%). Every purchase also includes the Interview-Day Playbook free.` },
    { question: "What currencies do you accept?", answer: "Customers in India pay in INR (₹) via Razorpay (GST-inclusive); everyone else pays in USD ($) via PayPal. Use the currency selector in the header to switch how prices are shown." },
    { question: "Are the ebooks suitable for beginners?", answer: "The books target mid-to-senior interview preparation, but each topic is built up from fundamentals with step-by-step explanations and real-world examples, so motivated junior engineers can follow along too." },
    { question: "Do I get free updates?", answer: "Yes. If we revise or correct the edition you purchased, you'll receive the updated PDF free of charge by replying to your delivery email." },
    { question: "What is your refund policy?", answer: "All sales are final due to the digital nature of our products. Once you receive the download links, the content cannot be returned. Please review the book descriptions and topics carefully before purchasing." },
    { question: "Can I purchase for my team?", answer: "Yes! We offer team pricing and volume discounts for organizations. Contact us at devopsinterview.cloud@gmail.com with the number of licenses needed, and we'll provide a custom quote." },
  ]

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer },
    })),
  };

  const productsData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": ebooksData.filter((e) => e.slug !== "interview-day-playbook").map((ebook, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Book",
        "@id": `https://devopsinterview.cloud/ebooks/${ebook.slug}`,
        "name": ebook.title,
        "description": ebook.description,
        "image": `https://devopsinterview.cloud${ebook.coverUrl}`,
        "bookFormat": "EBook",
        "numberOfPages": ebook.pageCount,
        "inLanguage": "en-US",
        "offers": {
          "@type": "Offer",
          "price": ebook.price,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": `https://devopsinterview.cloud/ebooks/${ebook.slug}`
        },
        "author": {
          "@type": "Organization",
          "name": "DevOpsInterview.Cloud"
        },
        "publisher": {
          "@type": "Organization",
          "name": "DevOpsInterview.Cloud"
        }
      }
    }))
  };

  return (
    <>
      <Script
        id="structured-data-products"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(productsData) }}
      />
      <Script
        id="structured-data-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(faqData) }}
      />
      <main id="main" className="text-[17px]">

      <section className="pt-8 pb-10 sm:pt-10">
        <div className="wrap grid grid-cols-1 items-center gap-x-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <span className="chip">{splitTitle(bundle.title).name}</span>
            <h1 className="display-1 mt-[18px] sm:mt-6">DevOps interview questions with senior-level answers</h1>
            <p className="mt-[18px] max-w-[34em] text-[18px] leading-normal sm:mt-6 sm:text-[20px]">
              {totalQuestions} questions in five PDF books. Each one has a 30-second answer, the deep dive, the trade-offs and the follow-ups.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <TrackedLink href="#ebooks" eventName="home_ebooks_cta_clicked" eventProperties={{ location: "hero" }} className="btn-primary">
                <span>See the five books, from <DynamicPriceText usdPrice={singleBooks[0].price} /></span>
              </TrackedLink>
              <TrackedLink href={SAMPLE_PDF} target="_blank" eventName="sample_opened" eventProperties={{ location: "hero" }} className="btn-secondary">
                Read {SAMPLE_PDF_QUESTIONS} free questions
              </TrackedLink>
            </div>
          </div>
          <ul className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 lg:col-span-6 lg:mt-0" aria-label="The five books">
            {singleBooks.map((b) => (
              <li key={b.slug}>
                <Image src={b.coverUrl} alt={`${bookStyle(b.id).label}, ${splitTitle(b.title).name} cover`} width={1024} height={1536} sizes="(min-width: 1280px) 192px, (min-width: 1024px) 15vw, 31vw" priority className="aspect-[2/3] w-full object-cover" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <nav aria-label="Books in the series" className="border-t-2 border-b border-ink border-b-hair">
        <ol className="wrap flex flex-col lg:flex-row">
          {singleBooks.map((b) => (
            <li key={b.slug} className="border-hair not-first:border-t lg:flex-auto lg:px-5 lg:first:pl-0 lg:last:pr-0 lg:not-first:border-t-0 lg:not-first:border-l">
              <a href={`#book-${b.id}`} className="group flex items-baseline gap-4 py-3 lg:block lg:pb-3.5">
                <span className="meta flex items-center gap-2 text-subtle">
                  <span className={`size-3 shrink-0 ${bookStyle(b.id).square}`} aria-hidden="true" />
                  {bookStyle(b.id).label}
                </span>
                <span className="block text-[15px] font-semibold leading-snug underline-offset-[3px] group-hover:underline lg:mt-1">{splitTitle(b.title).name}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="ebooks" className="scroll-mt-4 pt-12 pb-12 sm:pt-[52px] sm:pb-[60px]">
        <div className="wrap">
          <div className="mb-7 sm:mb-8 sm:flex sm:items-end sm:justify-between sm:gap-6">
            <div>
              <span className="chip">The books</span>
              <h2 className="display-2 mt-4">One book, or all five</h2>
            </div>
            <p className="mt-3.5 max-w-[30em] text-[15px] leading-[1.55] text-subtle sm:mt-0 sm:text-right">
              <DynamicPriceText usdPrice={singleBooks[0].price} /> a book, or all five for <DynamicPriceText usdPrice={bundle.price} />. The PDF download link is emailed after payment. India pays in INR via Razorpay, everywhere else in USD via PayPal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-5">
            {singleBooks.map((ebook) => <BookCard key={ebook.slug} ebook={ebook} />)}

            <article id="book-bundle" className="flex scroll-mt-6 flex-col sm:col-span-2 sm:grid sm:grid-cols-subgrid lg:col-span-3">
              <TrackedLink href={`/ebooks/${bundle.slug}`} eventName="product_view_clicked" eventProperties={{ product: bundle.id, location: "home_cover" }} className="block sm:col-start-1 sm:self-start">
                <Image src={bundle.coverUrl} alt={`Cover of ${bundle.title}`} width={1024} height={1536} sizes={coverSizes} className="aspect-[2/3] w-full object-cover" />
              </TrackedLink>
              <div className="mt-4 flex flex-col border-t-2 border-ink pt-3.5 sm:col-[2/-1] sm:mt-0">
                <div><span className="chip">{bookStyle(bundle.id).label}</span></div>
                <h3 className="display-3 mt-3 text-[32px]">
                  <TrackedLink href={`/ebooks/${bundle.slug}`} eventName="product_view_clicked" eventProperties={{ product: bundle.id, location: "home_title" }} className="decoration-2 underline-offset-4 hover:underline">
                    {splitTitle(bundle.title).rest.replace(/ \(.*\)$/, "")}
                  </TrackedLink>
                </h3>
                <p className="meta mt-2.5 text-subtle">{totalQuestions} questions · {totalChapters} chapters · {bundle.pageCount} pages</p>
                <ul className="mt-4 border-t border-hair">
                  {singleBooks.map((b) => (
                    <li key={b.slug} className="flex items-center gap-2.5 border-b border-hair py-[5px] text-[15px] font-medium leading-snug">
                      <span className={`size-3 shrink-0 ${bookStyle(b.id).square}`} aria-hidden="true" />
                      {splitTitle(b.title).name}
                      <span className="ml-auto text-[14px] tabular-nums text-subtle">{getContents(b.slug)?.questionCount}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-3 pt-[18px]">
                  <EbookPrice usdPrice={bundle.price} />
                  <TrackedLink href={`/ebooks/${bundle.slug}`} eventName="product_view_clicked" eventProperties={{ product: bundle.id, location: "home_card" }} className="btn-primary">
                    See inside<span className="sr-only"> the complete series</span>
                  </TrackedLink>
                </div>
                <BundleSavings savings={savings} className="mt-2 text-[14px] leading-snug text-subtle" />
                <p className="mt-3 text-[14px]">
                  <TrackedLink href={sampleHrefFor(bundle.slug)} target="_blank" eventName="sample_opened" eventProperties={{ location: "home_card", product: bundle.id, kind: "pdf" }} className="underline underline-offset-4 hover:decoration-2">
                    Download {SAMPLE_PDF_QUESTIONS} free questions (PDF)
                  </TrackedLink>
                </p>
              </div>
            </article>

            <article className="flex flex-col sm:col-span-2 sm:grid sm:grid-cols-subgrid lg:col-span-3 xl:col-span-2">
              <Image src={playbook.coverUrl} alt={`Cover of ${playbook.title}`} width={1024} height={1536} sizes={coverSizes} className="aspect-[2/3] w-full object-cover outline-2 -outline-offset-2 outline-ink sm:col-start-1 sm:self-start" />
              <div className="mt-4 flex flex-col border-t-2 border-ink pt-3.5 sm:col-[2/-1] sm:mt-0">
                <div><span className="chip">{bookStyle(playbook.id).label}</span></div>
                <h3 className="display-3 mt-3 text-[32px]">{playbook.title.replace(/^The /, "")}</h3>
                <p className="mt-2 text-[15px] font-medium leading-snug text-subtle">For the week of the interview, and the day itself</p>
                <p className="meta mt-1.5 text-subtle">Companion guide · {playbook.pageCount} pages</p>
                <p className="price mt-auto pt-[18px]">Free</p>
                <p className="mt-2 text-[14px] text-subtle">Comes with every book and with the bundle.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="free-sample" className="scroll-mt-4 border-t-2 border-ink pt-12 pb-14 sm:pt-11 sm:pb-12">
        <div className="wrap">
          <div className="grid grid-cols-1 items-end gap-x-6 border-l-[6px] border-book-blue py-1 pl-5 sm:pl-7 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="chip">Free sample</span>
              <h2 className="display-2 mt-4">Try {SAMPLE_PDF_QUESTIONS} questions free</h2>
              <p className="mt-3.5 max-w-[34em]">
                One complete question from every chapter of Cloud Platforms, answered the way a senior engineer actually would: the 30-second answer, the deep dive, the trade-offs and the follow-ups. Open the PDF now, or have it emailed to you.
              </p>
            </div>
            <div className="mt-6 lg:col-span-5 lg:mt-0">
              <TrackedLink
                href={SAMPLE_PDF}
                target="_blank"
                eventName="sample_opened"
                eventProperties={{ location: "sample_section" }}
                className="btn-primary w-full sm:w-auto"
              >
                Open the sample now
              </TrackedLink>
              <p className="mt-4 mb-2 text-[14px] text-subtle">Or email yourself a copy:</p>
              <SampleSignup source="home-free-sample" />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="incident-labs-heading" className="on-ink bg-ink text-white">
        <div className="wrap grid gap-10 py-14 lg:grid-cols-12 lg:gap-x-6 lg:py-16">
          <div className="lg:col-span-7">
            <span className="chip bg-paper text-ink">New: Incident Labs</span>
            <h2 id="incident-labs-heading" className="display-2 mt-4 max-w-[13em]">
              Don&apos;t just study the answer. Investigate the incident.
            </h2>
            <p className="mt-5 max-w-[34em] text-[18px] leading-relaxed text-ink-subtle">
              Practice the troubleshooting round in an interactive browser lab. Follow
              evidence, run controlled experiments, and defend your root-cause analysis.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/labs" className="btn-primary">Explore Incident Labs</Link>
              <span className="text-[15px] text-ink-subtle">First lab is free · about 20 min</span>
            </div>
          </div>

          <div className="border-2 border-ink-rule p-6 sm:p-8 lg:col-span-5">
            <div className="meta flex items-center justify-between border-b border-ink-rule pb-3 text-ink-subtle">
              <span>Incident 01</span>
              <span className="text-highlight">Cost anomaly</span>
            </div>
            <p className="meta mt-6 text-ink-subtle">Observed</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="display-2 tabular-nums">+43.8%</p>
              <p className="text-right text-[14px] leading-snug text-ink-subtle">token cost<br />in 24 hours</p>
            </div>
            <dl className="mt-6 border-t border-ink-rule">
              {[
                ["Traffic", "Flat"],
                ["Deployments", "1 change"],
                ["Your move", "Find the cause"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-ink-rule py-3 text-[15px]">
                  <dt className="text-ink-subtle">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="categories" className="py-12 sm:py-14">
        <div className="wrap">
          <div className="mb-8 sm:flex sm:items-end sm:justify-between sm:gap-6">
            <div>
              <span className="chip">Topics</span>
              <h2 className="display-2 mt-4">Study by topic</h2>
            </div>
            <p className="mt-3.5 max-w-[30em] text-[15px] leading-[1.55] text-subtle sm:mt-0 sm:text-right">
              Focus your preparation on the systems and tradeoffs you expect to discuss in your next technical interview.
            </p>
          </div>

          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => {
              const book = ebooksData.find((e) => e.slug === topic.slug)!
              const contents = getContents(topic.slug)
              return (
              <li key={topic.slug} className="border-t-2 border-ink pt-3.5">
                <h3 className="flex items-center gap-2.5 text-[19px] font-bold leading-snug">
                  <span className={`size-3 shrink-0 ${bookStyle(book.id).square}`} aria-hidden="true" />
                  {topic.title}
                </h3>
                <p className="mt-2 text-[16px] text-subtle">{topic.description}</p>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
                  <TrackedLink href={`/ebooks/${topic.slug}`} eventName="topic_card_clicked" eventProperties={{ topic: topic.slug, destination: "product" }} className="font-semibold underline underline-offset-4 hover:decoration-2">
                    {contents ? `${contents.questionCount} questions in ${book.title.split(":")[0]}` : `${book.title.split(":")[0]}${topic.slug === "complete-devops-mastery-bundle" ? " (Playbook included free)" : ""}`}
                  </TrackedLink>
                  <TrackedLink href={sampleHrefFor(topic.slug)} {...(contents ? {} : { target: "_blank" })} eventName="topic_card_clicked" eventProperties={{ topic: topic.slug, destination: "sample" }} className="underline underline-offset-4 hover:decoration-2">
                    free sample
                  </TrackedLink>
                </p>
              </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section id="interview-prep" className="border-t-2 border-ink py-12 sm:py-14">
        <div className="wrap">
          <span className="chip">Coverage</span>
          <h2 className="display-2 mt-4">What the series covers</h2>
          <p className="mt-4 max-w-[44em] text-subtle">
            Interview preparation with {totalQuestions} senior-level questions across five books, hands-on scenarios,
            and real interview answers. Covering system design, troubleshooting, behavioral questions, and salary
            negotiation strategies to help you land senior DevOps, SRE, and cloud architect roles.
          </p>

          <div className="mt-8 grid gap-x-6 gap-y-10 md:grid-cols-2">
            <div className="flex flex-col">
              <h3 className="display-3">The complete question bank</h3>
              <ul className="mt-4 border-t-2 border-ink">
                {[
                  "Kubernetes & Container Orchestration",
                  "CI/CD Jenkins, GitLab, GitHub Actions Pipeline Design",
                  "AWS, Azure, GCP Cloud Architecture Solutions",
                  "Terraform & OpenTofu Infrastructure as Code (IaC)",
                  "Observability, SRE, SLOs & Incident Response",
                  "Supply-chain Security, DevSecOps & Zero Trust",
                ].map((item) => (
                  <li key={item} className="flex items-baseline gap-3 border-b border-hair py-2.5 text-[16px]">
                    <span className="size-2 shrink-0 -translate-y-px bg-ink" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6"><Link href="/#ebooks" className="btn-secondary">Browse all 5 books</Link></div>
            </div>

            <div className="flex flex-col">
              <h3 className="display-3">Get the complete bundle</h3>
              <ul className="mt-4 border-t-2 border-ink">
                {[
                  `All 5 books: ${totalQuestions} senior-level interview questions`,
                  "Cloud (AWS, Azure, GCP) + Containers & Kubernetes",
                  "Infrastructure as Code: Terraform & OpenTofu",
                  "CI/CD & GitOps: pipelines, Argo CD and progressive delivery",
                  "SRE & Production Operations: SLOs, observability and incidents",
                  "One download page for all five PDFs plus the Playbook",
                ].map((item) => (
                  <li key={item} className="flex items-baseline gap-3 border-b border-hair py-2.5 text-[16px]">
                    <span className="size-2 shrink-0 -translate-y-px bg-ink" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6"><Link href="/ebooks/complete-devops-mastery-bundle" className="btn-primary">View the bundle</Link></div>
            </div>
          </div>
        </div>
      </section>

      <section id="youtube" className="border-t-2 border-ink py-12 sm:py-14">
        <div className="wrap">
          <span className="chip">Free learning resources</span>
          <h2 className="display-2 mt-4">Watch and listen</h2>
          <p className="mt-4 max-w-[44em] text-subtle">
            Get free DevOps and cloud interview tips, tutorials, and career advice through our YouTube channel and podcast.
          </p>

          <div className="mt-8 grid gap-x-6 gap-y-10 md:grid-cols-2">
            <div className="flex flex-col border-t-2 border-ink pt-3.5">
              <h3 className="display-3">YouTube channel</h3>
              <p className="mt-3 text-[16px] text-subtle">
                Watch free DevOps and cloud interview tutorials, certification tips for AWS/Azure/GCP, hands-on Kubernetes and Docker demos,
                Terraform guides, CI/CD pipelines, and real-world troubleshooting scenarios.
              </p>
              <ul className="mt-4 space-y-1.5 text-[16px]">
                {[
                  "Weekly DevOps & Cloud interview tips",
                  "Hands-on AWS, Azure, GCP tutorials",
                  "Kubernetes & Docker deep dives",
                  "Career advancement strategies",
                  "Live Q&A sessions with experts",
                ].map((item) => (
                  <li key={item} className="flex items-baseline gap-3">
                    <span className="size-2 shrink-0 -translate-y-px bg-ink" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <a href="https://www.youtube.com/@DevOpsInterviewCloud/videos" target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Subscribe to the channel
                </a>
              </div>
            </div>

            <div className="flex flex-col border-t-2 border-ink pt-3.5">
              <h3 className="display-3">DevOps podcast</h3>
              <p className="mt-3 text-[16px] text-subtle">
                Real DevOps and cloud interview scenarios, broken down the way a senior engineer would answer them,
                with the trade-offs interviewers actually probe for.
              </p>
              <ul className="mt-4 space-y-1.5 text-[16px]">
                {[
                  "Kubernetes, AWS and Terraform scenarios",
                  "CI/CD, observability and incident response",
                  "On Spotify and Amazon Music",
                ].map((item) => (
                  <li key={item} className="flex items-baseline gap-3">
                    <span className="size-2 shrink-0 -translate-y-px bg-ink" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <a href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Listen on Spotify
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials section removed: it contained fabricated named testimonials
          (invented people + quotes), an FTC/Google-policy risk on a store with no
          real customers yet. Reinstate with verified, attributable reviews once real
          customers exist. */}

      <section id="faq" className="border-t-2 border-ink py-12 sm:py-14">
        <div className="wrap grid gap-x-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="chip">FAQ</span>
            <h2 className="display-2 mt-4">Frequently asked questions</h2>
          </div>
          <dl className="mt-8 border-t-2 border-ink lg:col-span-8 lg:mt-0">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-b border-hair py-5">
                <dt className="font-semibold">{faq.question}</dt>
                <dd className="mt-2 break-words text-subtle [overflow-wrap:anywhere]">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      </main>
    </>
  );
}
