import { expect, test } from "@playwright/test";
import { ALL_PAGES } from "./pages";

type Node = { "@type": string; [key: string]: unknown };

test.describe("structured data, sitemap and robots", () => {
  for (const path of ALL_PAGES) {
    test(`JSON-LD on ${path}`, async ({ page }) => {
      await page.goto(path);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks).toHaveLength(1);
      const data = JSON.parse(blocks[0]!) as { "@graph": Node[] };
      const types = data["@graph"].map((n) => n["@type"]);
      expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite"]));
      expect(types.some((t) => ["WebPage", "CollectionPage", "ContactPage"].includes(t))).toBe(true);
      const bare = path.replace(/^\/ja(?=\/|$)/, "") || "/";
      if (bare !== "/") expect(types).toContain("BreadcrumbList");
      if (bare.startsWith("/services/")) expect(types).toContain("Service");
      if (bare === "/" || bare.startsWith("/work/")) expect(types).toContain("VideoObject");
      for (const node of data["@graph"]) if (node["@id"]) expect(String(node["@id"])).toMatch(/^https?:\/\//);
    });
  }

  test("sitemap lists both languages with en, ja and x-default alternates", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const urls = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    expect(urls).toHaveLength(16);
    for (const url of urls) {
      expect(url).toContain('hreflang="en"');
      expect(url).toContain('hreflang="ja"');
      expect(url).toContain('hreflang="x-default"');
    }
    expect(xml).toMatch(/<loc>[^<]+\/ja\/services\/voice-and-localization<\/loc>/);
  });

  test("robots.txt points to the sitemap and keeps /api and /studio out", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Sitemap: .+\/sitemap\.xml/);
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /studio");
  });
});
