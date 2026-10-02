import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getNavServices } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { buildMetadata } from "@/lib/seo/metadata";

type Params = Promise<{ slug: string }>;

export async function serviceParams() {
  return (await getNavServices("en")).map((s) => ({ slug: s.slug }));
}

export async function serviceMetadata(lang: Locale, params: Params) {
  const { slug } = await params;
  const service = (await getNavServices(lang)).find((s) => s.slug === slug);
  if (!service) return {};
  return buildMetadata({ lang, route: { name: "service", slug }, title: service.title, description: service.summary });
}

export async function ServicePage({ lang, params }: { lang: Locale; params: Params }) {
  const { slug } = await params;
  const service = (await getNavServices(lang)).find((s) => s.slug === slug);
  if (!service) notFound();
  return (
    <PageShell lang={lang} route={{ name: "service", slug }}>
      <section className="container page-intro">
        <h1 className="display-2">{service.title}</h1>
        <p className="lede">{service.summary}</p>
      </section>
    </PageShell>
  );
}
