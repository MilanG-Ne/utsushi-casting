import { devices, expect, test } from "@playwright/test";

test.describe("click-to-load video", () => {
  for (const path of ["/work/harbour-lights", "/ja"]) {
    test(`${path}: no video bytes until the visitor presses play`, async ({ page }) => {
      const videoRequests: string[] = [];
      page.on("request", (r) => {
        if (r.url().endsWith(".mp4")) videoRequests.push(r.url());
      });
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("video")).toHaveCount(0);
      expect(videoRequests).toEqual([]);

      const play = page.locator(".video-facade").first();
      await play.scrollIntoViewIfNeeded();
      const request = page.waitForRequest((r) => r.url().endsWith(".mp4"));
      await play.click();
      await request;
      const video = page.locator("video");
      await expect(video).toHaveCount(1);
      await expect(video).toBeFocused();
      await expect(video).toHaveAttribute("controls", "");
    });
  }
});

test.describe("GSAP is route-scoped", () => {
  const gsapRequested = async (page: import("@playwright/test").Page) =>
    page.evaluate(async () => {
      const urls = performance.getEntriesByType("resource").map((e) => e.name).filter((n) => n.includes("/_next/static/chunks/"));
      const bodies = await Promise.all(urls.map((u) => fetch(u).then((r) => r.text())));
      return bodies.some((b) => b.includes("GreenSock") || b.includes("ScrollTrigger.create"));
    });

  test("the homepage loads GSAP after hydration and animates the marquee", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect.poll(() => gsapRequested(page), { timeout: 5000 }).toBe(true);
    await expect(page.locator("[data-marquee-toggle]")).toBeVisible();
    await page.locator("[data-marquee-toggle]").click();
    await expect(page.locator("[data-marquee-toggle]")).toHaveAttribute("aria-pressed", "true");
  });

  for (const path of ["/work", "/work/harbour-lights", "/services/commercials", "/contact", "/ja/contact"]) {
    test(`${path} never downloads GSAP`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      expect(await gsapRequested(page)).toBe(false);
    });
  }

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("the homepage does not load GSAP at all", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      expect(await gsapRequested(page)).toBe(false);
      await expect(page.locator("[data-marquee-toggle]")).toBeHidden();
    });
  });
});

test.describe("layout stability", () => {
  // Same device class as Lighthouse mobile: 412px wide, touch, high DPR.
  const pixel = devices["Pixel 7"];
  test.use({ viewport: pixel.viewport, deviceScaleFactor: pixel.deviceScaleFactor, isMobile: pixel.isMobile, hasTouch: pixel.hasTouch, userAgent: pixel.userAgent });

  for (const path of ["/", "/ja", "/work", "/ja/work", "/work/harbour-lights", "/ja/services/voice-and-localization", "/contact", "/ja/contact"]) {
    test(`${path} has no layout shifts while loading and scrolling`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
      });
      const cls = await page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            let total = 0;
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
                if (!entry.hadRecentInput) total += entry.value;
              }
            }).observe({ type: "layout-shift", buffered: true });
            setTimeout(() => resolve(total), 300);
          }),
      );
      expect(cls).toBe(0);
    });
  }
});
