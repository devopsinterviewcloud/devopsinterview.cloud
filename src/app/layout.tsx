import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import SiteHeader from "@/components/SiteHeader";
import CookieConsent from "@/components/CookieConsent";
// Vercel Web Analytics is cookieless, so we run it un-gated (the consent gate
// hid essentially all real traffic). Keep custom event payloads free of
// personal data (no emails / order ids). The consent banner stays for any
// future cookie-based tools, which DO need gating.
import { Analytics } from "@vercel/analytics/react";
import { absoluteUrl, siteConfig } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevOps Interview Ebooks & Incident Labs | Cloud Prep",
  description: "Prepare for senior DevOps, cloud, and SRE interviews with 250+ worked questions across five practical ebooks, browser-based incident labs, and study roadmaps.",
  keywords: "devops interview questions, cloud computing, aws certification, kubernetes tutorial, docker guide, terraform iac, cicd pipelines, devops ebooks, cloud architect, sre interview prep",
  authors: [{ name: "DevOpsInterview.Cloud" }],
  creator: "DevOpsInterview.Cloud",
  publisher: "DevOpsInterview.Cloud",
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: 'DevOps Interview Ebooks & Incident Labs | Cloud Prep',
    description: 'Prepare for senior DevOps, cloud, and SRE interviews with worked questions, practical ebooks, and browser-based incident labs.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DevOpsInterview.Cloud - Master DevOps & Cloud Technologies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    // Add site/creator only after the owner supplies a real X handle (15 characters max).
    title: 'DevOps Interview Ebooks & Incident Labs | Cloud Prep',
    description: 'Prepare for senior DevOps, cloud, and SRE interviews with worked questions, ebooks, and incident labs.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Google Search Console (and Bing) site verification via the HTML-tag method.
  // Set GOOGLE_SITE_VERIFICATION (and optionally a Bing code) in Vercel env vars;
  // Next omits the tag automatically when the value is unset.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
      : {},
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/logo.png"),
    email: siteConfig.email,
    description: "Publisher of senior-level DevOps, cloud, and SRE interview preparation resources.",
  };
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: "DevOps, cloud, and SRE interview preparation ebooks and interactive incident labs.",
    publisher: { "@id": `${siteConfig.url}/#organization` },
    inLanguage: siteConfig.language,
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          id="structured-data-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData).replace(/</g, "\\u003c") }}
        />
        <script
          id="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData).replace(/</g, "\\u003c") }}
        />
        <CurrencyProvider>
          <SiteHeader />
          {children}
          <CookieConsent />
          <Analytics />
        </CurrencyProvider>
      </body>
    </html>
  );
}
