import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BrandMark, Globe } from "@/components/Icons";
import { fraunces } from "@/lib/fonts/ja";
import { en } from "@/lib/i18n/dictionaries/en";
import { ja } from "@/lib/i18n/dictionaries/ja";
import { layoutViewport } from "@/lib/seo/layout";
import { NotFoundContent, NotFoundSlate } from "@/views/not-found";

/**
 * Served with a 404 status for every URL that matches no route, in either language.
 * It bypasses the locale layouts, so it is one bilingual page; an inline script moves
 * the Japanese copy first for /ja URLs before first paint (no layout shift). Without
 * JavaScript both languages are still shown.
 */
export const metadata: Metadata = {
  title: `${en.notFound.title} · ${ja.notFound.title} — Utsushi Casting`,
  robots: { index: false, follow: true },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = layoutViewport;

const orderScript = `if(/^\\/ja(\\/|$)/.test(location.pathname))document.documentElement.classList.add("ja-first")`;

export default function GlobalNotFound() {
  return (
    <html lang="en" className={fraunces.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: orderScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          {en.a11y.skipToContent}
        </a>
        <header className="site-header">
          <div className="container header-inner">
            <a className="brand" href="/">
              <BrandMark />
              <span className="brand-name">
                Utsushi
                <small>Casting</small>
              </span>
              <span className="sr-only">{en.nav.homeSuffix}</span>
            </a>
            <a className="lang-switch" href="/ja" hrefLang="ja" lang="ja">
              <Globe />
              <span>日本語</span>
            </a>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="container not-found">
          <NotFoundSlate />
          <h1 className="sr-only">
            {en.notFound.title} / <span lang="ja">{ja.notFound.title}</span>
          </h1>
          <div className="not-found-bilingual">
            <NotFoundContent lang="en" level={2} />
            <NotFoundContent lang="ja" level={2} />
          </div>
        </main>
        <footer className="site-footer site-footer--compact">
          <div className="container footer-bottom">
            <p>{en.meta.fictionNotice}</p>
            <p lang="ja">{ja.meta.fictionNotice}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
