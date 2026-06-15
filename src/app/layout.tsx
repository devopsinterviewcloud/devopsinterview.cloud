import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import CookieConsent from "@/components/CookieConsent";
import ConsentedAnalytics from "@/components/ConsentedAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevOpsInterview.Cloud - Master DevOps & Cloud Interview Success",
  description: "Expert-curated DevOps and Cloud ebooks covering AWS, Azure, GCP, Kubernetes, Docker, Terraform, CI/CD. Ace interviews, pass certifications, and advance your career with 250+ senior-level interview questions across five books.",
  keywords: "devops interview questions, cloud computing, aws certification, kubernetes tutorial, docker guide, terraform iac, cicd pipelines, devops ebooks, cloud architect, sre interview prep",
  authors: [{ name: "DevOpsInterview.Cloud" }],
  creator: "DevOpsInterview.Cloud",
  publisher: "DevOpsInterview.Cloud",
  metadataBase: new URL('https://devopsinterview.cloud'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://devopsinterview.cloud',
    siteName: 'DevOpsInterview.Cloud',
    title: 'DevOpsInterview.Cloud - Master DevOps & Cloud Interview Success',
    description: 'Expert-curated DevOps and Cloud ebooks covering AWS, Azure, GCP, Kubernetes, Docker, Terraform, CI/CD. Ace interviews, pass certifications, advance your career.',
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
    site: '@devopsinterviewcloud',
    creator: '@devopsinterviewcloud',
    title: 'DevOpsInterview.Cloud - Master DevOps & Cloud Interview Success',
    description: 'Expert-curated DevOps and Cloud ebooks covering AWS, Azure, GCP, Kubernetes, Docker, Terraform, CI/CD.',
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
  // Add Google Search Console verification code when available
  // verification: {
  //   google: 'your-google-verification-code',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CurrencyProvider>
          {children}
          <CookieConsent />
          <ConsentedAnalytics />
        </CurrencyProvider>
      </body>
    </html>
  );
}
