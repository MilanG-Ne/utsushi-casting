import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { alternates, href, hreflangMap, type AppRoute } from "@/lib/i18n/routes";
import { SITE_URL } from "@/lib/site";

const routes: AppRoute[] = [
  { name: "home" },
  { name: "work" },
  { name: "contact" },
  { name: "caseStudy", slug: "harbour-lights" },
  { name: "service", slug: "voice-and-localization" },
];

describe("href", () => {
  it("serves English from the root and Japanese under /ja", () => {
    expect(href({ name: "home" }, "en")).toBe("/");
    expect(href({ name: "home" }, "ja")).toBe("/ja");
    expect(href({ name: "work" }, "en")).toBe("/work");
    expect(href({ name: "work" }, "ja")).toBe("/ja/work");
    expect(href({ name: "caseStudy", slug: "harbour-lights" }, "ja")).toBe("/ja/work/harbour-lights");
    expect(href({ name: "service", slug: "commercials" }, "en")).toBe("/services/commercials");
  });

  it("never produces /en-prefixed URLs", () => {
    for (const route of routes) expect(href(route, "en").startsWith("/en")).toBe(false);
  });
});

describe("alternates and hreflang", () => {
  it("maps every route to the same page in both languages", () => {
    expect(alternates({ name: "contact" })).toEqual({ en: "/contact", ja: "/ja/contact" });
  });

  it("includes absolute en, ja and x-default (pointing at English)", () => {
    for (const route of routes) {
      const map = hreflangMap(route);
      expect(Object.keys(map).sort()).toEqual(["en", "ja", "x-default"]);
      expect(map["x-default"]).toBe(map.en);
      for (const url of Object.values(map)) expect(url.startsWith(SITE_URL)).toBe(true);
    }
  });
});

describe("locale route trees", () => {
  const list = (root: string, dir = root): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      return statSync(full).isDirectory() ? list(root, full) : [relative(root, full)];
    });

  it("app/en and app/ja contain exactly the same route files", () => {
    const enFiles = list("app/en").map((f) => f.replace(/\\/g, "/")).sort();
    const jaFiles = list("app/ja").map((f) => f.replace(/\\/g, "/")).sort();
    expect(jaFiles).toEqual(enFiles);
  });
});
