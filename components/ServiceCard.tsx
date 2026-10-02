import Link from "next/link";
import type { Service } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/i18n/routes";
import { ArrowRight } from "./Icons";
import { Txt } from "./Txt";

export function ServiceCard({ service, lang, index }: { service: Service; lang: Locale; index: number }) {
  return (
    <article className="service-card" data-reveal>
      <Link href={href({ name: "service", slug: service.slug }, lang)} className="service-card__link">
        <span className="service-card__index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="service-card__title">
          <Txt value={service.title} />
        </h3>
        <Txt as="p" className="service-card__summary" value={service.summary} />
        <ArrowRight />
      </Link>
    </article>
  );
}
