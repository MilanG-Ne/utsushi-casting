import type { Image, SiteSettings, Video } from "../content/types";
import type { Locale } from "../i18n/config";
import { absoluteUrl, href, type AppRoute } from "../i18n/routes";
import { SITE_NAME, SITE_URL } from "../site";

/**
 * schema.org graph builders. Each page emits one @graph with stable @id references:
 * Organization and WebSite are shared, the WebPage links to them, and page-specific
 * nodes (Service, VideoObject, BreadcrumbList) link back to the WebPage.
 */
type Node = Record<string, unknown>;

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const websiteId = (lang: Locale) => `${absoluteUrl(href({ name: "home" }, lang))}#website`;

const COUNTRY_NAMES: Record<string, string> = { JP: "Japan", GB: "United Kingdom" };

export function absoluteAsset(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function imageUrl(image: Image, width = 1200): string {
  return image.url.startsWith("/media/img/") ? absoluteAsset(`${image.url}-${width}.webp`) : `${image.url}?w=${width}&fm=jpg&q=80`;
}

/** ISO 8601 duration, e.g. 75 → "PT1M15S". */
export function isoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `PT${m ? `${m}M` : ""}${s || !m ? `${s}S` : ""}`;
}

export function organizationNode(settings: { en: SiteSettings; ja: SiteSettings }, lang: Locale): Node {
  const local = settings[lang];
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: settings.en.name,
    alternateName: settings.ja.name,
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: absoluteAsset("/media/logo.png"), width: 512, height: 512 },
    description: local.description,
    email: local.email,
    ...(local.foundingYear ? { foundingDate: String(local.foundingYear) } : {}),
    knowsLanguage: ["en", "ja"],
    address: local.studios.map((s) => ({
      "@type": "PostalAddress",
      addressLocality: s.addressLocality ?? s.city,
      ...(s.addressCountry ? { addressCountry: s.addressCountry } : {}),
    })),
    areaServed: local.studios
      .map((s) => s.addressCountry)
      .filter((c): c is string => Boolean(c))
      .map((c) => ({ "@type": "Country", name: COUNTRY_NAMES[c] ?? c })),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "new business",
      email: local.email,
      availableLanguage: ["English", "Japanese"],
    },
  };
}

export function websiteNode(lang: Locale): Node {
  return {
    "@type": "WebSite",
    "@id": websiteId(lang),
    url: absoluteUrl(href({ name: "home" }, lang)),
    name: SITE_NAME[lang],
    inLanguage: lang,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export type Crumb = { label: string; href: string };

export function breadcrumbNode(pageUrl: string, crumbs: Crumb[]): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: absoluteUrl(c.href),
    })),
  };
}

export function videoNode(video: Video, pageUrl: string, lang: Locale, id = "video"): Node {
  return {
    "@type": "VideoObject",
    "@id": `${pageUrl}#${id}`,
    name: video.title.text,
    description: video.description.text,
    thumbnailUrl: [imageUrl(video.poster)],
    // Date-only values get an explicit Tokyo offset, as recommended for uploadDate.
    uploadDate: /T/.test(video.uploadDate) ? video.uploadDate : `${video.uploadDate}T09:00:00+09:00`,
    duration: isoDuration(video.durationSeconds),
    contentUrl: absoluteAsset(video.url),
    inLanguage: lang,
    isFamilyFriendly: true,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function serviceNode(input: { name: string; description: string; pageUrl: string; image?: Image; countries: string[] }): Node {
  return {
    "@type": "Service",
    "@id": `${input.pageUrl}#service`,
    name: input.name,
    serviceType: input.name,
    description: input.description,
    url: input.pageUrl,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: input.countries.map((c) => ({ "@type": "Country", name: COUNTRY_NAMES[c] ?? c })),
    ...(input.image ? { image: imageUrl(input.image) } : {}),
  };
}

type WebPageType = "WebPage" | "CollectionPage" | "ContactPage" | "ItemPage";

export function webPageNode(input: {
  type?: WebPageType;
  route: AppRoute;
  lang: Locale;
  title: string;
  description: string;
  hasBreadcrumb: boolean;
  primaryImage?: Image;
  mainEntityId?: string;
}): Node {
  const url = absoluteUrl(href(input.route, input.lang));
  return {
    "@type": input.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.title,
    description: input.description,
    inLanguage: input.lang,
    isPartOf: { "@id": websiteId(input.lang) },
    about: { "@id": ORGANIZATION_ID },
    ...(input.hasBreadcrumb ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    ...(input.primaryImage ? { primaryImageOfPage: { "@type": "ImageObject", url: imageUrl(input.primaryImage) } } : {}),
    ...(input.mainEntityId ? { mainEntity: { "@id": input.mainEntityId } } : {}),
  };
}

export function graph(nodes: Node[]): Node {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** JSON for a <script> element: escapes "<" so content can never close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
