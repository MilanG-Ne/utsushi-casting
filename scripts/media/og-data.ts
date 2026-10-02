/** Prints the text and imagery for Open Graph cards as JSON (read by scripts/media/og.py). */
import { seedDocuments } from "../../content/seed/documents";
import { en } from "../../lib/i18n/dictionaries/en";
import { ja } from "../../lib/i18n/dictionaries/ja";

type L = { en: string; ja: string };
const dict = { en, ja };
const cards: { key: string; lang: "en" | "ja"; eyebrow: string; title: string; image?: string }[] = [];

for (const lang of ["en", "ja"] as const) {
  const settings = seedDocuments.find((d) => d._id === "siteSettings") as unknown as { tagline: L };
  cards.push({ key: "default", lang, eyebrow: lang === "en" ? "Casting studio · Tokyo & London" : "キャスティングスタジオ｜東京・ロンドン", title: settings.tagline[lang] });
  for (const doc of seedDocuments) {
    if (doc._type === "caseStudy") {
      const d = doc as unknown as { slug: { current: string }; title: L; format: L; year: number; heroImage: { localFile: string } };
      cards.push({ key: d.slug.current, lang, eyebrow: lang === "ja" ? `${d.format.ja}（${d.year}年）` : `${d.format.en} · ${d.year}`, title: d.title[lang], image: d.heroImage.localFile });
    }
    if (doc._type === "service") {
      const d = doc as unknown as { slug: { current: string }; title: L; heroImage: { localFile: string } };
      cards.push({ key: d.slug.current, lang, eyebrow: dict[lang].nav.services, title: d.title[lang], image: d.heroImage.localFile });
    }
  }
}

console.log(JSON.stringify(cards));
