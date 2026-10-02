import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PageShell } from "@/components/PageShell";
import { RichText } from "@/components/RichText";
import { JsonLd } from "@/components/JsonLd";
import { Txt } from "@/components/Txt";
import { getPage, getSiteSettings } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/routes";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageGraph } from "@/lib/seo/structured-data";

const ROUTE = { name: "contact" } as const;

export async function contactMetadata(lang: Locale) {
  const page = await getPage("contact", lang);
  return buildMetadata({ lang, route: ROUTE, title: page.seo.title, description: page.seo.description });
}

export async function ContactPage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const [page, settings] = await Promise.all([getPage("contact", lang), getSiteSettings(lang)]);
  const crumbs = [
    { label: t.nav.home, href: href({ name: "home" }, lang) },
    { label: page.title.text, href: href(ROUTE, lang), lang: page.title.lang },
  ];

  const structuredData = await pageGraph({
    lang,
    route: ROUTE,
    type: "ContactPage",
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

      <div className="container contact-layout">
        <section className="contact-form-panel" aria-labelledby="enquiry-heading">
          <h2 id="enquiry-heading" className="display-3">
            {t.contact.formHeading}
          </h2>
          {/* Shown only after a no-JavaScript form post redirects back here with a fragment. */}
          <p id="enquiry-sent" className="target-notice form-outcome form-outcome--success" tabIndex={-1}>
            {t.contact.noJsSuccess}
          </p>
          <p id="enquiry-invalid" className="target-notice form-outcome form-outcome--error" tabIndex={-1}>
            {t.contact.invalidHeading}
          </p>
          <p id="enquiry-error" className="target-notice form-outcome form-outcome--error" tabIndex={-1}>
            {t.contact.errorHeading}
            {lang === "ja" ? "" : " "}
            {t.contact.errorBody.replace("{email}", settings.email)}
          </p>
          <EnquiryForm lang={lang} labels={t.contact} email={settings.email} sourcePage={href(ROUTE, lang)} />
        </section>

        <aside className="contact-aside">
          <div className="contact-card">
            <h2 className="eyebrow">{t.contact.directEmail}</h2>
            <p>
              <a className="contact-email" href={`mailto:${settings.email}`}>
                {settings.email}
              </a>
            </p>
            <p className="muted">{t.contact.responseTime}</p>
          </div>
          <div className="contact-card">
            <h2 className="eyebrow">{t.footer.studios}</h2>
            <ul className="studio-list">
              {settings.studios.map((s) => (
                <li key={s.city}>
                  <strong>{s.city}</strong>
                  <span>{s.area}</span>
                </li>
              ))}
            </ul>
          </div>
          {page.body && <RichText value={page.body} className="prose contact-next" />}
        </aside>
      </div>
    </PageShell>
  );
}
