#!/usr/bin/env node
/**
 * First-load JavaScript budget, checked after `next build`.
 *
 * For every prerendered page (both locales) it reads the HTML Next.js produced, collects
 * the scripts that page loads up front (<script src> and <link rel="preload" as="script">),
 * gzips each file from .next/static and sums them. Not counted: noModule polyfills (never
 * downloaded by modern browsers), third-party scripts (analytics) and dynamically imported
 * chunks such as GSAP on the homepage, which is reported separately.
 *
 *   node scripts/check-js-budget.mjs              # table + exit code 1 if over budget
 *   node scripts/check-js-budget.mjs --json out.json
 *   BUDGET_KB=150 node scripts/check-js-budget.mjs
 */
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, ".next", "server", "app");
const STATIC_DIR = join(ROOT, ".next", "static");
const BUDGET_KB = Number(process.env.BUDGET_KB ?? 150);
const BUDGET = BUDGET_KB * 1024;

if (!existsSync(APP_DIR)) {
  console.error("No build output found. Run `pnpm build` first.");
  process.exit(2);
}

const gzCache = new Map();
const gz = (file) => {
  if (!gzCache.has(file)) gzCache.set(file, gzipSync(readFileSync(file), { level: 9 }).length);
  return gzCache.get(file);
};

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function routeFor(htmlFile) {
  const rel = relative(APP_DIR, htmlFile).replace(/\\/g, "/").replace(/\.html$/, "");
  if (rel === "en") return "/";
  if (rel.startsWith("en/")) return `/${rel.slice(3)}`;
  return `/${rel}`;
}

const pages = walk(APP_DIR)
  .filter((f) => f.endsWith(".html") && /^(en|ja)(\/|\.html$)/.test(relative(APP_DIR, f).replace(/\\/g, "/")))
  .sort();

const rows = pages.map((file) => {
  const html = readFileSync(file, "utf8");
  const srcs = new Set();
  for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
    // Legacy polyfills are marked noModule: modern browsers never download them.
    if (/\bnomodule\b/i.test(tag)) continue;
    const src = tag.match(/\bsrc="([^"]+\.js(?:\?[^"]*)?)"/)?.[1];
    if (src) srcs.add(src);
  }
  for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
    if (!/\brel="(?:preload|modulepreload)"/.test(tag) || !/\bas="script"/.test(tag)) continue;
    const href = tag.match(/\bhref="([^"]+\.js(?:\?[^"]*)?)"/)?.[1];
    if (href) srcs.add(href);
  }
  let external = 0;
  const missing = [];
  for (const raw of srcs) {
    // Accept an absolute assetPrefix; anything else outside /_next/static is third-party.
    const src = raw.replace(/^https?:\/\/[^/]+/, "");
    if (!src.startsWith("/_next/static/")) continue;
    const path = join(STATIC_DIR, decodeURIComponent(src.replace("/_next/static/", "").split("?")[0]));
    if (existsSync(path)) external += gz(path);
    else missing.push(src);
  }
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].reduce((sum, m) => sum + m[1].length, 0);
  const inlineGz = gzipSync(Buffer.from([...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n"))).length;
  return { route: routeFor(file), scripts: srcs.size, firstLoadGzip: external, inlineBytes: inline, inlineGzip: inlineGz, missing, srcs: [...srcs] };
});

// GSAP chunks: contain GSAP code but are not part of any page's first load (dynamic import).
const firstLoad = new Set(
  rows.flatMap((r) => r.srcs.map((s) => join(STATIC_DIR, s.replace(/^https?:\/\/[^/]+/, "").replace("/_next/static/", "").split("?")[0]))),
);
const lazy = walk(join(STATIC_DIR, "chunks"))
  .filter((f) => f.endsWith(".js") && !firstLoad.has(f))
  .filter((f) => /GreenSock|ScrollTrigger/.test(readFileSync(f, "utf8")))
  .reduce((sum, f) => sum + gz(f), 0);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const over = rows.filter((r) => r.firstLoadGzip > BUDGET || r.missing.length);
const lines = [
  `### First-load JS budget (${BUDGET_KB} KB gzipped per page)`,
  "",
  "| Route | Scripts | First-load JS (gzip) | Inline RSC/data (gzip) | Status |",
  "| --- | ---: | ---: | ---: | --- |",
  ...rows.map((r) => `| \`${r.route}\` | ${r.scripts} | ${kb(r.firstLoadGzip)} | ${kb(r.inlineGzip)} | ${r.missing.length ? "missing files" : r.firstLoadGzip > BUDGET ? "over budget" : "ok"} |`),
  "",
  `Largest page: ${kb(Math.max(...rows.map((r) => r.firstLoadGzip)))}. GSAP + ScrollTrigger, lazy-loaded on the homepage only: ${kb(lazy)} gzipped.`,
];
const report = lines.join("\n");
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

const jsonIndex = process.argv.indexOf("--json");
if (jsonIndex > -1 && process.argv[jsonIndex + 1]) {
  const pages = rows.map((r) => ({ route: r.route, scripts: r.scripts, firstLoadGzip: r.firstLoadGzip, inlineGzip: r.inlineGzip }));
  writeFileSync(process.argv[jsonIndex + 1], JSON.stringify({ budgetKb: BUDGET_KB, lazyGsapGzip: lazy, pages }, null, 2));
}

if (rows.length < 16) {
  console.error(`Expected at least 16 prerendered pages (8 per locale), found ${rows.length}.`);
  process.exit(1);
}
if (over.length) {
  console.error(`\n${over.length} page(s) exceed the budget or reference missing files.`);
  process.exit(1);
}
