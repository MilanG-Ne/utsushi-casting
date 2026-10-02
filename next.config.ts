import type { NextConfig } from "next";

/**
 * English is served from the site root without a prefix; Japanese lives under /ja.
 * Internally both locales are real route trees (app/en, app/ja), each with its own root
 * layout. These rewrites map un-prefixed URLs onto app/en, and the redirects make sure
 * /en/... is never a second, duplicate URL for the same page.
 *
 * Excluded from the rewrite: /ja, /en, /api, /studio, Next internals and anything that
 * looks like a file (has an extension), so public assets, robots.txt and sitemap.xml
 * are served directly.
 */
const ENGLISH_PATH =
  "/:path((?!(?:ja|en|api|studio|_next|_vercel|monitoring)(?:/|$))(?!.*\\.[A-Za-z0-9]+$).+)";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do not write agent instruction files into the project during `next dev`.
  agentRules: false,
  poweredByHeader: false,
  experimental: {
    inlineCss: true,
    // Unmatched URLs get a fully server-rendered 404 (app/global-not-found.tsx).
    globalNotFound: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/en" },
        { source: ENGLISH_PATH, destination: "/en/:path" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
