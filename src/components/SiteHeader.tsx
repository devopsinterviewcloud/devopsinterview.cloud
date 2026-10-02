import Link from "next/link";
import CurrencySwitcher from "@/components/CurrencySwitcher";

// Shared site header rendered on every page from the root layout. Section links
// point at "/#..." so they work from any route (navigate home, then scroll).
export default function SiteHeader() {
  return (
    <nav className="sticky top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 min-[360px]:flex">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h5v7l9-11h-5z" />
              </svg>
            </div>
            <span className="truncate text-sm font-bold text-foreground min-[360px]:text-base sm:text-xl">DevOpsInterview.Cloud</span>
          </Link>
          <div className="ml-2 flex shrink-0 items-center gap-2 xl:gap-8">
            <div className="hidden xl:flex items-center space-x-8">
              <Link href="/#ebooks" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Ebooks</Link>
              <Link href="/#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Categories</Link>
              <Link href="/#interview-prep" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Interview Prep</Link>
              <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
              <Link href="/#youtube" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">YouTube</Link>
              <Link href="/#ebooks" className="btn-primary">Get Started</Link>
            </div>
            <CurrencySwitcher />
          </div>
        </div>
        <div className="flex items-center gap-5 overflow-x-auto border-t border-slate-100 py-2 xl:hidden" aria-label="Mobile navigation">
          <Link href="/ebooks" className="shrink-0 text-sm font-medium text-foreground">Ebooks</Link>
          <Link href="/blog" className="shrink-0 text-sm font-medium text-foreground">Blog</Link>
          <Link href="/labs" className="shrink-0 text-sm font-medium text-foreground">Free lab</Link>
          <Link href="/#free-sample" className="shrink-0 text-sm font-semibold text-blue-700">Free sample</Link>
        </div>
      </div>
    </nav>
  );
}
