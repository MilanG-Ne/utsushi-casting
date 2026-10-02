/**
 * Absolute origin used for canonical URLs, hreflang, sitemap and JSON-LD.
 *
 * Order: explicit NEXT_PUBLIC_SITE_URL → Vercel's production domain (also set on
 * preview builds, so previews still point canonicals at production) → localhost.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return `https://${vercelProduction.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = {
  en: "Utsushi Casting",
  ja: "ウツシ・キャスティング",
} as const;
