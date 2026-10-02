import { describe, expect, it } from "vitest";
import { seedDocuments } from "@/content/seed/documents";
import { getCaseStudy, getNavServices, getPage, getSiteSettings } from "@/lib/content";
import { localize, text } from "@/lib/content/localize";
import { contentBundleSchema } from "@/lib/content/schema";
import { buildFixtureBundle } from "@/lib/content/sources/fixture";

type Node = unknown;

function findLocaleFields(node: Node, path: string, out: { path: string; value: Record<string, unknown> }[] = []) {
  if (Array.isArray(node)) node.forEach((n, i) => findLocaleFields(n, `${path}[${i}]`, out));
  else if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj._type === "string" && obj._type.startsWith("locale")) out.push({ path, value: obj });
    for (const [k, v] of Object.entries(obj)) findLocaleFields(v, `${path}.${k}`, out);
  }
  return out;
}

describe("seed content", () => {
  it("matches the content bundle schema used for Sanity responses", () => {
    expect(() => contentBundleSchema.parse(buildFixtureBundle())).not.toThrow();
  });

  it("has a complete Japanese mirror: every localized field has both languages", () => {
    const fields = findLocaleFields(seedDocuments, "seed");
    expect(fields.length).toBeGreaterThan(100);
    const incomplete = fields.filter(({ value }) => {
      const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim().length > 0);
      return !filled(value.en) || !filled(value.ja);
    });
    expect(incomplete.map((f) => f.path)).toEqual([]);
  });

  it("keeps Japanese meta descriptions within a sensible length for search snippets", () => {
    for (const doc of seedDocuments) {
      if (!("seo" in doc)) continue;
      const { en, ja } = doc.seo.description;
      expect(en.length, `${doc._id} en`).toBeLessThanOrEqual(170);
      expect(ja.length, `${doc._id} ja`).toBeLessThanOrEqual(110);
    }
  });
});

describe("localization helpers", () => {
  it("falls back to English and reports the fallback language", () => {
    expect(localize({ en: "Hello", ja: "" }, "ja")).toBe("Hello");
    expect(text({ en: "Hello", ja: null }, "ja")).toEqual({ text: "Hello", lang: "en" });
    expect(text({ en: "Hello", ja: "こんにちは" }, "ja")).toEqual({ text: "こんにちは" });
  });
});

describe("content API (fixture source)", () => {
  it("returns Japanese copy for Japanese pages and English for English pages", async () => {
    const ja = await getCaseStudy("harbour-lights", "ja");
    const en = await getCaseStudy("harbour-lights", "en");
    expect(ja?.title.text).toBe("ハーバー・ライツ");
    expect(en?.title.text).toBe("Harbour Lights");
    expect(ja?.services.map((s) => s.slug)).toEqual(["film-and-television"]);
  });

  it("resolves featured case studies and the showreel on the home page", async () => {
    const home = await getPage("home", "en");
    expect(home.featuredCaseStudies.map((c) => c.slug)).toEqual(["harbour-lights", "the-lantern-keeper"]);
    expect(home.showreel?.url).toBe("/media/video/showreel.mp4");
  });

  it("exposes three services in display order and site settings", async () => {
    expect((await getNavServices("en")).map((s) => s.slug)).toEqual(["film-and-television", "commercials", "voice-and-localization"]);
    expect((await getSiteSettings("ja")).studios.map((s) => s.city)).toEqual(["東京", "ロンドン"]);
  });
});
