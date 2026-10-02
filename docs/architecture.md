# Architecture and i18n routing plan

Utsushi Casting is a **fictional** bilingual (English / Japanese) casting studio. This
repository is a portfolio demonstration of a production-grade marketing site: localized
CMS content, international SEO, a strict performance budget, and a contact pipeline that
does not lose enquiries when the CRM is down.

This document was written before any application code and is kept up to date as the
reference for how the pieces fit together.

## Goals and constraints

| Area | Target |
| --- | --- |
| Languages | English at the root, a full Japanese mirror under `/ja` |
| Pages | Home, work index, 2 case studies, 3 service pages, contact, plus a designed 404 |
| CMS | Sanity, field-level localization (`{ en, ja }` on each translatable field) |
| SEO | Per-page title/description in both languages, `hreflang` + `x-default`, JSON-LD, sitemap, robots |
| Performance | Lighthouse mobile ≥ 90, LCP < 2.5 s, CLS 0, first-load JS < 150 KB gzipped (checked in CI) |
| Accessibility | WCAG 2.2 AA, visible focus, full keyboard support, `prefers-reduced-motion` |
| Motion | GSAP on the homepage only, lazy-loaded, never shipped to content pages |
| Hosting | Vercel (Hobby plan compatible, no paid services required) |

## Project structure

```text
app/
  en/  ja/                     One route tree per locale, each with its own root layout (<html lang>)
    layout.tsx                 Thin binding: <RootDocument lang="…">
    page.tsx                   Home (the only route that loads GSAP)
    work/page.tsx              Work index
    work/[slug]/page.tsx       Case studies (generateStaticParams, dynamicParams = false)
    services/[slug]/page.tsx   Service pages (generateStaticParams, dynamicParams = false)
    contact/page.tsx           Contact page + enquiry form
    not-found.tsx              Localized 404 for notFound() calls inside the tree
  global-not-found.tsx         Server-rendered bilingual 404 for every unmatched URL
  studio/[[...tool]]/          Embedded Sanity Studio (own root layout, excluded from budgets)
  api/
    enquiries/route.ts         Contact form handler (JSON and no-JS form posts)
    enquiries/retry/route.ts   Drains the retry queue (Vercel Cron / scheduled workflow)
    mock-crm/enquiries/route.ts  Mock CRM endpoint (signature check, idempotency, outage simulation)
    revalidate/route.ts        Sanity webhook → tag-based revalidation
  sitemap.ts, robots.ts
views/                         Page implementations shared by both locale trees (HomePage, ServicePage, …)
components/                    Server components by default; client components are leaf-level and few
```

## i18n routing

### URL shape

| Page | English | Japanese |
| --- | --- | --- |
| Home | `/` | `/ja` |
| Work index | `/work` | `/ja/work` |
| Case study | `/work/harbour-lights` | `/ja/work/harbour-lights` |
| Service | `/services/voice-and-localization` | `/ja/services/voice-and-localization` |
| Contact | `/contact` | `/ja/contact` |

Slugs are shared between languages. Japanese sites conventionally use ASCII slugs, shared
slugs keep URLs stable when copy changes, and the language switch becomes a pure function
of the current route.

### How English lives at the root without middleware

Each locale is a real route tree (`app/en`, `app/ja`) with its own root layout, so the
`<html lang>` attribute is correct in the server HTML and the locale is a compile-time
constant in every page. The route files are three-line bindings to shared views in
`views/`; a unit test asserts both trees contain exactly the same files.

English is served from the root by **config-level rewrites** in `next.config.ts`, not by
middleware:

```ts
rewrites: beforeFiles
  "/"            → "/en"
  "/:path(…)"    → "/en/:path"   // everything except /ja, /en, /api, /studio, /_next and files
redirects:
  "/en", "/en/:path*" → "/" , "/:path*"   (308, so English never has two URLs)
```

Why rewrites instead of middleware (`proxy.ts`):

- Every page stays fully static. There is no per-request function invocation for routing.
- Nothing runs on the edge for a plain page view, so there is no added TTFB or cost.
- The behaviour is declarative and testable from the config alone.

Why real `en`/`ja` trees instead of a dynamic `[lang]` segment: `not-found.tsx` receives no
params, so a dynamic segment cannot know which language its 404 should be in. With static
trees each locale owns its 404, and the layout needs no `generateStaticParams`.

### 404 handling

- Unknown slugs and unmatched URLs never reach a page: slug routes use
  `dynamicParams = false`, and there is no catch-all. Next answers them with
  `app/global-not-found.tsx`, a fully server-rendered page with a real `404` status.
- That page is bilingual (it bypasses the locale layouts). A one-line inline script puts the
  Japanese copy first on `/ja/...` URLs before first paint; without JavaScript both
  languages are shown.
- New CMS documents therefore need a rebuild to get a URL (a Sanity webhook can call a
  Vercel deploy hook). Edits to existing documents use tag revalidation and need no rebuild.

There is no locale auto-detection redirect. Visitors land on the URL they asked for, and
search engines see stable, crawlable URLs. Language choice is explicit through the switch.

### Route registry and the language switch

`lib/i18n/routes.ts` is the single source of truth for URLs:

