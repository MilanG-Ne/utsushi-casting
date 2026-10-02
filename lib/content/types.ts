import type { PortableTextBlock } from "@portabletext/types";
import type { Locale } from "../i18n/config";
import type { Text } from "./localize";

export type Image = {
  url: string;
  width: number;
  height: number;
  lqip?: string;
  alt: string;
  altLang?: Locale;
};

export type Video = {
  title: Text;
  description: Text;
  url: string;
  poster: Image;
  durationSeconds: number;
  uploadDate: string;
  hasAudio: boolean;
};

export type Blocks = { blocks: PortableTextBlock[]; lang?: Locale };

export type Seo = { title: string; description: string };

export type ServiceSummary = { slug: string; title: Text; shortSummary: Text };

export type Service = ServiceSummary & {
  summary: Text;
  heroImage: Image;
  body: Blocks;
  deliverables: Text[];
  process: { title: Text; body: Text }[];
  faq: { question: Text; answer: Text }[];
  seo: Seo;
};

export type CaseStudy = {
  slug: string;
  title: Text;
  client: Text;
  year: number;
  format: Text;
  locations?: Text;
  rolesCast?: number;
  summary: Text;
  heroImage: Image;
  video?: Video;
  body: Blocks;
  outcomes: { value: Text; label: Text }[];
  credits: { role: Text; name: Text }[];
  services: ServiceSummary[];
  seo: Seo;
};

export type Page = {
  key: "home" | "work" | "contact";
  title: Text;
  eyebrow?: Text;
  heading: Text;
  intro: Text;
  body?: Blocks;
  stats: { value: Text; label: Text }[];
  featuredCaseStudies: CaseStudy[];
  showreel?: Video;
  process: { title: Text; body: Text }[];
  seo: Seo;
};

export type SiteSettings = {
  name: string;
  tagline: string;
  description: string;
  email: string;
  foundingYear?: number;
  studios: { city: string; area: string; addressLocality?: string; addressCountry?: string }[];
};
