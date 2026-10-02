import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ArrowRight } from "@/components/Icons";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routes";
import { noIndexMetadata } from "@/lib/seo/metadata";

export function notFoundMetadata(lang: Locale) {
  return noIndexMetadata(getDictionary(lang).notFound.title);
}

/** Clapperboard-style slate, purely decorative. */
export function NotFoundSlate() {
  return (
    <dl className="not-found-slate" aria-hidden="true">
      <dt>Scene</dt>
      <dt>Take</dt>
      <dt>Roll</dt>
      <dd>404</dd>
      <dd>01</dd>
      <dd>—</dd>
    </dl>
  );
}

export function NotFoundContent({ lang, level = 1 }: { lang: Locale; level?: 1 | 2 }) {
  const t = getDictionary(lang);
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="not-found-content" lang={lang}>
      <p className="eyebrow">{t.notFound.eyebrow}</p>
      <Heading className="display-2">{t.notFound.heading}</Heading>
      <p className="lede">{t.notFound.body}</p>
      <ul className="not-found-links">
        <li>
          <Link className="button button--primary" href={href({ name: "home" }, lang)}>
            {t.notFound.homeLink}
            <ArrowRight />
          </Link>
        </li>
        <li>
          <Link className="button" href={href({ name: "work" }, lang)}>
            {t.notFound.workLink}
          </Link>
        </li>
        <li>
          <Link className="button" href={href({ name: "contact" }, lang)}>
            {t.notFound.contactLink}
          </Link>
        </li>
      </ul>
    </div>
  );
}

/**
 * Localized 404 used when a page calls notFound() inside a locale tree (for example a
 * document deleted in the CMS before the next deploy). Unmatched URLs are answered by
 * app/global-not-found.tsx, which is fully server-rendered and bilingual.
 */
export function NotFoundPage({ lang }: { lang: Locale }) {
  return (
    <PageShell lang={lang} route={null}>
      <div className="container not-found">
        <NotFoundSlate />
        <NotFoundContent lang={lang} />
      </div>
    </PageShell>
  );
}
