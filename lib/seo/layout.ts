import type { Metadata, Viewport } from "next";
import type { Locale } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";
import { SITE_NAME, SITE_URL } from "../site";

/** Locale-wide defaults; pages override title, description, canonical and alternates. */
export function layoutMetadata(lang: Locale): Metadata {
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.defaultTitle, template: t.meta.titleTemplate },
    description: t.meta.defaultDescription,
    applicationName: SITE_NAME[lang],
    formatDetection: { telephone: false, email: false, address: false },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
  };
}

export const layoutViewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2eb" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};
