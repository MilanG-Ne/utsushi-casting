import Link from "next/link";
import type { CaseStudy } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/i18n/routes";
import { ArrowRight } from "./Icons";
import { ResponsiveImage } from "./ResponsiveImage";
import { Txt } from "./Txt";

type Props = {
  study: CaseStudy;
  lang: Locale;
  ctaLabel: string;
  headingLevel?: 2 | 3;
  sizes?: string;
  /** Set on the first card when it is likely to be the largest element above the fold. */
  priority?: boolean;
};

/** Whole-card link: one tab stop, the heading is the link's accessible name. */
export function CaseStudyCard({ study, lang, ctaLabel, headingLevel = 3, sizes = "(min-width: 60rem) 36rem, 100vw", priority = false }: Props) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const url = href({ name: "caseStudy", slug: study.slug }, lang);
  return (
    <article className="work-card" data-reveal>
      <Link href={url} className="work-card__link">
        <ResponsiveImage image={study.heroImage} sizes={sizes} className="work-card__media" priority={priority} />
        <div className="work-card__body">
          <p className="work-card__meta">
            <Txt value={study.format} />
            {lang === "ja" ? `（${study.year}年）` : ` · ${study.year}`}
          </p>
          <Heading className="work-card__title">
            <Txt value={study.title} />
          </Heading>
          <Txt as="p" className="work-card__summary" value={study.summary} />
          <span className="work-card__cta">
            {ctaLabel}
            <ArrowRight />
          </span>
        </div>
      </Link>
    </article>
  );
}
