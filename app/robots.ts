import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Production allows crawling of both languages; Vercel preview deployments are blocked. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/studio"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
