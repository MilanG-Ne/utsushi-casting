import { expect, test, type Page } from "@playwright/test";
import { OUTAGE_ORIGIN } from "./pages";

async function fillValid(page: Page) {
  await page.fill("#enq-name", "Aiko Tanaka");
  await page.fill("#enq-email", "aiko@example.com");
  await page.selectOption("#enq-service", "voice-and-localization");
  await page.fill("#enq-message", "We need an English dub cast for a 90-minute animated feature.");
  await page.check("#enq-consent");
}

test.describe("enquiry form", () => {
  test("shows localized errors, focuses the summary and marks invalid fields", async ({ page }) => {
    await page.goto("/ja/contact");
    await page.getByRole("button", { name: "送信する" }).click();
    const summary = page.getByTestId("enquiry-invalid");
    await expect(summary).toBeFocused();
    await expect(summary.getByRole("link")).toHaveCount(5);
    await expect(page.locator("#enq-email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#enq-email")).toHaveAttribute("aria-describedby", "enq-email-error");
    await summary.getByRole("link").first().click();
    await expect(page.locator("#enq-name")).toBeFocused();
  });

  test("delivers to the (mock) CRM and confirms with a reference", async ({ page }) => {
    await page.goto("/contact");
    await fillValid(page);
    const response = page.waitForResponse((r) => r.url().endsWith("/api/enquiries"));
    await page.getByRole("button", { name: "Send enquiry" }).click();
    expect((await response).status()).toBe(200);
    const success = page.getByTestId("enquiry-success");
    await expect(success).toBeFocused();
    await expect(success).toContainText("Reference");
  });

  test("keeps the enquiry when the CRM is down and still confirms it", async ({ page }) => {
    await page.goto(`${OUTAGE_ORIGIN}/contact`);
    await fillValid(page);
    const response = page.waitForResponse((r) => r.url().endsWith("/api/enquiries"));
    await page.getByRole("button", { name: "Send enquiry" }).click();
    const res = await response;
    expect(res.status()).toBe(202);
    expect(await res.json()).toMatchObject({ status: "queued" });
    await expect(page.getByTestId("enquiry-success")).toContainText("safely stored");
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("posts the form and shows the confirmation via the URL fragment", async ({ page }) => {
      await page.goto("/ja/contact");
      await page.fill("#enq-name", "Aiko Tanaka");
      await page.fill("#enq-email", "aiko@example.com");
      await page.selectOption("#enq-service", "voice-and-localization");
      await page.fill("#enq-message", "We need an English dub cast for a 90-minute animated feature.");
      // Keyboard only: without JavaScript, Playwright cannot run its pointer stability checks.
      await page.focus("#enq-consent");
      await page.keyboard.press("Space");
      await page.focus("button[type=submit]");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/ja\/contact#enquiry-sent$/);
      await expect(page.locator("#enquiry-sent")).toBeVisible();
    });
  });

  test("the API rejects cross-origin posts and invalid payloads", async ({ request }) => {
    const bad = await request.post("/api/enquiries", { headers: { origin: "https://evil.example", "content-type": "application/json" }, data: {} });
    expect(bad.status()).toBe(403);
    const invalid = await request.post("/api/enquiries", { headers: { "content-type": "application/json" }, data: { name: "" } });
    expect(invalid.status()).toBe(422);
    expect((await invalid.json()).fields).toEqual(expect.arrayContaining(["name", "email", "message", "consent"]));
  });

  test("the retry endpoint requires the cron secret", async ({ request }) => {
    expect((await request.get("/api/enquiries/retry")).status()).toBe(401);
    const ok = await request.get("/api/enquiries/retry", { headers: { authorization: "Bearer e2e-cron" } });
    expect(ok.status()).toBe(200);
    expect(await ok.json()).toMatchObject({ status: "ok" });
  });
});
