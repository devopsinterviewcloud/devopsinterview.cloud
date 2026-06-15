# Technical SEO + Next.js Routing Audit — devopsinterview.cloud

Date: 2026-06-14
Scope: READ-ONLY audit. App Router (Next.js), `src/app/*`, metadata, sitemap, robots, JSON-LD structured data.

## Summary by severity

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High     | 4 |
| Medium   | 6 |
| Low      | 5 |

Most serious finding: **fake `aggregateRating` (fabricated reviews/ratings) in Book JSON-LD on the homepage** — a Google structured-data policy violation that can trigger manual action / rich-result penalties.

---

## Findings (most serious first)

| # | Severity | file:line | Issue | Fix |
|---|----------|-----------|-------|-----|
| 1 | **Critical** | `src/app/page.tsx:48-54` | **Fabricated `aggregateRating` in Book JSON-LD.** Each ItemList Book emits `aggregateRating` with `ratingValue: ebook.rating` and `reviewCount: ebook.reviews` sourced from `ebooks.json` (e.g. 5.0 / 342 reviews, 524 reviews on the bundle). There is no real review system — these are invented numbers. Google policy forbids self-serving/fake review markup; this risks a Structured Data manual action and loss of all rich results sitewide. The matching star ratings shown in the visible UI (`page.tsx:253-259`) are also fake "social proof". | Remove the `aggregateRating` block from JSON-LD entirely (and the `rating`/`reviews` star UI), OR only emit `aggregateRating` backed by a genuine, verifiable review collection mechanism that also displays reviews on-page. |
| 2 | **Critical** | `src/data/ebooks.json` vs `data/ebooks.json` | **Two divergent `ebooks.json` files with different slugs.** The app imports `@/data/ebooks.json` → `src/data/ebooks.json` (6 entries: `cloud-interview-mastery`, `container-orchestration-journey`, `infrastructure-automation-mastery`, `modern-cicd-gitops`, `senior-devops-handbook`, `complete-devops-mastery-bundle`). The root `data/ebooks.json` is a stale orphan with completely different slugs (`aws-solution-architect-guide`, `kubernetes-mastery`, `terraform-infrastructure-code`, `docker-containerization-guide`, `devops-interview-questions`, `azure-devops-pipeline`) and cover paths that **do not exist** in `public/ebook-covers/`. Not currently 404-ing (orphan is unused), but it is a live trap: any future import of the wrong file, or a build tool/script reading root `data/`, will produce sitemap entries and pages that 404 and broken covers. | Delete the orphan `data/ebooks.json` (and root `lib/` duplicates of `src/lib`) so there is a single source of truth. Verified current sitemap/pages resolve correctly against `src/data`. |
| 3 | **High** | `src/app/sitemap.ts:45-50` | **`/checkout` is listed in the sitemap** with priority 0.7. Checkout is a transactional `'use client'` page (`src/app/checkout/page.tsx:1`) with no canonical and no indexable content; it should not be crawled/indexed. | Remove `/checkout` from the sitemap and add it (plus `?ebook=` variants) to robots `Disallow`, or mark the page `robots: { index: false }`. |
| 4 | **High** | `src/app/checkout/page.tsx`, `src/app/contact/page.tsx` | **No `noindex` on transactional/utility pages.** Checkout has no metadata export at all (client component) and Contact relies only on title/description. Both are thin/transactional and inherit the site default `index: true` from `layout.tsx:53-63`. | Add `robots: { index: false, follow: true }` metadata to checkout (via a `layout.tsx` since the page is client) and optionally contact. Remove checkout from sitemap (see #3). |
| 5 | **High** | `src/app/sitemap.ts:5`, `layout.tsx:25`, `src/app/page.tsx`, `[slug]/page.tsx:7` | **Hardcoded apex host everywhere; `NEXT_PUBLIC_APP_URL` ignored for SEO.** Canonicals, OG URLs, JSON-LD URLs and metadataBase all hardcode `https://devopsinterview.cloud`, while `config/site.ts:4` and `lib/email.ts` use `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`). Two sources of truth for the host. If the site is actually served from `www.` (or a preview/staging domain), every canonical points at the apex and may mismatch the served host, causing canonical/host inconsistency. | Centralize the canonical host (single constant or `NEXT_PUBLIC_APP_URL`) and reuse it in `layout.tsx` metadataBase, sitemap, `[slug]` and `page.tsx` JSON-LD. Confirm apex vs www is enforced with a 301 redirect at the DNS/host layer (no redirect rule found in `next.config.js` or `vercel.json`). |
| 6 | **High** | `src/app/page.tsx:48-54` | **Book schema is misused for products being sold + risky offer pairing.** Each item is `@type: Book` with an `offers` block and `aggregateRating`. For sellable digital products Google generally expects `Product` (or `Book` with a `workExample`/`offers` that has `priceValidUntil`, which is present). Combined with the fake rating (#1) this is the exact pattern that triggers "Reviews/ratings" rich-result rejections. | After removing fake ratings, keep `Book` + `offers` (valid for ebooks) and ensure `offers.priceValidUntil` (present, `page.tsx:46`) and `priceCurrency` stay accurate. Do not re-add ratings without real reviews. |
| 7 | **Medium** | `src/app/ebooks/[slug]/page.tsx:108-114` | **Cover image uses raw `<img>` instead of `next/image`** (eslint disabled inline). Loses automatic AVIF/WebP, responsive `srcset`, and lazy loading configured in `next.config.js` images block. Alt text is fine (`Cover of ${title}`). | Use `next/image` `<Image>` with `width/height` as on the homepage (`page.tsx:216`). |
| 8 | **Medium** | `src/app/ebooks/[slug]/page.tsx` (no `aggregateRating`) vs `src/app/page.tsx:48` | **JSON-LD inconsistency between detail and list pages.** The per-ebook `Book` JSON-LD (detail page) correctly omits ratings, but the homepage ItemList for the same books includes fabricated ratings. Inconsistent structured data for the same `@id` (same canonical URL) is a quality signal risk. | Make both emit identical, rating-free Book schema for the same `@id`. |
| 9 | **Medium** | `src/app/sitemap.ts:11,18,...` | **All `lastModified` set to `new Date()` (build/request time).** Every URL reports "modified now" on each generation, which is noise and can reduce crawl-priority trust. | Use real content timestamps (e.g. a `lastModified` field per ebook, or the file mtime / a fixed release date). |
| 10 | **Medium** | `src/app/page.tsx:25-65` | **No `Organization` JSON-LD; `WebSite` lacks `potentialAction` (SiteSearch) and there is no `BreadcrumbList`.** The homepage emits `WebSite` + `ItemList` only. The publisher is described inline but there is no standalone `Organization` node with `sameAs` social links (which exist in `config/site.ts:socialLinks`). | Add an `Organization` JSON-LD node (logo + `sameAs` to YouTube/Twitter/LinkedIn/GitHub). Add `BreadcrumbList` JSON-LD on the ebook detail pages (visual breadcrumb already exists at `[slug]/page.tsx:97-103`). |
| 11 | **Medium** | `config/site.ts` (orphan) | **`config/site.ts` is unused by the app** (no import found in `src/`) yet contains the authoritative keywords, social links, nav, and `NEXT_PUBLIC_APP_URL`-based URL. Metadata in `layout.tsx` duplicates a divergent keyword/description set. Drift risk + dead config. | Either wire `layout.tsx`/JSON-LD to consume `config/site.ts` (preferred), or delete it. Note `config/site.ts` lists `phone: "+1 (555) 123-4567"` (placeholder) and nav links to `/podcast` and `#certifications` that have no route/section. |
| 12 | **Medium** | `src/app/page.tsx:81` + `layout.tsx:80` | **Two stacked sticky bars (`ComingSoonBanner` sticky `top-0 z-50` + homepage nav sticky `top-0 z-40`).** Cosmetic/CLS/UX, but the "🚀 Coming Soon!" banner on a live storefront undermines the "Buy Now" CTAs and the InStock offer schema (mixed signals to users and crawlers). | Remove/relocate the Coming Soon banner if the store is live, or reconcile availability messaging with `availability: InStock` in JSON-LD. |
| 13 | **Low** | `layout.tsx:18-68` | **No `title.template` and no explicit `icons` metadata.** Child pages set full titles manually (works, but repetitive). `favicon.ico` exists at `src/app/favicon.ico` (auto-served), but no `apple-touch-icon` / `icon` sizes declared. | Add `title: { default, template: '%s | DevOpsInterview.Cloud' }` and an `icons` field; add an apple-touch-icon. |
| 14 | **Low** | `layout.tsx:26-28` | **Root canonical is `'/'` only; no per-page canonicals on legal/contact pages.** Static pages (terms/privacy/refunds/shipping/contact) set OG `url` but no `alternates.canonical`. They inherit metadataBase but not an explicit canonical, so canonical defaults to the requested URL (acceptable, but explicit is safer with query strings/trailing slashes). | Add `alternates: { canonical: '/terms' }` etc. to each static page's metadata. |
| 15 | **Low** | `src/app/shipping/page.tsx:4` | **Shipping page metadata has no `openGraph`** (other legal pages do). Minor inconsistency. | Add an `openGraph` block for parity. |
| 16 | **Low** | `public/robots.txt:17-30` | **Robots blocks AI crawlers (GPTBot, CCBot, anthropic-ai, Claude-Web) but not Google-Extended / Applebot / PerplexityBot, and `Disallow: /admin/` references a non-existent route.** Not harmful; just incomplete/aspirational. Sitemap reference and Googlebot/Bingbot allows are correct. | Optional: add `Google-Extended`, `Applebot-Extended`, `PerplexityBot` if AI-blocking is the intent. |
| 17 | **Low** | `src/app/page.tsx:218` | **Homepage cover `alt` is keyword-stuffed** (`"<title> - DevOps ebook cover featuring <category> concepts and <tags> technologies for <pageCount> pages..."`). Reads as alt-text spam to crawlers. | Use a concise human alt, e.g. `Cover of ${ebook.title}` as the detail page does. |

---

## Verified OK (no action)

- **Sitemap slugs resolve.** All 6 `ebookPages` URLs in `sitemap.ts` map to slugs present in `src/data/ebooks.json`, and `generateStaticParams` (`[slug]/page.tsx:29-31`) is built from the same file — no 404s from the live sitemap. Static page URLs (`/`, `/privacy`, `/terms`, `/contact`, `/refunds`, `/shipping`) all have matching routes. (`/checkout` listed but see #3.)
- **Cover images all exist.** Every `coverUrl` in `src/data/ebooks.json` has a matching file in `public/ebook-covers/` (cloud-mastery, containers-kubernetes, iac-automation, cicd-gitops, devops-mastery, bundle-complete).
- **`metadataBase` is set** (`layout.tsx:25`) → relative OG image `/og-image.jpg` resolves; `og-image.jpg` exists and is exactly 1200x630 (matches declared dimensions).
- **One `<h1>` per page** verified on homepage (`page.tsx:116`) and each static/detail page.
- **Per-ebook canonical, OpenGraph, Twitter** are correct (`[slug]/page.tsx:44-56`) and the detail-page Book JSON-LD has a valid `offers` (price `.toFixed(2)`, `priceCurrency: USD`, `availability: InStock`) and **no fake rating**.
- **JSON-LD XSS-escaping**: detail page escapes `<` (`[slug]/page.tsx:94`); homepage uses `next/script` with raw stringify (acceptable for controlled data).
- **`lang="en"`** set on `<html>` (`layout.tsx:76`). Robots default index/follow correct for indexable pages.
- **Currency consistency**: JSON-LD prices are USD and `ebook.price` is the USD value; INR shown via client conversion (`EbookPrice`). No currency mismatch in structured data.

---

## Priority order to fix

1. (#1) Remove fabricated `aggregateRating` from homepage JSON-LD — policy violation.
2. (#2) Delete orphan root `data/ebooks.json` (and duplicate root `lib/`) — single source of truth.
3. (#3,#4) Drop `/checkout` from sitemap + add `noindex` to checkout.
4. (#5) Unify canonical host and confirm apex/www 301.
