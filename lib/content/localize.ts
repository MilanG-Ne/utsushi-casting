import type { Locale } from "../i18n/config";

type Localized<T> = { en: T; ja?: T | null } | null | undefined;

function present<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** The language a field will actually render in: the requested one, or English as fallback. */
export function resolvedLang<T>(field: Localized<T>, lang: Locale): Locale {
  return field && present(field[lang]) ? lang : "en";
}

/** Picks the requested language, falling back to English when the translation is missing. */
export function localize<T>(field: { en: T; ja?: T | null }, lang: Locale): T;
export function localize<T>(field: Localized<T>, lang: Locale): T | undefined;
export function localize<T>(field: Localized<T>, lang: Locale): T | undefined {
  if (!field) return undefined;
  const value = field[lang];
  return present(value) ? value : field.en;
}

/**
 * A localized string plus the language it ended up in. Components put `lang` on the
 * element only when it differs from the page language (a fallback), so screen readers
 * switch pronunciation correctly.
 */
export type Text = { text: string; lang?: Locale };

export function text(field: { en: string; ja?: string | null }, lang: Locale): Text {
  const actual = resolvedLang(field, lang);
  return actual === lang ? { text: localize(field, lang) } : { text: field.en, lang: actual };
}
