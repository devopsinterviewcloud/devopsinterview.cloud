import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ebooksData from "@/data/ebooks.json";
import EbookPrice from "@/components/EbookPrice";

const SITE_URL = "https://devopsinterview.cloud";

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
};

const ebooks = ebooksData as Ebook[];

function getEbook(slug: string) {
  return ebooks.find((e) => e.slug === slug);
}

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
  const title = `${ebook.title} | DevOpsInterview.Cloud`;
  const description = ebook.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: `${SITE_URL}${ebook.coverUrl}`, width: 800, height: 1200, alt: ebook.title }],
    },
    twitter: { card: "summary_large_image", title, description },
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

  const url = `${SITE_URL}/ebooks/${ebook.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": url,
    name: ebook.title,
    description: ebook.description,
    bookFormat: "https://schema.org/EBook",
    numberOfPages: ebook.pageCount,
    image: `${SITE_URL}${ebook.coverUrl}`,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: "DevOpsInterview.Cloud" },
    offers: {
      "@type": "Offer",
      url,
      price: ebook.price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main id="main" className="container mx-auto px-4 py-12 max-w-5xl">
      <script
        type="application/ld+json"
        // JSON.stringify escaped for safe inline embedding
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav className="text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/#ebooks" className="hover:underline">Ebooks</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ebook.title}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-[320px_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ebook.coverUrl}
            alt={`Cover of ${ebook.title}`}
            width={320}
            height={480}
            className="w-full rounded-xl border shadow-sm"
          />
        </div>

        <div>
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
            <li>PDF format, instant digital download</li>
            <li>{ebook.pageCount} pages</li>
            <li>Lifetime access</li>
          </ul>

          <Link
            href={`/checkout?ebook=${ebook.id}`}
            className="btn-primary inline-flex items-center justify-center px-8 py-3 text-base"
          >
            Buy Now
          </Link>

          {ebook.tags && ebook.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {ebook.tags.map((t) => (
                <span key={t} className="text-xs bg-slate-100 text-slate-700 rounded px-2 py-1">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
