import { expect, test } from "@playwright/test";
import { ALL_PAGES, EN_PAGES, toJa } from "./pages";

const pathOf = (url: string | null) => (url ? new URL(url).pathname.replace(/(.)\/$/, "$1") : null);

test.describe("bilingual routing and metadata", () => {
  for (const en of EN_PAGES) {
    const ja = toJa(en);
    test(`${en} and ${ja} are mirrored with hreflang, canonical and lang`, async ({ page }) => {
      for (const [path, lang] of [
        [en, "en"],
        [ja, "ja"],
      ] as const) {
        const res = await page.goto(path);
        expect(res?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", lang);
        expect(pathOf(await page.locator('link[rel="canonical"]').getAttribute("href"))).toBe(path);
        expect(pathOf(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href"))).toBe(en);
        expect(pathOf(await page.locator('link[rel="alternate"][hreflang="ja"]').getAttribute("href"))).toBe(ja);
        expect(pathOf(await page.locator('link[rel="alternate"][hreflang="x-default"]').getAttribute("href"))).toBe(en);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
        await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", lang === "en" ? "en_GB" : "ja_JP");
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      }
    });
  }

  test("every page has a unique title in each language", async ({ page }) => {
    const titles = new Map<string, string>();
    for (const path of ALL_PAGES) {
      await page.goto(path);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(5);
      expect(titles.has(title), `duplicate title "${title}" on ${path} and ${titles.get(title)}`).toBe(false);
      titles.set(title, path);
    }
    expect(titles.size).toBe(16);
  });

  test("the language switch keeps the visitor on the same page", async ({ page }) => {
    await page.goto("/work/harbour-lights");
    await page.getByTestId("language-switch").first().click();
    await expect(page).toHaveURL(/\/ja\/work\/harbour-lights$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ハーバー・ライツ");
    await page.getByTestId("language-switch").first().click();
    await expect(page).toHaveURL(/\/work\/harbour-lights$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("/en URLs permanently redirect to the root-level English pages", async ({ request }) => {
    for (const [from, to] of [
      ["/en", "/"],
      ["/en/work", "/work"],
      ["/en/services/commercials", "/services/commercials"],
    ]) {
      const res = await request.get(from!, { maxRedirects: 0 });
      expect(res.status()).toBe(308);
      expect(new URL(res.headers().location!, "http://x").pathname).toBe(to);
    }
  });

  test("unknown URLs get a server-rendered 404 in both languages", async ({ page, request }) => {
    for (const path of ["/no-such-page", "/work/no-such-case", "/ja/no-such-page", "/ja/services/nope"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
      const html = await res.text();
      expect(html).toContain("This page didn’t make the final cut.");
      expect(html).toContain("このページは本編からカットされたようです。");
      expect(html).toContain('name="robots" content="noindex');
    }
    await page.goto("/ja/no-such-page");
    await expect(page.locator("html")).toHaveClass(/ja-first/);
    await expect(page.locator(".not-found-bilingual > [lang]").first()).toBeVisible();
  });
});
