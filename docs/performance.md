# Performance budget and results

Targets: Lighthouse mobile performance ≥ 90, LCP < 2.5 s, CLS 0, and first-load JavaScript
under 150 KB gzipped on every page. All of them are enforced in CI on every push (see
`.github/workflows/ci.yml`).

Measured on 2 October 2026 from a production build (`next build && next start`) on Linux,
Chromium 141, with the bundled seed content.

## First-load JavaScript

`pnpm budget` (`scripts/check-js-budget.mjs`) reads the prerendered HTML of all 16 pages,
collects every script the page loads up front (`<script src>` and `<link rel="preload"
as="script">`), gzips each file at level 9 and sums them. It fails the build above 150 KB.

Not counted: the `noModule` polyfill bundle (modern browsers never download it), third-party
scripts (analytics), and dynamically imported chunks (GSAP), which are reported separately.

| Route | Scripts | First-load JS (gzip) | Inline RSC data (gzip) |
| --- | ---: | ---: | ---: |
| `/` | 8 | 135.9 KB | 16.8 KB |
| `/work` | 8 | 134.8 KB | 14.0 KB |
| `/work/harbour-lights` | 8 | 135.2 KB | 15.3 KB |
| `/work/the-lantern-keeper` | 8 | 135.2 KB | 15.2 KB |
| `/services/film-and-television` | 8 | 134.8 KB | 15.4 KB |
| `/services/commercials` | 8 | 134.8 KB | 14.7 KB |
| `/services/voice-and-localization` | 8 | 134.8 KB | 15.1 KB |
| `/contact` | 8 | 136.8 KB | 13.2 KB |
| `/ja` | 8 | 135.9 KB | 18.5 KB |
| `/ja/work` | 8 | 134.8 KB | 14.9 KB |
| `/ja/work/harbour-lights` | 8 | 135.2 KB | 16.6 KB |
| `/ja/work/the-lantern-keeper` | 8 | 135.2 KB | 16.5 KB |
| `/ja/services/film-and-television` | 8 | 134.8 KB | 16.7 KB |
| `/ja/services/commercials` | 8 | 134.8 KB | 15.9 KB |
| `/ja/services/voice-and-localization` | 8 | 134.8 KB | 16.3 KB |
| `/ja/contact` | 8 | 136.8 KB | 14.3 KB |

GSAP + ScrollTrigger: 43.7 KB gzipped, requested only on the homepage, after hydration,
during idle time, and never under `prefers-reduced-motion`.

About 133 KB of every page is the Next.js 16 / React 19 client runtime that any App Router
page ships. The site's own client code adds 1–4 KB per page: the video facade on pages with
a video, the enquiry form on the contact page and the motion controller on the homepage.
Everything else is Server Components and ships no JavaScript.

## Lighthouse (mobile)

Lighthouse 12.6 via Lighthouse CI, default mobile settings: Moto G Power emulation,
simulated slow 4G (150 ms RTT, 1.6 Mbps), 4× CPU slowdown. Five runs per URL; the median
run is shown and asserted.

| Page | Performance | FCP | LCP | CLS | TBT | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 98 | 0.95 s | 1.91 s | 0 | 160 ms | 100 | 100 | 100 |
| `/work` | 98 | 0.97 s | 1.98 s | 0 | 140 ms | 100 | 100 | 100 |
| `/work/harbour-lights` | 96 | 0.94 s | 1.96 s | 0 | 211 ms | 100 | 100 | 100 |
| `/services/voice-and-localization` | 92 | 0.90 s | 2.00 s | 0 | 322 ms | 100 | 100 | 100 |
| `/contact` | 97 | 0.97 s | 1.93 s | 0 | 188 ms | 100 | 100 | 100 |
| `/ja` | 99 | 0.97 s | 1.89 s | 0 | 122 ms | 100 | 100 | 100 |
| `/ja/work/the-lantern-keeper` | 99 | 0.94 s | 1.89 s | 0 | 121 ms | 100 | 100 | 100 |
| `/ja/services/commercials` | 98 | 0.93 s | 2.06 s | 0 | 103 ms | 100 | 100 | 100 |
| `/ja/contact` | 98 | 0.95 s | 2.33 s | 0 | 106 ms | 100 | 100 | 100 |

CI assertions (`lighthouserc.cjs`): performance ≥ 0.90, accessibility ≥ 0.95, best practices
≥ 0.90, SEO ≥ 0.90, LCP ≤ 2500 ms and CLS = 0 as errors; TBT ≤ 200 ms as a warning.

### Reading these numbers

With simulated throttling, Lighthouse replays an unthrottled page load under slow
conditions. On a local server every request arrives in a few milliseconds, so the
framework scripts download and run before the first paint; the simulation then charges
their download and execution to LCP. That is why LCP sits around 1.9–2.3 s here while the
observed, unthrottled LCP is 0.15–0.2 s. Treat the lab numbers as a conservative bound
and check field data (Chrome UX Report) once the site has traffic.

## What keeps the pages fast

- **Server Components by default.** Only three small client components exist.
- **No `next/image`.** Images are server-rendered `<picture>` elements with AVIF/WebP
  `srcset`, explicit dimensions, an LQIP background and `fetchpriority="high"` plus a
  preload for the above-the-fold hero.
- **One small web font.** Fraunces, Latin subset, weight axis only (36 KB), with
  `font-display: optional` and a metric-adjusted fallback, so text never re-flows. A
  `unicode-range` keeps Japanese text from waiting for it; Japanese uses system fonts.
- **CSS inlined** into the document head (`experimental.inlineCss`), so there is no
  render-blocking stylesheet request.
- **`content-visibility: auto`** on below-the-fold sections, which halves the initial
  layout work on long pages.
- **No layout shift by construction.** Every image and video box has an aspect ratio
  before its media loads; motion uses transform and opacity only; nothing above the fold
  is hidden waiting for JavaScript. Playwright asserts CLS = 0 on 8 pages while loading
  and scrolling at phone size.
- **Video behind a facade.** No `<video>` element and no video bytes until a click.
- **Static everything.** Every page is prerendered; routing uses config rewrites, not
  middleware, so no function runs for a page view.

## Reproducing

```bash
pnpm build
pnpm budget                                  # JS budget table
pnpm lhci                                    # Lighthouse CI (needs Chrome; set CHROME_PATH)
```
