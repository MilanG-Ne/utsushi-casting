import type { MetadataRoute } from "next";
import { getCaseStudySlugs, getServiceSlugs } from "@/lib/content";
import { LOCALES } from "@/lib/i18n/config";
import { absoluteUrl, href, hreflangMap, type AppRoute } from "@/lib/i18n/routes";

/**
 * One sitemap for both languages. Every URL lists its alternates (en, ja, x-default) as
 * xhtml:link entries, mirroring the hreflang tags in each page's <head>.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, caseStudies] = await Promise.all([getServiceSlugs(), getCaseStudySlugs()]);
  const routes: { route: AppRoute; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
    { route: { name: "home" }, priority: 1, changeFrequency: "weekly" },
    { route: { name: "work" }, priority: 0.8, changeFrequency: "weekly" },
    ...caseStudies.map((slug) => ({ route: { name: "caseStudy", slug } as AppRoute, priority: 0.7, changeFrequency: "monthly" as const })),
    ...services.map((slug) => ({ route: { name: "service", slug } as AppRoute, priority: 0.8, changeFrequency: "monthly" as const })),
    { route: { name: "contact" }, priority: 0.6, changeFrequency: "monthly" },
  ];

  return routes.flatMap(({ route, priority, changeFrequency }) =>
    LOCALES.map((lang) => ({
      url: absoluteUrl(href(route, lang)),
      changeFrequency,
      priority,
      alternates: { languages: hreflangMap(route) },
    })),
  );
}
