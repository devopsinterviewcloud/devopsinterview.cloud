import Link from "next/link";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import NavLink from "@/components/NavLink";

const mainLinks = [
  { href: "/ebooks", label: "Ebooks" },
  { href: "/blog", label: "Blog" },
  { href: "/questions", label: "Questions" },
  { href: "/labs", label: "Free lab" },
  { href: "/podcast", label: "Podcast" },
];

// Phones keep the free sample in the nav in place of the podcast.
const mobileLinks = [...mainLinks.slice(0, 4), { href: "/#free-sample", label: "Free sample" }];

const linkClass =
  "whitespace-nowrap text-[15px] font-semibold leading-none text-ink underline-offset-4 hover:underline aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[6px]";

// Shared site header rendered on every page from the root layout.
export default function SiteHeader() {
  return (
    <header className="border-b border-hair bg-paper">
      <div className="wrap flex h-[60px] items-center gap-4 lg:h-[72px] lg:gap-8">
        <Link
          href="/"
          className="wordmark mr-auto min-w-0 truncate"
        >
          DevOpsInterview.Cloud
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {mainLinks.map((l) => (
              <li key={l.href}><NavLink href={l.href} className={linkClass}>{l.label}</NavLink></li>
            ))}
          </ul>
        </nav>
        <CurrencySwitcher />
      </div>
      <nav aria-label="Mobile navigation" className="border-t border-hair lg:hidden">
        <ul className="wrap flex items-center justify-between gap-3 overflow-x-auto py-3 sm:justify-start sm:gap-7">
          {mobileLinks.map((l) => (
            <li key={l.href} className="shrink-0"><NavLink href={l.href} className={linkClass}>{l.label}</NavLink></li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
