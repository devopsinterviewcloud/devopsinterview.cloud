import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ebooksData from "@/data/ebooks.json";
import EbookPrice from "@/components/EbookPrice";
import { siteConfig, truncateMetadataText } from "@/config/site";
import TrackedLink from "@/components/TrackedLink";
import BundleSavings from "@/components/BundleSavings";
import { bundle, bundleSavings, ebooks as catalog, getContents, singleBooks, totalQuestions, PLAYBOOK_SLUG, SAMPLE_PDF, SAMPLE_PDF_BOOK_SLUG, SAMPLE_PDF_QUESTIONS } from "@/lib/catalog";
import { bookStyle, splitTitle } from "@/lib/book-style";

const SITE_URL = siteConfig.url;

type Ebook = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  priceINR: number;
  fileSize: string;
  originalPrice?: number | null;
  coverUrl: string;
  format: string[];
  pageCount: number;
  tags?: string[];
  category?: string;
  isBundle?: boolean;
};

const ebooks = ebooksData as Ebook[];

function getEbook(slug: string) {
  return ebooks.find((e) => e.slug === slug);
}

const audience: Record<string, string> = {
  "cloud-interview-mastery": "DevOps engineers, cloud engineers, and architects preparing for interviews that compare AWS, Azure, and GCP services and design tradeoffs.",
  "container-orchestration-journey": "Engineers preparing for Kubernetes, service mesh, platform engineering, and production troubleshooting rounds.",
  "infrastructure-automation-mastery": "Engineers interviewing for roles that use Terraform or OpenTofu to manage infrastructure safely at scale.",
  "modern-cicd-gitops": "DevOps and platform engineers preparing to discuss pipeline design, GitOps, progressive delivery, and software supply-chain security.",
  "senior-devops-handbook": "Senior DevOps and SRE candidates preparing for reliability, observability, incident response, and technical leadership interviews.",
  "complete-devops-mastery-bundle": "Candidates who want the full five-book path across cloud, Kubernetes, infrastructure as code, delivery, SRE, and reliability.",
};

// Verified from the built books: every question uses the same seven-part layout.
const answerFormat = [
  "What the interviewer is really testing",
  "A 30-second answer you can say out loud",
  "A deep dive with a diagram",
  "A decision framework for the tradeoffs",
  "Pitfalls to avoid and signals of seniority",
  "Three follow-up questions, each answered",
  "A one-line recall hook",
];

// The Interview-Day Playbook is a free bonus, not a browsable product: keep it out
// of the prebuilt routes and 404 anything we don't prebuild.
export const dynamicParams = false;

