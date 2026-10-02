import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { AppRoute } from "@/lib/i18n/routes";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/**
 * Page chrome. Each page passes its own route (null for the 404 page), which lets the header mark the current
 * navigation item and point the language switch at the equivalent page, all on the server.
 */
export function PageShell({ lang, route, children }: { lang: Locale; route: AppRoute | null; children: ReactNode }) {
  const t = getDictionary(lang);
  return (
    <>
      <a className="skip-link" href="#main">
        {t.a11y.skipToContent}
      </a>
      <SiteHeader lang={lang} route={route} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter lang={lang} route={route} />
    </>
  );
}
