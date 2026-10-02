import { PageShell } from "@/components/PageShell";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo/metadata";

const ROUTE = { name: "contact" } as const;

export async function contactMetadata(lang: Locale) {
  const t = getDictionary(lang);
  return buildMetadata({ lang, route: ROUTE, title: t.nav.contact, description: t.home.ctaBody });
}

export function ContactPage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  return (
    <PageShell lang={lang} route={ROUTE}>
      <section className="container page-intro">
        <h1 className="display-2">{t.nav.contact}</h1>
      </section>
    </PageShell>
  );
}
