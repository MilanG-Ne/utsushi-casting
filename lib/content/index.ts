import type { PortableTextBlock } from "@portabletext/types";
import { cache } from "react";
import { isSanityConfigured } from "@/sanity/env";
import type { Locale } from "../i18n/config";
import { localize, resolvedLang, text } from "./localize";
import {
  contentBundleSchema,
  type ContentBundle,
  type LocaleBlocks,
  type RawCaseStudy,
  type RawImage,
  type RawPage,
  type RawService,
  type RawVideo,
} from "./schema";
import { buildFixtureBundle } from "./sources/fixture";
import type { Blocks, CaseStudy, Image, Page, Service, ServiceSummary, SiteSettings, Video } from "./types";

export type { Blocks, CaseStudy, Image, Page, Service, ServiceSummary, SiteSettings, Video } from "./types";
export type { Text } from "./localize";

/** "sanity" when a project ID is set (and CONTENT_SOURCE isn't forced to "fixture"). */
export const contentSource: "sanity" | "fixture" =
  isSanityConfigured && process.env.CONTENT_SOURCE !== "fixture" ? "sanity" : "fixture";

const loadBundle = cache(async (): Promise<ContentBundle> => {
  let raw: unknown;
  if (contentSource === "sanity") {
    const { fetchSanityBundle } = await import("./sources/sanity");
    raw = await fetchSanityBundle();
    const settings = (raw as { settings?: unknown } | null)?.settings;
    if (!settings) {
      throw new Error(
        "The Sanity dataset has no siteSettings document. Seed it first (pnpm seed, or the 'Seed Sanity' workflow), " +
          "or unset NEXT_PUBLIC_SANITY_PROJECT_ID to build with the bundled seed content.",
      );
    }
  } else {
    raw = buildFixtureBundle();
  }
  const parsed = contentBundleSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 10).map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Content from ${contentSource} does not match the expected shape:\n${issues.join("\n")}`);
  }
  return parsed.data;
});

// ---------------------------------------------------------------------------- mappers

function mapImage(img: RawImage, lang: Locale): Image {
  const altLang = img.alt ? resolvedLang(img.alt, lang) : lang;
  return {
    url: img.url,
    width: img.width,
    height: img.height,
    lqip: img.lqip ?? undefined,
    alt: img.alt ? localize(img.alt, lang) : "",
    altLang: altLang === lang ? undefined : altLang,
  };
}

function mapBlocks(field: LocaleBlocks | null | undefined, lang: Locale): Blocks | undefined {
  if (!field) return undefined;
  const actual = resolvedLang(field, lang);
  const blocks = (actual === "ja" ? field.ja : field.en) as unknown as PortableTextBlock[];
  return { blocks: blocks ?? [], lang: actual === lang ? undefined : actual };
}

function mapVideo(v: RawVideo, lang: Locale): Video {
  return {
    title: text(v.title, lang),
    description: text(v.description, lang),
    url: v.url,
    poster: mapImage(v.poster, lang),
    durationSeconds: v.durationSeconds,
    uploadDate: v.uploadDate,
    hasAudio: Boolean(v.hasAudio),
  };
}

function mapServiceSummary(s: { slug: string; title: RawService["title"]; shortSummary: RawService["shortSummary"] }, lang: Locale): ServiceSummary {
  return { slug: s.slug, title: text(s.title, lang), shortSummary: text(s.shortSummary, lang) };
}

function mapService(s: RawService, lang: Locale): Service {
  return {
    ...mapServiceSummary(s, lang),
    summary: text(s.summary, lang),
    heroImage: mapImage(s.heroImage, lang),
    body: mapBlocks(s.body, lang) ?? { blocks: [] },
    deliverables: (s.deliverables ?? []).map((d) => text(d, lang)),
    process: (s.process ?? []).map((p) => ({ title: text(p.title, lang), body: text(p.body, lang) })),
    faq: (s.faq ?? []).map((f) => ({ question: text(f.question, lang), answer: text(f.answer, lang) })),
    seo: { title: localize(s.seo.title, lang), description: localize(s.seo.description, lang) },
  };
}

function mapCaseStudy(c: RawCaseStudy, lang: Locale): CaseStudy {
  return {
    slug: c.slug,
    title: text(c.title, lang),
    client: text(c.client, lang),
    year: c.year,
    format: text(c.format, lang),
    locations: c.locations ? text(c.locations, lang) : undefined,
    rolesCast: c.rolesCast ?? undefined,
    summary: text(c.summary, lang),
    heroImage: mapImage(c.heroImage, lang),
    video: c.video ? mapVideo(c.video, lang) : undefined,
    body: mapBlocks(c.body, lang) ?? { blocks: [] },
    outcomes: (c.outcomes ?? []).map((o) => ({ value: text(o.value, lang), label: text(o.label, lang) })),
    credits: (c.credits ?? []).map((cr) => ({ role: text(cr.role, lang), name: text(cr.name, lang) })),
    services: (c.services ?? []).map((s) => mapServiceSummary(s, lang)),
    seo: { title: localize(c.seo.title, lang), description: localize(c.seo.description, lang) },
  };
}

function mapPage(p: RawPage, bundle: ContentBundle, lang: Locale): Page {
  const featured = (p.featuredCaseStudies ?? [])
    .map((slug) => bundle.caseStudies.find((c) => c.slug === slug))
    .filter((c): c is RawCaseStudy => Boolean(c))
    .map((c) => mapCaseStudy(c, lang));
  return {
    key: p.key,
    title: text(p.title, lang),
    eyebrow: p.eyebrow ? text(p.eyebrow, lang) : undefined,
    heading: text(p.heading, lang),
    intro: text(p.intro, lang),
    body: mapBlocks(p.body, lang),
    stats: (p.stats ?? []).map((s) => ({ value: text(s.value, lang), label: text(s.label, lang) })),
    featuredCaseStudies: featured,
    showreel: p.showreel ? mapVideo(p.showreel, lang) : undefined,
    process: (p.process ?? []).map((s) => ({ title: text(s.title, lang), body: text(s.body, lang) })),
    seo: { title: localize(p.seo.title, lang), description: localize(p.seo.description, lang) },
  };
}

// ---------------------------------------------------------------------------- public API

export async function getSiteSettings(lang: Locale): Promise<SiteSettings> {
  const { settings } = await loadBundle();
  return {
    name: localize(settings.name, lang),
    tagline: localize(settings.tagline, lang),
    description: localize(settings.description, lang),
    email: settings.email,
    foundingYear: settings.foundingYear ?? undefined,
    studios: settings.studios.map((s) => ({
      city: localize(s.city, lang),
      area: localize(s.area, lang),
      addressLocality: s.addressLocality ?? undefined,
      addressCountry: s.addressCountry ?? undefined,
    })),
  };
}

export async function getPage(key: Page["key"], lang: Locale): Promise<Page> {
  const bundle = await loadBundle();
  const page = bundle.pages.find((p) => p.key === key);
  if (!page) throw new Error(`Missing "${key}" page document in ${contentSource} content`);
  return mapPage(page, bundle, lang);
}

export async function getServices(lang: Locale): Promise<Service[]> {
  return (await loadBundle()).services.map((s) => mapService(s, lang));
}

export async function getService(slug: string, lang: Locale): Promise<Service | undefined> {
  const s = (await loadBundle()).services.find((x) => x.slug === slug);
  return s ? mapService(s, lang) : undefined;
}

export async function getNavServices(lang: Locale): Promise<ServiceSummary[]> {
  return (await loadBundle()).services.map((s) => mapServiceSummary(s, lang));
}

export async function getCaseStudies(lang: Locale): Promise<CaseStudy[]> {
  return (await loadBundle()).caseStudies.map((c) => mapCaseStudy(c, lang));
}

export async function getCaseStudy(slug: string, lang: Locale): Promise<CaseStudy | undefined> {
  const c = (await loadBundle()).caseStudies.find((x) => x.slug === slug);
  return c ? mapCaseStudy(c, lang) : undefined;
}

export async function getServiceSlugs(): Promise<string[]> {
  return (await loadBundle()).services.map((s) => s.slug);
}

export async function getCaseStudySlugs(): Promise<string[]> {
  return (await loadBundle()).caseStudies.map((c) => c.slug);
}

/** Case studies that list the given service, for "related work" on service pages. */
export async function getCaseStudiesForService(slug: string, lang: Locale): Promise<CaseStudy[]> {
  return (await loadBundle()).caseStudies.filter((c) => c.services?.some((s) => s.slug === slug)).map((c) => mapCaseStudy(c, lang));
}
