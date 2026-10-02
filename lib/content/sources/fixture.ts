import manifest from "@/content/seed/media-manifest.json";
import { seedDocuments } from "@/content/seed/documents";
import type { SeedImage } from "@/content/seed/helpers";

/**
 * Builds the same bundle shape the GROQ query returns, straight from the seed
 * documents. Used when no Sanity project is configured (local dev, CI, Lighthouse).
 */
type Manifest = Record<string, { width: number; height: number; lqip: string }>;
type AnyDoc = Record<string, unknown> & { _id: string; _type: string };

const media = manifest as Manifest;
const docs = seedDocuments as unknown as AnyDoc[];
const byId = new Map(docs.map((d) => [d._id, d]));

function image(img: SeedImage | undefined) {
  if (!img) return null;
  const meta = media[img.localFile];
  if (!meta) throw new Error(`Seed image "${img.localFile}" is missing from media-manifest.json. Run scripts/media/generate.py.`);
  // Local images use a base URL without extension; ResponsiveImage adds -<width>.<format>.
  return { url: `/media/img/${img.localFile}`, width: meta.width, height: meta.height, lqip: meta.lqip, alt: img.alt };
}

function video(v: Record<string, unknown> | undefined) {
  if (!v) return null;
  return { ...v, poster: image(v.poster as SeedImage) };
}

const slugOf = (doc: AnyDoc) => (doc.slug as { current: string }).current;
const deref = (r: { _ref: string }) => {
  const doc = byId.get(r._ref);
  if (!doc) throw new Error(`Seed reference ${r._ref} not found`);
  return doc;
};

export function buildFixtureBundle(): unknown {
  const ofType = (type: string) =>
    docs.filter((d) => d._type === type).sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

  return {
    settings: byId.get("siteSettings"),
    pages: ofType("page").map((p) => ({
      ...p,
      featuredCaseStudies: ((p.featuredCaseStudies as { _ref: string }[] | undefined) ?? []).map((r) => slugOf(deref(r))),
      showreel: video(p.showreel as Record<string, unknown> | undefined),
    })),
    services: ofType("service").map((s) => ({ ...s, slug: slugOf(s), heroImage: image(s.heroImage as SeedImage) })),
    caseStudies: ofType("caseStudy").map((c) => ({
      ...c,
      slug: slugOf(c),
      heroImage: image(c.heroImage as SeedImage),
      video: video(c.video as Record<string, unknown> | undefined),
      services: ((c.services as { _ref: string }[] | undefined) ?? []).map((r) => {
        const s = deref(r);
        return { slug: slugOf(s), title: s.title, shortSummary: s.shortSummary };
      }),
    })),
  };
}
