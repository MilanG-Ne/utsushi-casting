import type { Locale } from "../i18n/config";

/* Temporary navigation data until the CMS layer lands in the next milestone. */
export type NavService = { slug: string; title: string; summary: string };

const NAV_SERVICES: Record<Locale, NavService[]> = {
  en: [
    { slug: "film-and-television", title: "Film & Television", summary: "Series and features, from leads to day players." },
    { slug: "commercials", title: "Commercials & Brand", summary: "Campaign casting for screen, print and social." },
    { slug: "voice-and-localization", title: "Voice & Localization", summary: "Dubbing, games and bilingual voice talent." },
  ],
  ja: [
    { slug: "film-and-television", title: "映画・ドラマ", summary: "主演からエキストラまで。" },
    { slug: "commercials", title: "広告・ブランド", summary: "映像・グラフィック・SNS広告のキャスティング。" },
    { slug: "voice-and-localization", title: "吹替・ローカライズ", summary: "吹替、ゲーム、バイリンガルの声優。" },
  ],
};

export async function getNavServices(lang: Locale): Promise<NavService[]> {
  return NAV_SERVICES[lang];
}

export type SiteSettings = {
  name: string;
  description: string;
  email: string;
  studios: { city: string; area: string }[];
};

const SETTINGS: Record<Locale, SiteSettings> = {
  en: {
    name: "Utsushi Casting",
    description: "A bilingual casting studio for film, television, commercials and voice, working across English and Japanese.",
    email: "hello@utsushi-casting.example",
    studios: [
      { city: "Tokyo", area: "Nakameguro, Meguro City" },
      { city: "London", area: "Hackney, East London" },
    ],
  },
  ja: {
    name: "ウツシ・キャスティング",
    description: "映画・ドラマ・広告・吹替のキャスティングを、日本語と英語の両方で手がけるバイリンガル・キャスティングスタジオ。",
    email: "hello@utsushi-casting.example",
    studios: [
      { city: "東京", area: "目黒区中目黒" },
      { city: "ロンドン", area: "イースト・ロンドン、ハックニー" },
    ],
  },
};

export async function getSiteSettings(lang: Locale): Promise<SiteSettings> {
  return SETTINGS[lang];
}
