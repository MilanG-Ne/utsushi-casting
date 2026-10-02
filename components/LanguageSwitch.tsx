import { otherLocales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href, type AppRoute } from "@/lib/i18n/routes";
import { Globe } from "./Icons";

/**
 * Links to the same page in the other language. Rendered on the server from the page's
 * route, so it needs no client JavaScript and always matches the hreflang tags.
 * A plain <a> is intentional: each locale has its own root layout (<html lang>).
 */
export function LanguageSwitch({ lang, route, className = "lang-switch" }: { lang: Locale; route: AppRoute | null; className?: string }) {
  const target = otherLocales(lang)[0];
  if (!target) return null;
  const t = getDictionary(lang);
  return (
    <a className={className} href={href(route ?? { name: "home" }, target)} hrefLang={target} lang={target} data-testid="language-switch">
      <Globe />
      <span>{t.language.switchTo}</span>
    </a>
  );
}
