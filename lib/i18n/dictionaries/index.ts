import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { ja } from "./ja";

const dictionaries: Record<Locale, Dictionary> = { en, ja };

export function getDictionary(lang: Locale): Dictionary {
  return dictionaries[lang];
}

/** Replaces {placeholders} in a dictionary string. */
export function format(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export type { Dictionary };
