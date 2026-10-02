import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routes";
import { ArrowRight } from "./Icons";

export function CallToAction({ lang, heading }: { lang: Locale; heading?: string }) {
  const t = getDictionary(lang);
  return (
    <section className="section" aria-labelledby="cta-heading">
      <div className="container">
        <div className="cta frame">
          <h2 id="cta-heading" className="display-3">
            {heading ?? t.home.ctaHeading}
          </h2>
          <p className="lede">{t.home.ctaBody}</p>
          <Link className="button button--primary" href={href({ name: "contact" }, lang)}>
            {t.home.ctaButton}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
