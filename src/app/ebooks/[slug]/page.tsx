import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ebooksData from "@/data/ebooks.json";
import EbookPrice from "@/components/EbookPrice";
import { siteConfig, truncateMetadataText } from "@/config/site";
import TrackedLink from "@/components/TrackedLink";

const SITE_URL = siteConfig.url;

type Ebook = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
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

const productDetails: Record<string, { forWhom: string; questions: string[] }> = {
  "cloud-interview-mastery": {
    forWhom: "DevOps engineers, cloud engineers, and architects preparing for interviews that compare AWS, Azure, and GCP services and design tradeoffs.",
    questions: ["How would you design multi-region disaster recovery?", "How do you diagnose an unexpected cloud-cost increase?", "When would you choose containers over serverless?"],
  },
  "container-orchestration-journey": {
    forWhom: "Engineers preparing for Docker, Kubernetes, platform engineering, and production troubleshooting rounds.",
    questions: ["Why is a Kubernetes Pod stuck in Pending?", "How would you debug intermittent service-to-service failures?", "How do you secure a container supply chain?"],
  },
  "infrastructure-automation-mastery": {
    forWhom: "Engineers interviewing for roles that use Terraform or OpenTofu to manage infrastructure safely at scale.",
    questions: ["How do you recover from Terraform state drift?", "How would you structure modules across many accounts?", "What belongs in an infrastructure CI pipeline?"],
  },
  "modern-cicd-gitops": {
    forWhom: "DevOps and platform engineers preparing to discuss pipeline design, GitOps, progressive delivery, and software supply-chain security.",
    questions: ["How do you make a deployment pipeline both fast and safe?", "When should you use canary instead of blue-green delivery?", "How do you roll back a database migration?"],
  },
  "senior-devops-handbook": {
    forWhom: "Senior DevOps and SRE candidates preparing for reliability, observability, incident response, and technical leadership interviews.",
    questions: ["How do you choose an SLO and error budget?", "What makes an alert actionable?", "How would you lead a high-severity incident?"],
  },
  "complete-devops-mastery-bundle": {
    forWhom: "Candidates who want the full five-book path across cloud, Kubernetes, infrastructure as code, delivery, SRE, and reliability.",
    questions: ["Design a reliable multi-cloud platform from first principles.", "Trace a production failure from deployment through Kubernetes and observability.", "Explain the tradeoffs behind your architecture to an interviewer."],
  },
};

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
  const details = productDetails[ebook.slug];

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
            <li>✓ PDF format, instant digital delivery by email</li>
            <li>{ebook.pageCount} pages</li>
            <li>✓ Free Interview-Day Playbook included</li>
            <li>✓ Worked answers with tradeoffs and follow-up questions</li>
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
          <TrackedLink
            href="/samples/cloud-interview-mastery-sample.pdf"
            target="_blank"
            eventName="sample_opened"
            eventProperties={{ location: "product_page", product: ebook.id }}
            className="inline-flex items-center justify-center px-5 py-3 font-semibold text-blue-700 hover:underline"
          >
            Read the free Cloud ebook sample
          </TrackedLink>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Secure checkout via Razorpay in India or PayPal elsewhere. The exact total is shown before payment.
          </p>

          {ebook.tags && ebook.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {ebook.tags.map((t) => (
                <span key={t} className="text-xs bg-slate-100 text-slate-700 rounded px-2 py-1">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {details && (
        <section className="mt-14 grid gap-8 border-t border-slate-200 pt-10 md:grid-cols-2" aria-labelledby="inside-heading">
          <div>
            <h2 id="inside-heading" className="text-2xl font-bold text-foreground">Who this ebook is for</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{details.forWhom}</p>
            <h3 className="mt-7 text-lg font-semibold text-foreground">Topics covered</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {ebook.tags?.map((tag) => <li key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{tag}</li>)}
            </ul>
          </div>
          <div className="rounded-xl bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-foreground">Illustrative interview prompts</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {details.questions.map((question) => <li key={question}>• {question}</li>)}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">These prompts illustrate the listed themes. The free PDF is an eight-question sample from Cloud Interview Mastery and shows the worked-answer format.</p>
          </div>
        </section>
      )}
    </main>
  );
}
