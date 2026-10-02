import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo/metadata";

type Params = Promise<{ slug: string }>;
const SLUGS = ["harbour-lights", "the-lantern-keeper"];

export async function caseStudyParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function caseStudyMetadata(lang: Locale, params: Params) {
  const { slug } = await params;
  if (!SLUGS.includes(slug)) return {};
  const t = getDictionary(lang);
  return buildMetadata({ lang, route: { name: "caseStudy", slug }, title: slug, description: t.meta.defaultDescription, type: "article" });
}

export async function CaseStudyPage({ lang, params }: { lang: Locale; params: Params }) {
  const { slug } = await params;
  if (!SLUGS.includes(slug)) notFound();
  return (
    <PageShell lang={lang} route={{ name: "caseStudy", slug }}>
      <section className="container page-intro">
        <h1 className="display-2">{slug}</h1>
      </section>
    </PageShell>
  );
}
