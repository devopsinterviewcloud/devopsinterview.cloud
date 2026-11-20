/** @type {import('next').NextConfig} */
// Single source of truth for Next config. (Previously split across
// next.config.js + next.config.ts, which silently dropped settings.)
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // PostHog's API paths end in a slash, so Next's automatic slash redirect is
  // off. The redirect below puts it back for every path except /relay.
  skipTrailingSlashRedirect: true,


  // Don't ship source maps / stray console.* in production
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-slot'],
  },

  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // strict-origin, not strict-origin-when-cross-origin: same-origin requests
          // (including PostHog's sendBeacon to /relay) would otherwise carry the full
          // page URL, unsubscribe and payment tokens included, in Referer.
          { key: 'Referrer-Policy', value: 'strict-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*.{jpg,jpeg,png,gif,webp,avif,svg}',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.devopsinterview.cloud' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  async rewrites() {
    return [
      // The Incident Lab is a static SPA under public/labs/token-cost/; Next
      // doesn't resolve directory indexes in public/, so map the bare paths
      // to its index.html explicitly.
      { source: '/labs/token-cost', destination: '/labs/token-cost/index.html' },
      { source: '/labs/token-cost/', destination: '/labs/token-cost/index.html' },
      // PostHog, served from our own origin (see src/instrumentation-client.ts).
      { source: '/relay/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
      { source: '/relay/array/:path*', destination: 'https://us-assets.i.posthog.com/array/:path*' },
      { source: '/relay/:path*', destination: 'https://us.i.posthog.com/:path*' },
    ];
  },

  async redirects() {
    return [
      // Next's built-in trailing-slash redirect (308), minus /relay. Unlike the
      // built-in one it can't cover /_next paths, which Next reserves.
      { source: '/:first((?!relay(?:/|$))[^/]+)/:rest*/', destination: '/:first/:rest*', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      // The Playbook stopped being a standalone product (now a free bonus); Google
      // still has the old URL, so send it to the catalog instead of a 404.
      { source: '/ebooks/interview-day-playbook', destination: '/ebooks', permanent: true },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // posthog-js stays out of the shared vendor chunk: it's loaded on demand
          // after the page (src/instrumentation-client.ts), not on first load.
          vendor: { name: 'vendor', chunks: 'all', test: /node_modules[\\/](?!posthog-js[\\/])/, priority: 20 },
          common: { name: 'common', minChunks: 2, chunks: 'all', priority: 10, reuseExistingChunk: true, enforce: true, test: /^(?!.*node_modules[\\/]posthog-js[\\/])/ },
        },
      };
    }
    return config;
  },

  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  },
};

module.exports = nextConfig;
