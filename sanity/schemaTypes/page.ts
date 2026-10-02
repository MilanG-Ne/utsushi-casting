import { defineField, defineType } from "sanity";
import { translationSubtitle } from "./translationStatus";

export const PAGE_KEYS = [
  { title: "Home", value: "home" },
  { title: "Work index", value: "work" },
  { title: "Contact", value: "contact" },
] as const;

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "home", title: "Home only" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "key",
      title: "Page",
      description: "Which fixed page this document controls. Routes are defined in code.",
      type: "string",
      options: { list: [...PAGE_KEYS], layout: "radio" },
      readOnly: ({ document }) => Boolean(document?._createdAt),
      validation: (rule) => rule.required(),
      group: "content",
    }),
    defineField({ name: "title", title: "Navigation title", type: "localeString", validation: (rule) => rule.required(), group: "content" }),
    defineField({ name: "eyebrow", type: "localeString", group: "content" }),
    defineField({ name: "heading", type: "localeString", validation: (rule) => rule.required(), group: "content" }),
    defineField({ name: "intro", type: "localeText", validation: (rule) => rule.required(), group: "content" }),
    defineField({ name: "body", type: "localePortableText", group: "content" }),
    defineField({
      name: "stats",
      title: "Figures",
      type: "array",
      of: [{ type: "stat" }],
      hidden: ({ document }) => document?.key !== "home",
      group: "home",
    }),
    defineField({
      name: "featuredCaseStudies",
      type: "array",
      of: [{ type: "reference", to: [{ type: "caseStudy" }] }],
      validation: (rule) => rule.unique().max(4),
      hidden: ({ document }) => document?.key !== "home",
      group: "home",
    }),
    defineField({ name: "showreel", type: "video", hidden: ({ document }) => document?.key !== "home", group: "home" }),
    defineField({
      name: "process",
      title: "How we cast",
      type: "array",
      of: [{ type: "step" }],
      hidden: ({ document }) => document?.key !== "home",
      group: "home",
    }),
    defineField({ name: "seo", type: "seo", validation: (rule) => rule.required(), group: "seo" }),
  ],
  preview: {
    select: { key: "key", title: "title.en", jaTitle: "title.ja", jaHeading: "heading.ja", jaIntro: "intro.ja" },
    prepare: ({ key, title, jaTitle, jaHeading, jaIntro }) => ({
      title: title ?? key,
      subtitle: translationSubtitle({ title: jaTitle, heading: jaHeading, intro: jaIntro }),
    }),
  },
});
