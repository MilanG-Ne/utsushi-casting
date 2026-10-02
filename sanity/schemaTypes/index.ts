import { caseStudy } from "./caseStudy";
import { blockContent, localePortableText, localeString, localeText } from "./locale";
import { credit, faqItem, localizedImage, seo, stat, step, studio, video } from "./objects";
import { page } from "./page";
import { service } from "./service";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [
  // Localized primitives
  localeString,
  localeText,
  blockContent,
  localePortableText,
  // Shared objects
  localizedImage,
  seo,
  video,
  stat,
  step,
  faqItem,
  credit,
  studio,
  // Documents
  siteSettings,
  page,
  caseStudy,
  service,
];

/** Singletons: one document each, with fixed IDs that the site and the seed script use. */
export const SINGLETON_TYPES = new Set(["siteSettings"]);
