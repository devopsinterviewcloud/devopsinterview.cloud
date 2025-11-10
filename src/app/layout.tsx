import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ComingSoonBanner } from "@/components/ComingSoonBanner";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevopsInterview.Cloud - Master DevOps & Cloud Interview Success",
  description: "Expert-curated DevOps and Cloud ebooks covering AWS, Azure, GCP, Kubernetes, Docker, Terraform, CI/CD. Ace interviews, pass certifications, advance your career with 15,000+ professionals.",
  keywords: "devops interview questions, cloud computing, aws certification, kubernetes tutorial, docker guide, terraform iac, cicd pipelines, devops ebooks, cloud architect, sre interview prep",
  authors: [{ name: "DevopsInterview.Cloud" }],
  creator: "DevopsInterview.Cloud",
  publisher: "DevopsInterview.Cloud",
  metadataBase: new URL('https://devopsinterview.cloud'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://devopsinterview.cloud',
    siteName: 'DevopsInterview.Cloud',
    title: 'DevopsInterview.Cloud - Master DevOps & Cloud Interview Success',
    description: 'Expert-curated DevOps and Cloud ebooks covering AWS, Azure, GCP, Kubernetes, Docker, Terraform, CI/CD. Ace interviews, pass certifications, advance your career.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DevopsInterview.Cloud - Master DevOps & Cloud Technologies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@devopsinterviewcloud',
    creator: '@devopsinterviewcloud',
    title: 'DevopsInterview.Cloud - Master DevOps & Cloud Interview Success',
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
        <ComingSoonBanner />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
