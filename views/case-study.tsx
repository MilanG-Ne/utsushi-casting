import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Txt } from "@/components/Txt";
import { getCaseStudy, getCaseStudySlugs } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { buildMetadata } from "@/lib/seo/metadata";

type Params = Promise<{ slug: string }>;

export async function caseStudyParams() {
  return (await getCaseStudySlugs()).map((slug) => ({ slug }));
}

export async function caseStudyMetadata(lang: Locale, params: Params) {
  const { slug } = await params;
  const study = await getCaseStudy(slug, lang);
  if (!study) return {};
  return buildMetadata({ lang, route: { name: "caseStudy", slug }, title: study.seo.title, description: study.seo.description, type: "article" });
}

export async function CaseStudyPage({ lang, params }: { lang: Locale; params: Params }) {
  const { slug } = await params;
  const study = await getCaseStudy(slug, lang);
  if (!study) notFound();
  return (
    <PageShell lang={lang} route={{ name: "caseStudy", slug }}>
      <section className="container page-intro">
        <Txt as="h1" className="display-2" value={study.title} />
        <Txt as="p" className="lede" value={study.summary} />
      </section>
    </PageShell>
  );
}
