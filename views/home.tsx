import { PageShell } from "@/components/PageShell";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo/metadata";

const ROUTE = { name: "home" } as const;

export async function homeMetadata(lang: Locale) {
  const t = getDictionary(lang);
  return buildMetadata({ lang, route: ROUTE, title: t.meta.defaultTitle, description: t.meta.defaultDescription, absoluteTitle: true });
}

export function HomePage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  return (
    <PageShell lang={lang} route={ROUTE}>
      <section className="container page-intro">
        <h1 className="display-1">{t.meta.defaultTitle}</h1>
        <p className="lede">{t.meta.defaultDescription}</p>
      </section>
    </PageShell>
  );
}
