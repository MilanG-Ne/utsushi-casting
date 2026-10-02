import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CallToAction } from "@/components/CallToAction";
import { CaseStudyCard } from "@/components/CaseStudyCard";
import { ArrowRight } from "@/components/Icons";
import { PageShell } from "@/components/PageShell";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { RichText } from "@/components/RichText";
import { Txt } from "@/components/Txt";
import { getCaseStudiesForService, getNavServices, getService, getServiceSlugs } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routes";
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
  const t = getDictionary(lang);
  const [service, related, all] = await Promise.all([getService(slug, lang), getCaseStudiesForService(slug, lang), getNavServices(lang)]);
  if (!service) notFound();

  const route = { name: "service", slug } as const;
  const others = all.filter((s) => s.slug !== slug);
  const crumbs = [
    { label: t.nav.home, href: href({ name: "home" }, lang) },
    { label: service.title.text, href: href(route, lang), lang: service.title.lang },
  ];

  return (
    <PageShell lang={lang} route={route}>
      <article>
        <header className="container page-intro service-intro">
          <Breadcrumbs items={crumbs} label={t.a11y.breadcrumb} />
          <p className="eyebrow">{t.nav.services}</p>
          <h1 className="display-2">
            <Txt value={service.title} />
          </h1>
          <Txt as="p" className="lede" value={service.summary} />
        </header>

        <div className="container">
          <div className="service-hero frame">
            <ResponsiveImage image={service.heroImage} sizes="(min-width: 76rem) 72rem, 100vw" priority />
          </div>
        </div>

        <div className="container service-body">
          <RichText value={service.body} />
          {service.deliverables.length > 0 && (
            <aside className="deliverables" aria-labelledby="deliverables-heading">
              <h2 id="deliverables-heading" className="deliverables__heading">
                {t.service.deliverables}
              </h2>
              <ul>
                {service.deliverables.map((d) => (
                  <Txt as="li" key={d.text} value={d} />
                ))}
              </ul>
            </aside>
          )}
        </div>

        {service.process.length > 0 && (
          <section className="section" aria-labelledby="process-heading">
            <div className="container">
              <h2 id="process-heading" className="display-3 section-title">
                {t.service.process}
              </h2>
              <ol className="steps">
                {service.process.map((step, i) => (
                  <li key={step.title.text} className="step">
                    <span className="step__number" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Txt as="h3" className="step__title" value={step.title} />
                    <Txt as="p" value={step.body} />
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {service.faq.length > 0 && (
          <section className="section" aria-labelledby="faq-heading">
            <div className="container faq-layout">
              <h2 id="faq-heading" className="display-3 section-title">
                {t.service.faq}
              </h2>
              <div className="faq">
                {service.faq.map((item) => (
                  <details key={item.question.text} className="faq__item">
                    <summary>
                      <Txt value={item.question} />
                    </summary>
                    <Txt as="p" value={item.answer} />
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>

      {related.length > 0 && (
        <section className="section" aria-labelledby="related-heading">
          <div className="container">
            <h2 id="related-heading" className="display-3 section-title">
              {t.service.relatedWork}
            </h2>
            <div className="work-grid">
              {related.map((study) => (
                <CaseStudyCard key={study.slug} study={study} lang={lang} ctaLabel={t.work.viewCaseStudy} />
              ))}
            </div>
          </div>
        </section>
      )}

      <nav className="container other-services" aria-labelledby="other-services-heading">
        <h2 id="other-services-heading" className="eyebrow">
          {t.service.otherServices}
        </h2>
        <ul>
          {others.map((s) => (
            <li key={s.slug}>
              <Link href={href({ name: "service", slug: s.slug }, lang)}>
                <Txt value={s.title} />
                <ArrowRight />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <CallToAction lang={lang} />
    </PageShell>
  );
}
