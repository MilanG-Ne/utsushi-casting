import { describe, expect, it } from "vitest";
import { getCaseStudy } from "@/lib/content";
import { breadcrumbNode, isoDuration, serializeJsonLd, serviceNode, videoNode } from "@/lib/seo/jsonld";
import { buildMetadata, noIndexMetadata } from "@/lib/seo/metadata";
import { pageGraph } from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/site";

describe("buildMetadata", () => {
  it("sets a self-referencing canonical and hreflang for en, ja and x-default", () => {
    const meta = buildMetadata({ lang: "ja", route: { name: "work" }, title: "実績", description: "説明" });
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/ja/work`);
    expect(meta.alternates?.languages).toEqual({
      en: `${SITE_URL}/work`,
      ja: `${SITE_URL}/ja/work`,
      "x-default": `${SITE_URL}/work`,
    });
    expect(meta.openGraph).toMatchObject({ locale: "ja_JP", alternateLocale: ["en_GB"] });
  });

  it("marks 404 pages noindex without alternates", () => {
    const meta = noIndexMetadata("Page not found");
    expect(meta.robots).toMatchObject({ index: false });
    expect(meta.alternates).toBeUndefined();
  });
});

describe("JSON-LD", () => {
  it("formats ISO 8601 durations", () => {
    expect(isoDuration(15)).toBe("PT15S");
    expect(isoDuration(75)).toBe("PT1M15S");
    expect(isoDuration(120)).toBe("PT2M");
  });

  it("escapes characters that could break out of the script element", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });

  it("builds absolute breadcrumb items in order", () => {
    const node = breadcrumbNode(`${SITE_URL}/ja/work`, [
      { label: "ホーム", href: "/ja" },
      { label: "実績", href: "/ja/work" },
    ]);
    expect(node.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "ホーム", item: `${SITE_URL}/ja` },
      { "@type": "ListItem", position: 2, name: "実績", item: `${SITE_URL}/ja/work` },
    ]);
  });

  it("describes case study videos with absolute URLs and a dated upload", async () => {
    const study = await getCaseStudy("harbour-lights", "en");
    const node = videoNode(study!.video!, `${SITE_URL}/work/harbour-lights`, "en");
    expect(node).toMatchObject({
      "@type": "VideoObject",
      duration: "PT15S",
      contentUrl: `${SITE_URL}/media/video/harbour-lights.mp4`,
    });
    expect(String(node.uploadDate)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect((node.thumbnailUrl as string[])[0]).toMatch(/^https?:\/\//);
  });

  it("links Organization, WebSite, WebPage, BreadcrumbList and Service in one graph", async () => {
    const pageUrl = `${SITE_URL}/services/commercials`;
    const data = await pageGraph({
      lang: "en",
      route: { name: "service", slug: "commercials" },
      title: "Commercial & Brand Casting",
      description: "…",
      crumbs: [
        { label: "Home", href: "/" },
        { label: "Commercial & Brand Casting", href: "/services/commercials" },
      ],
      extra: [serviceNode({ name: "Commercial & Brand Casting", description: "…", pageUrl, countries: ["JP", "GB"] })],
    });
    const types = (data["@graph"] as { "@type": string }[]).map((n) => n["@type"]);
    expect(types).toEqual(["Organization", "WebSite", "WebPage", "BreadcrumbList", "Service"]);
  });
});
