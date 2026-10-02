export const LOCALES = ["en", "ja"] as const;

export type Locale = (typeof LOCALES)[number];

/** English is served from the site root; every other locale gets a path prefix. */
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_META: Record<
  Locale,
  { label: string; englishLabel: string; ogLocale: string; prefix: string }
> = {
  en: { label: "English", englishLabel: "English", ogLocale: "en_GB", prefix: "" },
  ja: { label: "日本語", englishLabel: "Japanese", ogLocale: "ja_JP", prefix: "/ja" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function otherLocales(lang: Locale): Locale[] {
  return LOCALES.filter((l) => l !== lang);
}
