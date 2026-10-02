import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Txt } from "@/components/Txt";
import { getService, getServiceSlugs } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { buildMetadata } from "@/lib/seo/metadata";

type Params = Promise<{ slug: string }>;

export async function serviceParams() {
  return (await getServiceSlugs()).map((slug) => ({ slug }));
}

export async function serviceMetadata(lang: Locale, params: Params) {
  const { slug } = await params;
  const service = await getService(slug, lang);
  if (!service) return {};
  return buildMetadata({ lang, route: { name: "service", slug }, title: service.seo.title, description: service.seo.description });
}

export async function ServicePage({ lang, params }: { lang: Locale; params: Params }) {
  const { slug } = await params;
  const service = await getService(slug, lang);
  if (!service) notFound();
  return (
    <PageShell lang={lang} route={{ name: "service", slug }}>
      <section className="container page-intro">
        <Txt as="h1" className="display-2" value={service.title} />
        <Txt as="p" className="lede" value={service.summary} />
      </section>
    </PageShell>
  );
}
