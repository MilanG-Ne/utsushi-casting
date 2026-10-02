import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CallToAction } from "@/components/CallToAction";
import { CaseStudyCard } from "@/components/CaseStudyCard";
import { PageShell } from "@/components/PageShell";
import { JsonLd } from "@/components/JsonLd";
import { Txt } from "@/components/Txt";
import { getCaseStudies, getPage } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routes";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageGraph } from "@/lib/seo/structured-data";

const ROUTE = { name: "work" } as const;

export async function workIndexMetadata(lang: Locale) {
  const page = await getPage("work", lang);
  return buildMetadata({ lang, route: ROUTE, title: page.seo.title, description: page.seo.description });
}

export async function WorkIndexPage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const [page, studies] = await Promise.all([getPage("work", lang), getCaseStudies(lang)]);
  const crumbs = [
    { label: t.nav.home, href: href({ name: "home" }, lang) },
    { label: page.title.text, href: href(ROUTE, lang), lang: page.title.lang },
  ];

  const structuredData = await pageGraph({
    lang,
    route: ROUTE,
    type: "CollectionPage",
    title: page.seo.title,
    description: page.seo.description,
    crumbs,
  });

  return (
    <PageShell lang={lang} route={ROUTE}>
      <JsonLd data={structuredData} />
      <header className="container page-intro">
        <Breadcrumbs items={crumbs} label={t.a11y.breadcrumb} />
        {page.eyebrow && <Txt as="p" className="eyebrow" value={page.eyebrow} />}
        <h1 className="display-2">
          <Txt value={page.heading} />
        </h1>
        <Txt as="p" className="lede" value={page.intro} />
      </header>
      <section className="container" aria-label={page.title.text}>
        <div className="work-list">
          {studies.map((study) => (
            <CaseStudyCard
              key={study.slug}
              study={study}
              lang={lang}
              ctaLabel={t.work.viewCaseStudy}
              headingLevel={2}
              sizes="(min-width: 76rem) 40rem, (min-width: 60rem) 55vw, 100vw"
            />
          ))}
        </div>
      </section>
      <CallToAction lang={lang} />
    </PageShell>
  );
}
