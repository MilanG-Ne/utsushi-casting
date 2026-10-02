import { LOCALE_META, LOCALES, type Locale } from "./config";
import { SITE_URL } from "../site";

/**
 * Every public page is described by an AppRoute. URLs are only ever produced from
 * here, so the language switch, hreflang tags and sitemap alternates cannot drift.
 */
export type AppRoute =
  | { name: "home" }
  | { name: "work" }
  | { name: "contact" }
  | { name: "caseStudy"; slug: string }
  | { name: "service"; slug: string };

function routePath(route: AppRoute): string {
  switch (route.name) {
    case "home":
      return "/";
    case "work":
      return "/work";
    case "contact":
      return "/contact";
    case "caseStudy":
      return `/work/${encodeURIComponent(route.slug)}`;
    case "service":
      return `/services/${encodeURIComponent(route.slug)}`;
  }
}

/** Site-relative URL for a route in a locale, e.g. "/ja/work/harbour-lights". */
export function href(route: AppRoute, lang: Locale): string {
  const path = routePath(route);
  const prefix = LOCALE_META[lang].prefix;
  if (!prefix) return path;
  return path === "/" ? prefix : `${prefix}${path}`;
}

export function absoluteUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/** Relative URLs of the same route in every locale. */
export function alternates(route: AppRoute): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, href(route, l)])) as Record<Locale, string>;
}

/** hreflang map with absolute URLs plus x-default (the English page). */
export function hreflangMap(route: AppRoute): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of LOCALES) map[l] = absoluteUrl(href(route, l));
  map["x-default"] = absoluteUrl(href(route, "en"));
  return map;
}

export function isSameRoute(a: AppRoute, b: AppRoute): boolean {
  if (a.name !== b.name) return false;
  if ("slug" in a && "slug" in b) return a.slug === b.slug;
  return true;
}
