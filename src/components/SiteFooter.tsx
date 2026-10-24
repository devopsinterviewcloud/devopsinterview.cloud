import Link from "next/link";
import { YOUTUBE_URL } from "@/lib/podcast";

const siteLinks = [
  { href: "/ebooks", label: "Ebooks" },
  { href: "/blog", label: "Blog" },
  { href: "/questions", label: "Questions" },
  { href: "/labs", label: "Free lab" },
  { href: "/podcast", label: "Podcast" },
  { href: "/contact", label: "Contact" },
];

const policyLinks = [
  { href: "/refunds", label: "Refund policy" },
  { href: "/shipping", label: "Shipping & delivery" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function SiteFooter() {
  return (
    <footer className="on-ink mt-auto bg-ink text-white">
      <div className="wrap pt-7 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-12">
          <Link href="/" className="wordmark">
            DevOpsInterview.Cloud
          </Link>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-7 gap-y-3 text-[15px] font-semibold leading-snug">
              {siteLinks.map((l) => (
                <li key={l.href}><Link href={l.href} className="underline-offset-4 hover:underline">{l.label}</Link></li>
              ))}
              <li><a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">YouTube</a></li>
            </ul>
          </nav>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-ink-rule pt-4 text-[14px] text-ink-subtle sm:flex-row sm:flex-wrap sm:justify-between">
          <span>&copy; 2026 DevOpsInterview.Cloud</span>
          <ul className="flex flex-wrap gap-x-7 gap-y-2 font-medium">
            {policyLinks.map((l) => (
              <li key={l.href}><Link href={l.href} className="underline-offset-4 hover:text-white hover:underline">{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
