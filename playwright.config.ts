import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end and accessibility tests against the production build (`pnpm build` first).
 * Two servers run from the same build: one with the mock CRM up, one with it down, so the
 * outage path is tested for real. Set CHROME_PATH to use an existing Chromium binary.
 */
const PORT = 3100;
const OUTAGE_PORT = 3101;
const env = { CRON_SECRET: "e2e-cron", CRM_SIGNING_SECRET: "e2e-signing-secret", ENQUIRY_RATE_LIMIT: "1000" };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `pnpm exec next start -p ${PORT}`,
      url: `http://localhost:${PORT}/robots.txt`,
      reuseExistingServer: !process.env.CI,
      env,
    },
    {
      command: `pnpm exec next start -p ${OUTAGE_PORT}`,
      url: `http://localhost:${OUTAGE_PORT}/robots.txt`,
      reuseExistingServer: !process.env.CI,
      env: { ...env, MOCK_CRM_MODE: "down" },
    },
  ],
});
