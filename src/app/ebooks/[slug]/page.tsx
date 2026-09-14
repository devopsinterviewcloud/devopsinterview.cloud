import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ebooksData from "@/data/ebooks.json";
import EbookPrice from "@/components/EbookPrice";
import { siteConfig, truncateMetadataText } from "@/config/site";
import TrackedLink from "@/components/TrackedLink";
import BundleSavings from "@/components/BundleSavings";
import { bundleSavings, getContents, singleBooks, totalQuestions, SAMPLE_PDF, SAMPLE_PDF_BOOK_SLUG, SAMPLE_PDF_QUESTIONS } from "@/lib/catalog";

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
  "container-orchestration-journey": "Engineers preparing for Docker, Kubernetes, platform engineering, and production troubleshooting rounds.",
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
    "container-orchestration-journey": "Docker & Kubernetes Interview Ebook | DevOps Prep",
    "infrastructure-automation-mastery": "Terraform & OpenTofu Interview Ebook | DevOps Prep",
    "modern-cicd-gitops": "CI/CD & GitOps Interview Ebook | DevOps Prep",
    "senior-devops-handbook": "DevOps & SRE Interview Ebook | DevOpsInterview.Cloud",
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
  const savings = ebook.isBundle ? bundleSavings() : null;
  const bundleBooks = ebook.isBundle ? singleBooks.map((b) => ({ ...b, contents: getContents(b.slug) })) : [];

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

  return (
    <main id="main" className="container mx-auto px-4 py-12 max-w-5xl">
      <script
        type="application/ld+json"
        // JSON.stringify escaped for safe inline embedding
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />

      <nav className="text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/ebooks" className="hover:underline">Ebooks</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ebook.title}</span>
      </nav>

      <div className="grid gap-7 md:grid-cols-[320px_1fr] md:gap-10">
        <div className="order-2 mx-auto w-full max-w-[170px] md:order-1 md:max-w-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ebook.coverUrl}
            alt={`Cover of ${ebook.title}`}
            width={320}
            height={480}
            className="w-full rounded-xl border shadow-sm"
          />
        </div>

        <div className="order-1 md:order-2">
          {ebook.category && (
            <span className="inline-block text-xs font-semibold uppercase tracking-wide text-blue-700 bg-blue-100 rounded-full px-3 py-1 mb-3">
              {ebook.category}
            </span>
          )}
          <h1 className="text-3xl font-bold text-foreground mb-4">{ebook.title}</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">{ebook.description}</p>

          <div className="mb-6">
            <EbookPrice usdPrice={ebook.price} originalUsdPrice={ebook.originalPrice ?? null} />
            <p className="text-xs text-muted-foreground mt-1">Prices auto-convert to your local currency.</p>
          </div>

          <ul className="text-sm text-foreground space-y-2 mb-8">
            <li>✓ PDF, {ebook.pageCount} pages{ebook.isBundle ? " across five books" : ""}</li>
            <li>✓ {ebook.isBundle ? `${totalQuestions} questions` : contents ? `${contents.questionCount} questions in ${contents.chapters.length} chapters` : "Worked interview questions"}, each with a 30-second answer, deep dive, tradeoffs and follow-ups</li>
            <li>✓ Delivered by email after payment is confirmed; download link valid for 3 days and re-sent on request</li>
            <li>✓ Free Interview-Day Playbook included</li>
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TrackedLink
            href={`/checkout?ebook=${ebook.id}`}
            eventName="checkout_started"
            eventProperties={{ product: ebook.id, location: "product_page" }}
            className="btn-primary inline-flex items-center justify-center px-8 py-3 text-base"
          >
            Buy {ebook.isBundle ? "the bundle" : "this ebook"}
          </TrackedLink>
          {contents ? (
            <TrackedLink
              href={`/samples/${ebook.slug}`}
              eventName="sample_opened"
              eventProperties={{ location: "product_page", product: ebook.id, kind: "html" }}
              className="inline-flex items-center justify-center px-5 py-3 font-semibold text-blue-700 hover:underline"
            >
              Read a sample answer
            </TrackedLink>
          ) : (
            <TrackedLink
              href={SAMPLE_PDF}
              target="_blank"
              eventName="sample_opened"
              eventProperties={{ location: "product_page", product: ebook.id, kind: "pdf" }}
              className="inline-flex items-center justify-center px-5 py-3 font-semibold text-blue-700 hover:underline"
            >
              Read the free {SAMPLE_PDF_QUESTIONS}-question PDF sample
            </TrackedLink>
          )}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            India: ₹{ebook.priceINR.toLocaleString("en-IN")} via Razorpay (GST included). Elsewhere: ${ebook.price.toFixed(2)} via PayPal. The exact total is shown before payment.
          </p>
          {savings && <p className="mt-2 text-sm font-medium text-emerald-700"><BundleSavings savings={savings} /></p>}

          {ebook.tags && ebook.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {ebook.tags.map((t) => (
                <span key={t} className="text-xs bg-slate-100 text-slate-700 rounded px-2 py-1">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="mt-14 grid gap-8 border-t border-slate-200 pt-10 md:grid-cols-2" aria-labelledby="audience-heading">
        <div>
          <h2 id="audience-heading" className="text-2xl font-bold text-foreground">Who this {ebook.isBundle ? "bundle" : "ebook"} is for</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{forWhom}</p>
          <h3 className="mt-7 text-lg font-semibold text-foreground">Topics covered</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {ebook.tags?.map((tag) => <li key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{tag}</li>)}
          </ul>
        </div>
        <div className="rounded-xl bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-foreground">How every question is answered</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {answerFormat.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="mt-5 text-sm text-muted-foreground">
            Every question runs three pages in this layout.{" "}
            {contents && (
              <>
                <TrackedLink href={`/samples/${ebook.slug}`} eventName="sample_opened" eventProperties={{ location: "product_format", product: ebook.id, kind: "html" }} className="font-semibold text-blue-700 hover:underline">Read an answer excerpt from this book</TrackedLink>
                {" or "}
              </>
            )}
            <TrackedLink href={SAMPLE_PDF} target="_blank" eventName="sample_opened" eventProperties={{ location: "product_format", product: ebook.id, kind: "pdf" }} className="font-semibold text-blue-700 hover:underline">download the free {SAMPLE_PDF_QUESTIONS}-question PDF sample</TrackedLink>
            {ebook.slug !== SAMPLE_PDF_BOOK_SLUG && !ebook.isBundle ? ". The PDF sample is from Cloud Interview Mastery, not from this book." : " (from Cloud Interview Mastery)."}
          </p>
        </div>
      </section>

      {contents && (
        <section className="mt-12" aria-labelledby="contents-heading">
          <h2 id="contents-heading" className="text-2xl font-bold text-foreground">Inside the book: {contents.questionCount} questions in {contents.chapters.length} chapters</h2>
          <p className="mt-2 text-sm text-muted-foreground">Chapter titles and question wording are taken from the book itself.</p>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {contents.chapters.map((chapter, i) => (
              <li key={chapter.title} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-foreground">Chapter {i + 1}: {chapter.title} <span className="font-normal text-muted-foreground">({chapter.questions.length} questions)</span></h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {chapter.questions.slice(0, 3).map((q) => <li key={q}>• {q}</li>)}
                  {chapter.questions.length > 3 && <li className="text-muted-foreground">and {chapter.questions.length - 3} more</li>}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}

      {ebook.isBundle && (
        <section className="mt-12" aria-labelledby="bundle-heading">
          <h2 id="bundle-heading" className="text-2xl font-bold text-foreground">The five books in this bundle</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {bundleBooks.map((b) => (
              <li key={b.slug} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-foreground">
                  <Link href={`/ebooks/${b.slug}`} className="hover:text-blue-700 hover:underline">{b.title}</Link>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {b.contents ? `${b.contents.questionCount} questions in ${b.contents.chapters.length} chapters` : ""} · {b.pageCount} pages ·{" "}
                  <Link href={`/samples/${b.slug}`} className="text-blue-700 hover:underline">sample question</Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 rounded-xl border border-slate-200 p-6" aria-labelledby="before-heading">
        <h2 id="before-heading" className="text-xl font-bold text-foreground">Before you pay</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-foreground">Format</dt><dd className="text-slate-700">PDF, readable on any device. {ebook.pageCount} pages, about {ebook.fileSize}.</dd></div>
          <div><dt className="font-semibold text-foreground">Price and currency</dt><dd className="text-slate-700">₹{ebook.priceINR.toLocaleString("en-IN")} (India, Razorpay, GST included) or ${ebook.price.toFixed(2)} (elsewhere, PayPal). No other charges.</dd></div>
          <div><dt className="font-semibold text-foreground">Delivery</dt><dd className="text-slate-700">A download link is emailed once the payment is confirmed. The link stays valid for 3 days; reply to the email to get a fresh one.</dd></div>
          <div><dt className="font-semibold text-foreground">Support and refunds</dt><dd className="text-slate-700"><Link href="/contact" className="text-blue-700 hover:underline">Contact us</Link> for delivery problems or duplicate charges. Read the <Link href="/refunds" className="text-blue-700 hover:underline">refund policy</Link> before buying: digital downloads are final once accessed.</dd></div>
        </dl>
      </section>
    </main>
  );
}
