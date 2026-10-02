import { defineField, defineType } from "sanity";
import { translationSubtitle } from "./translationStatus";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "details", title: "Details" },
    { name: "seo", title: "SEO" },
  ],
  orderings: [{ title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  fields: [
    defineField({ name: "title", type: "localeString", validation: (rule) => rule.required(), group: "content" }),
    defineField({
      name: "slug",
      description: "Shared by both languages: /services/<slug> and /ja/services/<slug>.",
      type: "slug",
      options: { source: "title.en", maxLength: 64 },
      validation: (rule) => rule.required(),
      group: "content",
    }),
    defineField({
      name: "shortSummary",
      title: "Short summary",
      description: "One line for navigation menus.",
      type: "localeString",
      validation: (rule) => rule.required(),
      group: "content",
    }),
    defineField({ name: "summary", type: "localeText", validation: (rule) => rule.required(), group: "content" }),
    defineField({ name: "heroImage", type: "localizedImage", validation: (rule) => rule.required(), group: "content" }),
    defineField({ name: "body", type: "localePortableText", validation: (rule) => rule.required(), group: "content" }),
    defineField({ name: "deliverables", type: "array", of: [{ type: "localeString" }], group: "details" }),
    defineField({ name: "process", type: "array", of: [{ type: "step" }], group: "details" }),
    defineField({ name: "faq", title: "Questions", type: "array", of: [{ type: "faqItem" }], group: "details" }),
    defineField({ name: "order", type: "number", initialValue: 10, group: "details" }),
    defineField({ name: "seo", type: "seo", validation: (rule) => rule.required(), group: "seo" }),
  ],
  preview: {
    select: { title: "title.en", jaTitle: "title.ja", jaSummary: "summary.ja", media: "heroImage" },
    prepare: ({ title, jaTitle, jaSummary, media }) => ({
      title,
      media,
      subtitle: translationSubtitle({ title: jaTitle, summary: jaSummary }),
    }),
  },
});
