import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ALL_PAGES } from "./pages";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("accessibility (axe, WCAG 2.2 AA rules)", () => {
  test.use({ reducedMotion: "reduce" });

  for (const path of [...ALL_PAGES, "/no-such-page", "/ja/no-such-page"]) {
    test(`no axe violations on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(summary).toEqual([]);
    });
  }

  for (const path of ["/", "/ja/contact"]) {
    test(`no axe violations on ${path} at phone width with the menu open`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.locator(".menu-button").click();
      await expect(page.locator("#mobile-menu")).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
    });
  }
});

test.describe("keyboard and focus", () => {
  test("the skip link is the first tab stop and moves focus to the main content", async ({ page }) => {
    await page.goto("/work");
    await page.keyboard.press("Tab");
    const skip = page.locator(".skip-link");
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box && box.y >= 0).toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("the services menu opens, is reachable and closes with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const trigger = page.locator(".nav-trigger");
    await trigger.focus();
    await page.keyboard.press("Enter");
    const panel = page.locator("#services-panel");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(panel.getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("focused controls show a visible outline", async ({ page }) => {
    await page.goto("/contact");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });

  test("pages reflow at 320px without horizontal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ALL_PAGES) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
