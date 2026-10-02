import { z } from "zod";

/**
 * Shape of the content bundle as returned by the GROQ query (and produced by the fixture
 * source). Parsed at build time, so a schema change in the CMS that the site does not
 * understand fails the build with a readable message instead of rendering broken pages.
 */
const localeString = z.object({ en: z.string().min(1), ja: z.string().nullish() });
const portableTextBlock = z.looseObject({ _type: z.string(), _key: z.string() });
const localeBlocks = z.object({ en: z.array(portableTextBlock), ja: z.array(portableTextBlock).nullish() });

export const imageSchema = z.object({
  url: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  lqip: z.string().nullish(),
  alt: localeString.nullish(),
});

export const videoSchema = z.object({
  title: localeString,
  description: localeString,
  url: z.string().min(1),
  poster: imageSchema,
  durationSeconds: z.number().positive(),
  uploadDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  hasAudio: z.boolean().nullish(),
});

const stat = z.object({ value: localeString, label: localeString });
const step = z.object({ title: localeString, body: localeString });
const faq = z.object({ question: localeString, answer: localeString });
const credit = z.object({ role: localeString, name: localeString });
const seo = z.object({ title: localeString, description: localeString });

const serviceRef = z.object({ slug: z.string().min(1), title: localeString, shortSummary: localeString });

export const serviceSchema = serviceRef.extend({
  summary: localeString,
  heroImage: imageSchema,
  body: localeBlocks,
  deliverables: z.array(localeString).nullish(),
  process: z.array(step).nullish(),
  faq: z.array(faq).nullish(),
  order: z.number().nullish(),
  seo,
});

export const caseStudySchema = z.object({
  slug: z.string().min(1),
  title: localeString,
  client: localeString,
  year: z.number().int(),
  format: localeString,
  locations: localeString.nullish(),
  rolesCast: z.number().nullish(),
  summary: localeString,
  heroImage: imageSchema,
  video: videoSchema.nullish(),
  body: localeBlocks,
  outcomes: z.array(stat).nullish(),
  credits: z.array(credit).nullish(),
  services: z.array(serviceRef).nullish(),
  order: z.number().nullish(),
  seo,
});

export const pageSchema = z.object({
  key: z.enum(["home", "work", "contact"]),
  title: localeString,
  eyebrow: localeString.nullish(),
  heading: localeString,
  intro: localeString,
  body: localeBlocks.nullish(),
  stats: z.array(stat).nullish(),
  featuredCaseStudies: z.array(z.string()).nullish(),
  showreel: videoSchema.nullish(),
  process: z.array(step).nullish(),
  seo,
});

export const settingsSchema = z.object({
  name: localeString,
  tagline: localeString,
  description: localeString,
  email: z.email(),
  foundingYear: z.number().nullish(),
  studios: z.array(
    z.object({
      city: localeString,
      area: localeString,
      addressLocality: z.string().nullish(),
      addressCountry: z.string().nullish(),
    }),
  ),
});

export const contentBundleSchema = z.object({
  settings: settingsSchema,
  pages: z.array(pageSchema),
  services: z.array(serviceSchema).min(1),
  caseStudies: z.array(caseStudySchema).min(1),
});

export type LocaleField = z.infer<typeof localeString>;
export type LocaleBlocks = z.infer<typeof localeBlocks>;
export type RawImage = z.infer<typeof imageSchema>;
export type RawVideo = z.infer<typeof videoSchema>;
export type RawService = z.infer<typeof serviceSchema>;
export type RawCaseStudy = z.infer<typeof caseStudySchema>;
export type RawPage = z.infer<typeof pageSchema>;
export type RawSettings = z.infer<typeof settingsSchema>;
export type ContentBundle = z.infer<typeof contentBundleSchema>;
