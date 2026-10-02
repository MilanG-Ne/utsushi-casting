import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href, type AppRoute } from "@/lib/i18n/routes";
import { getNavServices } from "@/lib/content";
import { BrandMark, Chevron, MenuIcon } from "./Icons";
import { LanguageSwitch } from "./LanguageSwitch";

type Props = { lang: Locale; route: AppRoute | null };

function current(route: AppRoute | null, name: AppRoute["name"], slug?: string): "page" | undefined {
  if (!route || route.name !== name) return undefined;
  if (slug && "slug" in route && route.slug !== slug) return undefined;
  return "page";
}

export async function SiteHeader({ lang, route }: Props) {
  const t = getDictionary(lang);
  const services = await getNavServices(lang);
  const inServices = route?.name === "service";
  const inWork = route?.name === "work" || route?.name === "caseStudy";

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href={href({ name: "home" }, lang)}>
          <BrandMark />
          <span className="brand-name">
            {lang === "ja" ? "ウツシ" : "Utsushi"}
            <small>Casting</small>
          </span>
          <span className="sr-only">{t.nav.homeSuffix}</span>
        </Link>

        <nav className="nav-desktop" aria-label={t.a11y.primaryNav}>
          <ul className="nav-list">
            <li>
              <Link
                className="nav-link"
                href={href({ name: "work" }, lang)}
                aria-current={current(route, "work")}
                data-current={inWork || undefined}
              >
                {t.nav.work}
              </Link>
            </li>
            <li>
              <button className="nav-link nav-trigger" type="button" popoverTarget="services-panel" data-current={inServices || undefined}>
                {t.nav.services}
                <Chevron />
              </button>
              <div id="services-panel" className="nav-panel" popover="auto">
                <div className="container">
                  <ul className="nav-panel-list">
                    {services.map((s) => (
                      <li key={s.slug}>
                        <Link
                          className="nav-panel-link"
                          href={href({ name: "service", slug: s.slug }, lang)}
                          aria-current={current(route, "service", s.slug)}
                        >
                          <strong>{s.title}</strong>
                          <span>{s.summary}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
            <li>
              <Link className="nav-link" href={href({ name: "contact" }, lang)} aria-current={current(route, "contact")}>
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </nav>

        <LanguageSwitch lang={lang} route={route} />

        <button className="menu-button" type="button" popoverTarget="mobile-menu">
          <MenuIcon />
          {t.nav.menu}
        </button>
        <div id="mobile-menu" className="nav-panel mobile-menu" popover="auto">
          <nav className="container" aria-label={t.a11y.primaryNav}>
            <ul className="mobile-menu-list">
              <li>
                <a href={href({ name: "home" }, lang)} aria-current={current(route, "home")}>
                  {t.nav.home}
                </a>
              </li>
              <li>
                <a href={href({ name: "work" }, lang)} aria-current={current(route, "work")}>
                  {t.nav.work}
                </a>
              </li>
              <li>
                <span className="eyebrow">{t.nav.services}</span>
                <ul className="mobile-menu-sub">
                  {services.map((s) => (
                    <li key={s.slug}>
                      <a href={href({ name: "service", slug: s.slug }, lang)} aria-current={current(route, "service", s.slug)}>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <a href={href({ name: "contact" }, lang)} aria-current={current(route, "contact")}>
                  {t.nav.contact}
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
