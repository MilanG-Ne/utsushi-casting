import Link from "next/link";
import { CallToAction } from "@/components/CallToAction";
import { CaseStudyCard } from "@/components/CaseStudyCard";
import { ArrowRight } from "@/components/Icons";
import { PageShell } from "@/components/PageShell";
import { ServiceCard } from "@/components/ServiceCard";
import { Txt } from "@/components/Txt";
import { VideoFigure } from "@/components/VideoFigure";
import { getPage, getServices } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routes";
import { buildMetadata } from "@/lib/seo/metadata";

const ROUTE = { name: "home" } as const;

/** Role names in both languages for the decorative marquee under the hero. */
const ROLES = [
  ["Lead", "主演"],
  ["Supporting", "助演"],
  ["Voice", "声優"],
  ["Narrator", "ナレーター"],
  ["Day player", "端役"],
  ["Bilingual", "バイリンガル"],
  ["Real people", "一般キャスト"],
  ["Ensemble", "アンサンブル"],
] as const;

export async function homeMetadata(lang: Locale) {
  const page = await getPage("home", lang);
  return buildMetadata({ lang, route: ROUTE, title: page.seo.title, description: page.seo.description, absoluteTitle: true });
}

export async function HomePage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const [page, workPage, services] = await Promise.all([getPage("home", lang), getPage("work", lang), getServices(lang)]);

  return (
    <PageShell lang={lang} route={ROUTE}>
      <section className="hero" aria-labelledby="hero-heading">
        <div className="container hero__inner">
          {page.eyebrow && <Txt as="p" className="eyebrow" value={page.eyebrow} />}
          <h1 id="hero-heading" className="display-1 hero__heading">
            <Txt value={page.heading} />
          </h1>
          <Txt as="p" className="lede hero__lede" value={page.intro} />
          <div className="hero__actions">
            <Link className="button button--primary" href={href({ name: "contact" }, lang)}>
              {t.home.ctaButton}
              <ArrowRight />
            </Link>
            <Link className="button" href={href({ name: "work" }, lang)}>
              {t.home.featuredWork}
            </Link>
          </div>
        </div>
        <div className="marquee" aria-hidden="true">
          <div className="marquee__track" data-marquee>
            {[0, 1].map((copy) => (
              <ul key={copy} className="marquee__list">
                {ROLES.map(([en, ja]) => (
                  <li key={en}>
                    <span lang="en">{en}</span>
                    <span lang="ja">{ja}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {page.stats.length > 0 && (
        <section className="container stats-section" aria-label={t.home.statsLabel}>
          <dl className="stats">
            {page.stats.map((s) => (
              <div key={s.label.text} className="stat" data-reveal>
                <dt>
                  <Txt value={s.label} />
                </dt>
                <dd>
                  <Txt value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {page.showreel && (
        <section className="section section--night" aria-labelledby="showreel-heading">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">{t.home.showreel}</p>
                <h2 id="showreel-heading" className="display-3">
                  <Txt value={page.showreel.title} />
                </h2>
              </div>
            </div>
            <VideoFigure video={page.showreel} lang={lang} headingId="showreel-heading" />
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="work-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">{t.home.featuredWork}</p>
              <h2 id="work-heading" className="display-3">
                <Txt value={workPage.heading} />
              </h2>
            </div>
            <Link className="text-link link-arrow" href={href({ name: "work" }, lang)}>
              {t.home.allWork}
              <ArrowRight />
            </Link>
          </div>
          <div className="work-grid">
            {page.featuredCaseStudies.map((study) => (
              <CaseStudyCard key={study.slug} study={study} lang={lang} ctaLabel={t.work.viewCaseStudy} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="services-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">{t.home.services}</p>
              <h2 id="services-heading" className="display-3">
                {t.nav.services}
              </h2>
            </div>
          </div>
          <div className="service-grid">
            {services.map((service, i) => (
              <ServiceCard key={service.slug} service={service} lang={lang} index={i} />
            ))}
          </div>
        </div>
      </section>

      {page.process.length > 0 && (
        <section className="section" aria-labelledby="process-heading">
          <div className="container process">
            <div className="section-head">
              <div>
                <p className="eyebrow">{t.home.process}</p>
                <h2 id="process-heading" className="display-3">
                  {t.home.process}
                </h2>
              </div>
            </div>
            <ol className="steps steps--large">
              {page.process.map((step, i) => (
                <li key={step.title.text} className="step" data-reveal>
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

      <CallToAction lang={lang} />
    </PageShell>
  );
}
