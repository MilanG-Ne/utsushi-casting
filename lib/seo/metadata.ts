import type { Metadata } from "next";
import type { Image } from "../content/types";
import { LOCALE_META, otherLocales, type Locale } from "../i18n/config";
import { absoluteUrl, href, hreflangMap, type AppRoute } from "../i18n/routes";
import { SITE_NAME } from "../site";

export type OgImage = { url: string; width: number; height: number; alt: string };

export function defaultOgImage(lang: Locale): OgImage {
  return { url: `/media/og/default-${lang}.jpg`, width: 1200, height: 630, alt: SITE_NAME[lang] };
}

/**
 * Open Graph image for a page with a hero image. Generated cards (scripts/media/og.py)
 * exist for the seed content; images from Sanity are cropped to 1200×630 on its CDN.
 */
export function ogImageFor(key: string, lang: Locale, hero: Image): OgImage {
  if (!hero.url.startsWith("/media/img/")) {
    return { url: `${hero.url}?w=1200&h=630&fit=crop&fm=jpg&q=80`, width: 1200, height: 630, alt: hero.alt };
  }
  return { url: `/media/og/${key}-${lang}.jpg`, width: 1200, height: 630, alt: hero.alt };
}

type BuildMetadataInput = {
  lang: Locale;
  route: AppRoute;
  /** Page title without the site suffix; the locale title template adds it. */
  title: string;
  description: string;
  /** Use the title as-is (the homepage already contains the brand name). */
  absoluteTitle?: boolean;
  image?: OgImage;
  type?: "website" | "article";
};

/**
 * Per-page metadata: self-referencing canonical, hreflang for every locale plus
 * x-default, and Open Graph / Twitter tags in the page's language.
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { lang, route, title, description, absoluteTitle = false, type = "website" } = input;
  const canonical = absoluteUrl(href(route, lang));
  const image = input.image ?? defaultOgImage(lang);
  const fullTitle = absoluteTitle ? title : `${title}${lang === "ja" ? "｜" : " — "}${SITE_NAME[lang]}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages: hreflangMap(route),
    },
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME[lang],
      title: fullTitle,
      description,
      locale: LOCALE_META[lang].ogLocale,
      alternateLocale: otherLocales(lang).map((l) => LOCALE_META[l].ogLocale),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image.url],
    },
  };
}

/** Metadata for pages that must not be indexed (404). No canonical or alternates. */
export function noIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: true },
  };
}
