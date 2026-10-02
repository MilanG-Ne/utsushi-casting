/**
 * Lighthouse CI: mobile emulation with Lighthouse's default simulated throttling
 * (slow 4G, 4x CPU slowdown). Five runs per URL; assertions use the median run.
 * Pages are served by `next start` from the production build.
 */
const PORT = 3200;
const pages = [
  "/",
  "/work",
  "/work/harbour-lights",
  "/services/voice-and-localization",
  "/contact",
  "/ja",
  "/ja/work/the-lantern-keeper",
  "/ja/services/commercials",
  "/ja/contact",
];

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm exec next start -p ${PORT}`,
      startServerReadyPattern: "Ready in",
      url: pages.map((p) => `http://localhost:${PORT}${p}`),
      numberOfRuns: 5,
      settings: {
        chromeFlags: "--no-sandbox --headless=new",
        ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9, aggregationMethod: "median-run" }],
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "median-run" }],
        "categories:best-practices": ["error", { minScore: 0.9, aggregationMethod: "median-run" }],
        "categories:seo": ["error", { minScore: 0.9, aggregationMethod: "median-run" }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500, aggregationMethod: "median-run" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0, aggregationMethod: "median-run" }],
        "total-blocking-time": ["warn", { maxNumericValue: 200, aggregationMethod: "median-run" }],
      },
    },
    upload: {
      target: process.env.LHCI_UPLOAD_TARGET ?? "temporary-public-storage",
      outputDir: ".lighthouseci/reports",
    },
  },
};