```ts
type AppRoute =
  | { name: "home" } | { name: "work" } | { name: "contact" }
  | { name: "caseStudy"; slug: string } | { name: "service"; slug: string };

href(route, lang)        // "/ja/work/harbour-lights"
alternates(route)        // { en: "/work/harbour-lights", ja: "/ja/work/harbour-lights" }
```

The same `alternates(route)` result feeds three things, so they can never drift apart:

1. the language switch link in the header (keeps the visitor on the equivalent page),
2. `<link rel="alternate" hreflang>` tags, including `x-default` → English,
3. sitemap `xhtml:link` alternates.

Layouts in the App Router do not know the current pathname. Instead of reading it in a
client component, each page renders a `PageShell` server component with its route, so
the header, navigation `aria-current` state and the language switch are all static HTML
with zero client JavaScript. The switch link carries `hreflang` and `lang` attributes.

### Localized content

- **UI strings** (navigation, form labels, 404 copy) live in typed dictionaries:
  `lib/i18n/dictionaries/en.ts` and `ja.ts`. The Japanese dictionary is typed against the
  English one, so a missing key fails type-checking.
- **CMS content** uses field-level localization: each translatable field is an object
  `{ en, ja }` (string, text or Portable Text). One document holds both languages, so
  slugs, references, images and dates are shared, and only copy differs.
- `localize(field, lang)` picks the requested language and falls back to English. When it
  falls back, the rendered element gets `lang="en"` so screen readers pronounce it
  correctly.

### Metadata

`buildMetadata({ lang, route, title, description })` returns Next.js `Metadata` with:

- a title template per locale (`%s — Utsushi Casting` / `%s｜ウツシ・キャスティング`),
- `alternates.canonical` (self-referencing),
- `alternates.languages` with `en`, `ja` and `x-default`,
- Open Graph `locale` / `alternateLocale` (`en_GB`, `ja_JP`).

Both 404 pages are `noindex` and carry no alternates.

## Content model (Sanity)

| Type | Purpose | Key fields |
| --- | --- | --- |
| `siteSettings` (singleton) | Organization data | name, tagline, description, contact email, locations, social profiles, default SEO |
| `page` | Home, work index, contact | key, title, SEO, hero heading, intro, body, featured case studies, showreel |
| `caseStudy` | Work detail pages | title, slug, client, year, format, summary, body, credits, services, hero image, video, SEO |
| `service` | Service pages | title, slug, summary, body, deliverables, process steps, FAQ, order, SEO |

Shared object types: `localeString`, `localeText`, `localePortableText`, `seo`,
`imageWithAlt`, `video`.

Data access goes through `lib/content`. When a Sanity project is configured the site reads
from it with tag-based caching and on-demand revalidation via webhook. Without Sanity
credentials (local development, CI, Lighthouse) it reads the same bilingual seed documents
from `content/seed`, mapped through the same functions, so tests exercise real content.

## Performance plan

- Server Components everywhere. Client components are limited to the video facade, the
  enquiry form and the homepage motion controller.
- No `next/image` and no client-side image component: a server-rendered `<picture>` with
  AVIF/WebP `srcset`, explicit `width`/`height` and `fetchpriority` for the hero.
- Fonts: one self-hosted Latin display face via `next/font/local` (metric-adjusted
  fallback, `display: optional`, so no layout shift) with a Latin `unicode-range`, so
  Japanese text never waits for it. Japanese uses the system font stacks (Hiragino, Yu
  Gothic, Noto Sans JP), so there is no multi-megabyte CJK font download.
- `content-visibility: auto` on below-the-fold sections to cut initial layout work.
- GSAP: the homepage renders a small client component that, after hydration and only when
  `prefers-reduced-motion` is not `reduce`, dynamically imports `gsap` and `ScrollTrigger`
  during idle time. Content pages never reference it. The LCP element (hero heading) is
  never animated, and nothing is hidden before JS runs.
- Video: poster image + play button. The `<video>` element and file are created only on
  click. No autoplay.
- Budget: `scripts/check-js-budget.mjs` reads the prerendered HTML of every page, sums the
  gzipped size of the scripts each page loads, and fails CI above 150 KB. Results are in
  [performance.md](performance.md).

## Enquiry pipeline

```text
form ──► POST /api/enquiries ──► validate (zod) ──► outbox.put(record)
                                     │
                                     ├─► POST CRM (signed, idempotency key, timeout, 2 tries)
                                     │      ├─ ok   → outbox.remove → 200 delivered
                                     │      └─ fail → email fallback + schedule retry → 202 queued
                                     └─ outbox and email both unavailable → 503 + direct email address
retry: Vercel Cron (daily on Hobby) + after() on each new submission + optional scheduled workflow
       exponential backoff → dead-letter + alert email after the final attempt
```

The payload schema is documented in `docs/enquiry-payload.md` and published as JSON Schema
generated from the same zod schema the handler uses.

## Milestones

1. Project structure and i18n routing plan (this document)
2. Next.js scaffold: locale layouts, rewrites, route registry, metadata, language switch, 404
3. Sanity schemas, embedded Studio, content layer and bilingual seed content
4. Pages, design system, generated media and the video facade
5. SEO: JSON-LD, sitemap, robots, Open Graph images
6. Contact pipeline: route handler, mock CRM, email fallback, retry queue, payload docs
7. Homepage motion with GSAP (route-scoped, lazy, reduced-motion aware)
8. CI (lint, typecheck, tests, build, JS budget, Lighthouse CI), README and results
