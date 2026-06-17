import Link from "next/link";
import CurrencySwitcher from "@/components/CurrencySwitcher";

// Shared site header rendered on every page from the root layout. Section links
// point at "/#..." so they work from any route (navigate home, then scroll).
export default function SiteHeader() {
  return (
    <nav className="sticky top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h5v7l9-11h-5z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">DevOpsInterview.Cloud</span>
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#ebooks" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Ebooks</Link>
              <Link href="/#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Categories</Link>
              <Link href="/#interview-prep" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Interview Prep</Link>
              <Link href="/#youtube" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">YouTube</Link>
              <Link href="/#ebooks" className="btn-primary">Get Started</Link>
            </div>
            <CurrencySwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
