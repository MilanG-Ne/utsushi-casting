import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href, type AppRoute } from "@/lib/i18n/routes";
import { getNavServices, getSiteSettings } from "@/lib/content";
import { BrandMark } from "./Icons";
import { LanguageSwitch } from "./LanguageSwitch";
import { Txt } from "./Txt";

export async function SiteFooter({ lang, route }: { lang: Locale; route: AppRoute | null }) {
  const t = getDictionary(lang);
  const [services, settings] = await Promise.all([getNavServices(lang), getSiteSettings(lang)]);
  const year = 2026;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <BrandMark />
            <p>{settings.description}</p>
          </div>
          <div>
            <h2>{t.footer.studios}</h2>
            <ul className="footer-list">
              {settings.studios.map((s) => (
                <li key={s.city}>
                  <strong>{s.city}</strong>
                  <br />
                  {s.area}
                </li>
              ))}
            </ul>
          </div>
          <nav aria-label={t.a11y.footerNav}>
            <h2>{t.footer.explore}</h2>
            <ul className="footer-list">
              <li>
                <Link href={href({ name: "work" }, lang)}>{t.nav.work}</Link>
              </li>
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={href({ name: "service", slug: s.slug }, lang)}>
                    <Txt value={s.title} />
                  </Link>
                </li>
              ))}
              <li>
                <Link href={href({ name: "contact" }, lang)}>{t.nav.contact}</Link>
              </li>
            </ul>
          </nav>
          <div>
            <h2>{t.footer.getInTouch}</h2>
            <ul className="footer-list">
              <li>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
              <li>
                <LanguageSwitch lang={lang} route={route} className="footer-lang" />
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{t.meta.fictionNotice}</p>
          <p>
            © {year} {t.footer.portfolio}
          </p>
        </div>
      </div>
    </footer>
  );
}