export function generateStaticParams() {
  return ebooks
    .filter((e) => e.slug !== "interview-day-playbook")
    .map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ebook = getEbook(slug);
  if (!ebook) return { title: "Ebook not found" };
  const url = `${SITE_URL}/ebooks/${ebook.slug}`;
  const seoTitles: Record<string, string> = {
    "cloud-interview-mastery": "Cloud Interview Ebook: AWS, Azure & GCP | DevOps Prep",
    "container-orchestration-journey": "Kubernetes Interview Ebook | DevOps Prep",
    "infrastructure-automation-mastery": "Terraform & OpenTofu Interview Ebook | DevOps Prep",
    "modern-cicd-gitops": "CI/CD & GitOps Interview Ebook | DevOps Prep",
    "senior-devops-handbook": "SRE & Production Operations Interview Ebook | DevOps Prep",
    "complete-devops-mastery-bundle": "Complete DevOps Interview Ebook Bundle | Cloud & SRE",
  };
  const title = seoTitles[ebook.slug] ?? truncateMetadataText(ebook.title, 58);
  const description = truncateMetadataText(ebook.description);
  const image = `${SITE_URL}${ebook.coverUrl}`;
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      images: [{ url: image, width: 1024, height: 1536, alt: `Cover of ${ebook.title}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function EbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ebook = getEbook(slug);
  if (!ebook) notFound();
  const forWhom = audience[ebook.slug];
  const contents = getContents(ebook.slug);
  const savings = bundleSavings();
  const bundleBooks = ebook.isBundle ? singleBooks.map((b) => ({ ...b, contents: getContents(b.slug) })) : [];
  const style = bookStyle(ebook.id);
  const { name, rest } = splitTitle(ebook.title);
  const playbook = catalog.find((e) => e.slug === PLAYBOOK_SLUG)!;
  const chapterCount = ebook.isBundle
    ? bundleBooks.reduce((n, b) => n + (b.contents?.chapters.length ?? 0), 0)
    : contents?.chapters.length;
  const excerpt = contents?.excerpt;
  const excerptChapter = excerpt ? contents.chapters.findIndex((c) => c.title === excerpt.chapter) : -1;
  const lensText = excerpt ? excerpt.lens.charAt(0).toUpperCase() + excerpt.lens.slice(1) : "";
  const buyLabel = ebook.isBundle ? "the bundle" : "this ebook";

  const url = `${SITE_URL}/ebooks/${ebook.slug}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": ebook.isBundle ? "Product" : "Book",
    "@id": url,
    name: ebook.title,
    description: ebook.description,
    image: `${SITE_URL}${ebook.coverUrl}`,
    ...(ebook.isBundle ? {} : {
      bookFormat: "https://schema.org/EBook",
      numberOfPages: ebook.pageCount,
      inLanguage: siteConfig.language,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
    }),
    offers: {
      "@type": "Offer",
      url,
      price: ebook.price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Ebooks", item: `${SITE_URL}/ebooks` },
      { "@type": "ListItem", position: 3, name: ebook.title, item: url },
    ],
  };

  const about = (
    <div className={`grid gap-x-6 gap-y-10 md:grid-cols-2 ${ebook.isBundle ? "" : "lg:grid-cols-3"}`} aria-labelledby="audience-heading">
      <div className={`border-t-2 border-ink pt-3.5 ${ebook.isBundle ? "md:col-span-2" : ""}`}>
        <h2 className="display-3">About this {ebook.isBundle ? "bundle" : "book"}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-subtle">{ebook.description}</p>
      </div>
      <div className="border-t-2 border-ink pt-3.5">
        <h2 id="audience-heading" className="display-3">Who this {ebook.isBundle ? "bundle" : "ebook"} is for</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-subtle">{forWhom}</p>
        <h3 className="mt-6 font-semibold">Topics covered</h3>
        <p className="mt-2 text-[16px] text-subtle">{ebook.tags?.join(" · ")}</p>
      </div>
      <div className={`border-t-2 border-ink pt-3.5 ${ebook.isBundle ? "" : "md:col-span-2 lg:col-span-1"}`}>
        <h2 className="display-3">How every question is answered</h2>
        <ol className="mt-3 text-[16px] leading-normal">
          {answerFormat.map((step, i) => (
            <li key={step} className="flex gap-3 border-b border-hair py-1.5">
              <span className="w-4 shrink-0 font-semibold tabular-nums">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[15px] text-subtle">
          Every question runs three pages in this layout.{" "}
          {contents && (
            <>
              <TrackedLink href={`/samples/${ebook.slug}`} eventName="sample_opened" eventProperties={{ location: "product_format", product: ebook.id, kind: "html" }} className="font-semibold text-ink underline underline-offset-4 hover:decoration-2">Read an answer excerpt from this book</TrackedLink>
              {" or "}
            </>
          )}
          <TrackedLink href={SAMPLE_PDF} target="_blank" eventName="sample_opened" eventProperties={{ location: "product_format", product: ebook.id, kind: "pdf" }} className="font-semibold text-ink underline underline-offset-4 hover:decoration-2">download the free {SAMPLE_PDF_QUESTIONS}-question PDF sample</TrackedLink>
          {ebook.slug !== SAMPLE_PDF_BOOK_SLUG && !ebook.isBundle ? ". The PDF sample is from Cloud Platforms, not from this book." : " (from Cloud Platforms)."}
        </p>
      </div>
    </div>
  );

  const checkoutLink = (label: React.ReactNode, className: string) => (
    <TrackedLink
      href={`/checkout?ebook=${ebook.id}`}
      eventName="checkout_started"
      eventProperties={{ product: ebook.id, location: "product_page" }}
      className={className}
    >
      {label}
    </TrackedLink>
  );

  return (
    <main id="main" className="text-[17px]">
      <script
        type="application/ld+json"
        // JSON.stringify escaped for safe inline embedding
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />

      <nav className="wrap py-3 text-[14px] font-medium" aria-label="Breadcrumb">
        <Link href="/" className="underline-offset-4 hover:underline">Home</Link>
        <span className="mx-2 text-subtle" aria-hidden="true">/</span>
        <Link href="/ebooks" className="underline-offset-4 hover:underline">Ebooks</Link>
        <span className="mx-2 text-subtle" aria-hidden="true">/</span>
        <span className="text-subtle">{name}</span>
      </nav>

      <section className={style.fill}>
        <div className="wrap grid grid-cols-1 items-center gap-x-6 gap-y-8 py-10 lg:min-h-[560px] lg:grid-cols-12">
          <div className="w-44 sm:w-60 lg:col-span-5 lg:w-80 lg:justify-self-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ebook.coverUrl}
              alt={`Cover of ${ebook.title}`}
              width={320}
              height={480}
              className={`aspect-[2/3] w-full object-cover outline-2 ${style.onInk ? "outline-ink-rule" : "outline-ink"}`}
            />
          </div>

          <div className="min-w-0 lg:col-span-6 lg:col-start-7">
            <span className={`chip ${style.onInk ? "bg-paper text-ink" : ""}`}>{style.label}</span>
            <h1 className="mt-4">
              <span className="display-1 block">{name}</span>
              {rest && (
                <>
                  <span className="sr-only">: </span>
                  <span className="mt-4 block text-[24px] font-semibold leading-tight">{rest}</span>
                </>
              )}
            </h1>

            <div className="mt-7 border-2 border-ink bg-paper text-ink">
              <p className="meta border-b border-hair px-4 py-3 sm:px-5">
                {ebook.isBundle ? `${totalQuestions} questions` : contents ? `${contents.questionCount} questions` : "Worked interview questions"}
                {chapterCount ? ` · ${chapterCount} chapters` : ""} · {ebook.pageCount} pages · 2026 edition
              </p>
              <ul>
                {!ebook.isBundle && (
                  <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2.5 border-b border-hair px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-5">
                    <p className="col-span-2 sm:col-span-1">
                      <span className="block font-semibold leading-snug">This book</span>
                      <span className="mt-0.5 block text-[14px] leading-snug text-subtle">PDF, {ebook.pageCount} pages, emailed after payment</span>
                    </p>
                    <EbookPrice usdPrice={ebook.price} originalUsdPrice={ebook.originalPrice ?? null} />
                    {checkoutLink(<>Buy<span className="sr-only"> {buyLabel}</span></>, "btn-primary min-w-[76px]")}
                  </li>
                )}
                <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2.5 border-b border-hair px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-5">
                  <p className="col-span-2 sm:col-span-1">
                    <span className="block font-semibold leading-snug">All five books</span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-subtle">
                      {totalQuestions} questions. <BundleSavings savings={savings} />
                    </span>
                  </p>
                  <EbookPrice usdPrice={bundle.price} />
                  {ebook.isBundle ? (
                    checkoutLink(<>Buy<span className="sr-only"> {buyLabel}</span></>, "btn-primary min-w-[76px]")
                  ) : (
                    <TrackedLink
                      href={`/checkout?ebook=${bundle.id}`}
                      eventName="checkout_started"
                      eventProperties={{ product: bundle.id, location: "product_page" }}
                      className="btn-primary min-w-[76px]"
                    >
                      Buy<span className="sr-only"> all five books</span>
                    </TrackedLink>
                  )}
                </li>
                <li className="grid grid-cols-1 items-center gap-x-5 gap-y-1 border-b border-hair px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
                  <p className="min-w-0">
                    <span className="block font-semibold leading-snug">{playbook.title}</span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-subtle">Companion guide for the week of the interview and the day itself</span>
                  </p>
                  <span className="text-[15px] font-medium text-subtle">{ebook.isBundle ? "Included free" : "Free with either"}</span>
                </li>
              </ul>
              <div className="px-4 py-3.5 text-[14px] leading-normal text-subtle sm:px-5">
                <p>
                  India: ₹{ebook.priceINR.toLocaleString("en-IN")}{ebook.isBundle ? "" : ` a book or ₹${bundle.priceINR.toLocaleString("en-IN")} for all five`} via Razorpay (GST included).
                  Elsewhere: ${ebook.price.toFixed(2)}{ebook.isBundle ? "" : ` a book or $${bundle.price.toFixed(2)} for all five`} via PayPal. The exact total is shown before payment.
                  Prices auto-convert to your local currency.
                </p>
                <p className="mt-2.5">
                  {contents ? (
                    <TrackedLink
                      href={`/samples/${ebook.slug}`}
                      eventName="sample_opened"
                      eventProperties={{ location: "product_page", product: ebook.id, kind: "html" }}
                      className="font-semibold text-ink underline underline-offset-4 hover:decoration-2"
                    >
                      Read a sample answer
                    </TrackedLink>
                  ) : (
                    <TrackedLink
                      href={SAMPLE_PDF}
                      target="_blank"
                      eventName="sample_opened"
                      eventProperties={{ location: "product_page", product: ebook.id, kind: "pdf" }}
                      className="font-semibold text-ink underline underline-offset-4 hover:decoration-2"
                    >
                      Read the free {SAMPLE_PDF_QUESTIONS}-question PDF sample
                    </TrackedLink>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap grid grid-cols-1 items-start gap-x-6 gap-y-14 py-12 sm:py-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          {contents && (
            <div aria-labelledby="contents-heading">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 id="contents-heading" className="display-2">Inside</h2>
                <span className="meta text-subtle">{contents.chapters.length} chapters · {contents.questionCount} questions</span>
              </div>
              <p className="mt-3 text-[14px] text-subtle">Chapter titles and question wording are taken from the book itself. Open a chapter to see its first questions.</p>
              <ol className="mt-4 border-t-2 border-ink">
                {contents.chapters.map((chapter, i) => (
                  <li key={chapter.title} className="border-b border-hair">
                    <details className="group" open={i === 0}>
                      <summary className="flex cursor-pointer list-none items-baseline gap-3 py-2.5 [&::-webkit-details-marker]:hidden">
                        <span className="w-12 shrink-0 font-display text-[40px] font-extrabold leading-none tabular-nums" aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="sr-only">Chapter {i + 1}: </span>
                        <span className="min-w-0 flex-1 overflow-x-clip font-semibold leading-snug after:-mr-[calc(100%+0.5rem)] after:mb-[0.3em] after:ml-2 after:inline-block after:w-full after:border-b-2 after:border-dotted after:border-subtle after:content-['']">
                          {chapter.title}
                        </span>
                        <span className="shrink-0 self-[last_baseline] whitespace-nowrap text-[15px] font-medium tabular-nums text-subtle">{chapter.questions.length} questions</span>
                        <span className="relative size-3 shrink-0 self-[last_baseline]" aria-hidden="true">
                          <span className="absolute inset-x-0 top-[5px] h-0.5 bg-ink" />
                          <span className="absolute inset-y-0 left-[5px] w-0.5 bg-ink group-open:hidden" />
                        </span>
                      </summary>
                      <ul className="pb-3 pl-[60px] text-[15px] leading-normal">
                        {chapter.questions.slice(0, 3).map((q) => <li key={q} className="py-1">{q}</li>)}
                        {chapter.questions.length > 3 && <li className="py-1 text-subtle">and {chapter.questions.length - 3} more</li>}
                      </ul>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {ebook.isBundle && (
            <div aria-labelledby="bundle-heading">
              <h2 id="bundle-heading" className="display-2">The five books in this bundle</h2>
              <ul className="mt-5 border-t-2 border-ink">
                {bundleBooks.map((b) => (
                  <li key={b.slug} className="flex gap-3 border-b border-hair py-3">
                    <span className={`mt-[7px] size-3 shrink-0 ${bookStyle(b.id).square}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-snug">
                        <Link href={`/ebooks/${b.slug}`} className="underline-offset-4 hover:underline">{b.title}</Link>
                      </h3>
                      <p className="mt-1 text-[14px] text-subtle">
                        {b.contents ? `${b.contents.questionCount} questions in ${b.contents.chapters.length} chapters` : ""} · {b.pageCount} pages ·{" "}
                        <Link href={`/samples/${b.slug}`} className="text-ink underline underline-offset-4 hover:decoration-2">sample question</Link>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-12" aria-labelledby="before-heading">
            <h2 id="before-heading" className="display-3">Before you pay</h2>
            <dl className="mt-3.5 border-t-2 border-ink text-[15px] leading-normal">
              <div className="grid gap-0.5 border-b border-hair py-3 sm:grid-cols-[112px_1fr] sm:gap-4"><dt className="font-semibold">Format</dt><dd className="text-subtle">PDF, readable on any device. {ebook.pageCount} pages, about {ebook.fileSize}.</dd></div>
              <div className="grid gap-0.5 border-b border-hair py-3 sm:grid-cols-[112px_1fr] sm:gap-4"><dt className="font-semibold">Price and currency</dt><dd className="text-subtle">₹{ebook.priceINR.toLocaleString("en-IN")} (India, Razorpay, GST included) or ${ebook.price.toFixed(2)} (elsewhere, PayPal). No other charges.</dd></div>
              <div className="grid gap-0.5 border-b border-hair py-3 sm:grid-cols-[112px_1fr] sm:gap-4"><dt className="font-semibold">Delivery</dt><dd className="text-subtle">A download link is emailed once the payment is confirmed. The link stays valid for 3 days; reply to the email to get a fresh one.</dd></div>
              <div className="grid gap-0.5 border-b border-hair py-3 sm:grid-cols-[112px_1fr] sm:gap-4"><dt className="font-semibold">Support and refunds</dt><dd className="text-subtle"><Link href="/contact" className="text-ink underline underline-offset-4 hover:decoration-2">Contact us</Link> for delivery problems or duplicate charges. Read the <Link href="/refunds" className="text-ink underline underline-offset-4 hover:decoration-2">refund policy</Link> before buying: digital downloads are final once accessed.</dd></div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-7">
          {excerpt ? (
            <div aria-labelledby="sample-heading">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 id="sample-heading" className="display-2">Sample question</h2>
                {excerptChapter >= 0 && <span className="meta text-subtle">From chapter {excerptChapter + 1}</span>}
              </div>
              <article className="mt-5 border-2 border-ink bg-sheet px-5 pt-7 pb-6 sm:px-10 sm:pt-9 sm:pb-8">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className={`chip ${style.fill}`}>From {style.label}{excerptChapter >= 0 ? `, Ch. ${excerptChapter + 1}` : ""}</span>
                  <span className="meta text-subtle">{excerpt.meta}</span>
                </div>
                <h3 className="mt-5 text-[22px] font-bold leading-snug tracking-[-0.01em] sm:text-[24px]">{excerpt.question}</h3>
                <p className="meta mt-6 text-subtle">What this tests</p>
                <p className="mt-1.5 text-[16px] text-subtle">{lensText}</p>
                <p className="meta mt-6 text-subtle">30-second answer</p>
                <p className="mt-1.5">{excerpt.answer30s}</p>
                <p className="meta mt-6 text-subtle">Recall hook</p>
                <p className="mt-1.5"><span className="bg-highlight px-1.5 py-0.5 font-semibold [box-decoration-break:clone]">{excerpt.recallHook}</span></p>
                <p className="meta mt-6 text-subtle">Follow-ups in the book</p>
                <ul className="mt-2">
                  {excerpt.followups.map((f) => (
                    <li key={f.q} className="relative border-t border-hair py-2 pl-[18px] text-[16px] leading-normal">
                      <span className="absolute top-[17px] left-0 size-2 bg-ink" aria-hidden="true" />
                      {f.q}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t-2 border-ink pt-4 text-[15px] text-subtle">
                  In the book this question runs three pages: it adds a deep dive with a diagram, a decision framework, a
                  pitfalls table and a worked answer to each follow-up.
                </p>
              </article>
            </div>
          ) : (
            about
          )}
        </div>
      </section>

      {excerpt && (
        <section className="border-t-2 border-ink">
          <div className="wrap py-12 sm:py-14">
            {about}
          </div>
        </section>
      )}

      <div className="sticky bottom-0 z-30 flex items-center justify-between gap-4 border-t-2 border-ink bg-paper px-4 py-3 sm:hidden">
        <EbookPrice usdPrice={ebook.price} originalUsdPrice={ebook.originalPrice ?? null} />
        {checkoutLink(`Buy ${buyLabel}`, "btn-primary")}
      </div>
    </main>
  );
}
