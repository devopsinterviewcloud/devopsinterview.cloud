import type { Metadata } from "next";

export const siteConfig = {
  name: "DevOpsInterview.Cloud",
  url: "https://devopsinterview.cloud",
  email: "devopsinterview.cloud@gmail.com",
  locale: "en_US",
  language: "en-US",
  ogImage: "/og-image.jpg",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  robots?: Metadata["robots"];
};

/** Build complete metadata without inheriting the homepage canonical. */
export function createPageMetadata({
  title,
  description,
  path,
  type = "website",
  image = siteConfig.ogImage,
  imageAlt = `${siteConfig.name} DevOps and cloud interview resources`,
  keywords,
  robots,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title: { absolute: title },
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: url,
      types: { 'application/rss+xml': absoluteUrl('/feed.xml') },
    },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    ...(robots ? { robots } : {}),
  };
}

export function truncateMetadataText(value: string, maxLength = 160) {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : maxLength).replace(/[,:;.!?\s]+$/, "")}…`;
}
