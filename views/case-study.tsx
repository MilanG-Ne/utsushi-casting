import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CallToAction } from "@/components/CallToAction";
import { ArrowRight } from "@/components/Icons";
import { PageShell } from "@/components/PageShell";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { RichText } from "@/components/RichText";
import { JsonLd } from "@/components/JsonLd";
import { Txt } from "@/components/Txt";
import { VideoFigure } from "@/components/VideoFigure";
import { getCaseStudies, getCaseStudy, getCaseStudySlugs, getPage } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { absoluteUrl, href } from "@/lib/i18n/routes";
import { videoNode } from "@/lib/seo/jsonld";
import { buildMetadata, ogImageFor } from "@/lib/seo/metadata";
import { pageGraph } from "@/lib/seo/structured-data";

type Params = Promise<{ slug: string }>;

export async function caseStudyParams() {
  return (await getCaseStudySlugs()).map((slug) => ({ slug }));
}

export async function caseStudyMetadata(lang: Locale, params: Params) {
  const { slug } = await params;
  const study = await getCaseStudy(slug, lang);
  if (!study) return {};
  return buildMetadata({
    lang,
    route: { name: "caseStudy", slug },
    title: study.seo.title,
    description: study.seo.description,
    type: "article",
    image: ogImageFor(slug, lang, study.heroImage),
  });
}

export async function CaseStudyPage({ lang, params }: { lang: Locale; params: Params }) {
  const { slug } = await params;
  const t = getDictionary(lang);
  const [study, all, workPage] = await Promise.all([getCaseStudy(slug, lang), getCaseStudies(lang), getPage("work", lang)]);
  if (!study) notFound();

  const route = { name: "caseStudy", slug } as const;
  const next = all[(all.findIndex((c) => c.slug === slug) + 1) % all.length];
  const crumbs = [
    { label: t.nav.home, href: href({ name: "home" }, lang) },
    { label: workPage.title.text, href: href({ name: "work" }, lang), lang: workPage.title.lang },
    { label: study.title.text, href: href(route, lang), lang: study.title.lang },
  ];

  const structuredData = await pageGraph({
    lang,
    route,
    title: study.seo.title,
    description: study.seo.description,
    crumbs,
    primaryImage: study.heroImage,
    extra: study.video ? [videoNode(study.video, absoluteUrl(href(route, lang)), lang)] : [],
  });

  return (
    <PageShell lang={lang} route={route}>
      <JsonLd data={structuredData} />
      <article>
        <header className="container page-intro case-intro">
          <Breadcrumbs items={crumbs} label={t.a11y.breadcrumb} />
          <p className="eyebrow">
            <Txt value={study.format} />
            {lang === "ja" ? `（${study.year}年）` : ` · ${study.year}`}
          </p>
          <h1 className="display-1">
            <Txt value={study.title} />
          </h1>
          <Txt as="p" className="lede" value={study.summary} />
        </header>

        <div className="container">
          <dl className="facts">
            <div>
              <dt>{t.work.client}</dt>
              <dd>
                <Txt value={study.client} />
              </dd>
            </div>
            <div>
              <dt>{t.work.year}</dt>
              <dd>{study.year}</dd>
            </div>
            {study.locations && (
              <div>
                <dt>{t.work.location}</dt>
                <dd>
                  <Txt value={study.locations} />
                </dd>
              </div>
            )}
            {study.rolesCast !== undefined && (
              <div>
                <dt>{t.work.rolesCast}</dt>
                <dd>{study.rolesCast}</dd>
              </div>
            )}
            {study.services.length > 0 && (
              <div>
                <dt>{t.work.services}</dt>
                <dd>
                  <ul className="inline-list">
                    {study.services.map((s) => (
                      <li key={s.slug}>
                        <Link href={href({ name: "service", slug: s.slug }, lang)}>
                          <Txt value={s.title} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>

          <div className="case-hero frame">
            <ResponsiveImage image={study.heroImage} sizes="(min-width: 76rem) 72rem, 100vw" priority />
          </div>
        </div>

        {study.outcomes.length > 0 && (
          <section className="container stats-section" aria-labelledby="outcomes-heading">
            <h2 id="outcomes-heading" className="sr-only">
              {t.work.outcomes}
            </h2>
            <dl className="stats">
              {study.outcomes.map((o) => (
                <div key={o.label.text} className="stat">
                  <dt>
                    <Txt value={o.label} />
                  </dt>
                  <dd>
                    <Txt value={o.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="container case-body">
          <RichText value={study.body} />
          {study.credits.length > 0 && (
            <aside className="credits" aria-labelledby="credits-heading">
              <h2 id="credits-heading" className="credits__heading">
                {t.work.credits}
              </h2>
              <dl>
                {study.credits.map((c) => (
                  <div key={`${c.role.text}-${c.name.text}`}>
                    <dt>
                      <Txt value={c.role} />
                    </dt>
                    <dd>
                      <Txt value={c.name} />
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          )}
        </div>

        {study.video && (
          <section className="section section--night" aria-labelledby="reel-heading">
            <div className="container">
              <h2 id="reel-heading" className="display-3 section-title">
                <Txt value={study.video.title} />
              </h2>
              <VideoFigure video={study.video} lang={lang} headingId="reel-heading" />
            </div>
          </section>
        )}
      </article>

      <nav className="container next-case" aria-label={t.work.nextCaseStudy}>
        <Link className="text-link link-arrow" href={href({ name: "work" }, lang)}>
          {t.work.backToWork}
        </Link>
        {next && next.slug !== slug && (
          <Link className="next-case__link" href={href({ name: "caseStudy", slug: next.slug }, lang)}>
            <span className="eyebrow">{t.work.nextCaseStudy}</span>
            <span className="next-case__title">
              <Txt value={next.title} />
              <ArrowRight />
            </span>
          </Link>
        )}
      </nav>

      <CallToAction lang={lang} />
    </PageShell>
  );
}
