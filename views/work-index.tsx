import { PageShell } from "@/components/PageShell";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo/metadata";

const ROUTE = { name: "work" } as const;

export async function workIndexMetadata(lang: Locale) {
  const t = getDictionary(lang);
  return buildMetadata({ lang, route: ROUTE, title: t.nav.work, description: t.meta.defaultDescription });
}

export function WorkIndexPage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  return (
    <PageShell lang={lang} route={ROUTE}>
      <section className="container page-intro">
        <h1 className="display-2">{t.nav.work}</h1>
      </section>
    </PageShell>
  );
}
