/**
 * Builders for seed documents in Sanity's own document format. The seed script writes
 * these documents to a dataset; the fixture content source reads the same documents
 * when no Sanity project is configured.
 */

export type LocaleValue<T> = { en: T; ja?: T };

export type SeedImage = {
  _type: "localizedImage";
  /** Base name of a generated image in public/media/img (see scripts/media/generate.py). */
  localFile: string;
  alt: LocaleValue<string> & { _type: "localeString" };
};

export type SeedReference = { _type: "reference"; _ref: string; _key: string };

export type PortableTextSpan = { _type: "span"; _key: string; text: string; marks: string[] };
export type PortableTextBlock = {
  _type: "block";
  _key: string;
  style: "normal" | "h2" | "h3" | "blockquote";
  listItem?: "bullet" | "number";
  level?: number;
  markDefs: never[];
  children: PortableTextSpan[];
};

export const ls = (en: string, ja: string) => ({ _type: "localeString" as const, en, ja });
export const lt = (en: string, ja: string) => ({ _type: "localeText" as const, en, ja });
export const slug = (current: string) => ({ _type: "slug" as const, current });

export const image = (localFile: string, altEn: string, altJa: string): SeedImage => ({
  _type: "localizedImage",
  localFile,
  alt: ls(altEn, altJa),
});

export const ref = (id: string): SeedReference => ({ _type: "reference", _ref: id, _key: id.replace(/[^a-z0-9]/gi, "") });

/** Adds a stable `_key` to every array item, as Sanity requires. */
export function keyed<T extends object>(prefix: string, items: T[]): (T & { _key: string })[] {
  return items.map((item, i) => ({ _key: `${prefix}${i}`, ...item }));
}

/**
 * Minimal Markdown → Portable Text: paragraphs, `## ` / `### ` headings, `> ` quotes
 * and `- ` bullet lists. Enough for seed copy without a Markdown dependency.
 */
export function blocks(prefix: string, markdown: string): PortableTextBlock[] {
  const out: PortableTextBlock[] = [];
  const chunks = markdown
    .trim()
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);
  let n = 0;
  const block = (text: string, style: PortableTextBlock["style"], listItem?: "bullet"): PortableTextBlock => {
    const key = `${prefix}${n++}`;
    return {
      _type: "block",
      _key: key,
      style,
      ...(listItem ? { listItem, level: 1 } : {}),
      markDefs: [],
      children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
    };
  };
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim());
    if (lines.every((l) => l.startsWith("- "))) {
      for (const line of lines) out.push(block(line.slice(2), "normal", "bullet"));
    } else if (chunk.startsWith("### ")) {
      out.push(block(chunk.slice(4), "h3"));
    } else if (chunk.startsWith("## ")) {
      out.push(block(chunk.slice(3), "h2"));
    } else if (chunk.startsWith("> ")) {
      out.push(block(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), "blockquote"));
    } else {
      out.push(block(lines.join(" "), "normal"));
    }
  }
  return out;
}

export const lpt = (prefix: string, en: string, ja: string) => ({
  _type: "localePortableText" as const,
  en: blocks(`${prefix}e`, en),
  ja: blocks(`${prefix}j`, ja),
});
