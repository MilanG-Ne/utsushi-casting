import { defineField, defineType } from "sanity";
import { translationSubtitle } from "./translationStatus";

export const caseStudy = defineType({
  name: "caseStudy",
  title: "Case study",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "facts", title: "Facts" },
    { name: "media", title: "Media" },
    { name: "seo", title: "SEO" },
  ],
  orderings: [{ title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  fields: [
    defineField({ name: "title", type: "localeString", validation: (rule) => rule.required(), group: "content" }),
    defineField({
      name: "slug",
      description: "Shared by both languages: /work/<slug> and /ja/work/<slug>.",
      type: "slug",
      options: { source: "title.en", maxLength: 64 },
      validation: (rule) => rule.required(),
      group: "content",
    }),
    defineField({ name: "summary", type: "localeText", validation: (rule) => rule.required(), group: "content" }),
    defineField({ name: "body", type: "localePortableText", validation: (rule) => rule.required(), group: "content" }),
    defineField({ name: "client", type: "localeString", validation: (rule) => rule.required(), group: "facts" }),
    defineField({ name: "year", type: "number", validation: (rule) => rule.required().integer(), group: "facts" }),
    defineField({ name: "format", type: "localeString", validation: (rule) => rule.required(), group: "facts" }),
    defineField({ name: "locations", type: "localeString", group: "facts" }),
    defineField({ name: "rolesCast", title: "Roles cast", type: "number", validation: (rule) => rule.integer().positive(), group: "facts" }),
    defineField({ name: "outcomes", type: "array", of: [{ type: "stat" }], validation: (rule) => rule.max(4), group: "facts" }),
    defineField({ name: "credits", type: "array", of: [{ type: "credit" }], group: "facts" }),
    defineField({
      name: "services",
      type: "array",
      of: [{ type: "reference", to: [{ type: "service" }] }],
      validation: (rule) => rule.unique(),
      group: "facts",
    }),
    defineField({ name: "heroImage", type: "localizedImage", validation: (rule) => rule.required(), group: "media" }),
    defineField({ name: "video", type: "video", group: "media" }),
    defineField({ name: "order", type: "number", initialValue: 10, group: "facts" }),
    defineField({ name: "seo", type: "seo", validation: (rule) => rule.required(), group: "seo" }),
  ],
  preview: {
    select: { title: "title.en", year: "year", jaTitle: "title.ja", jaSummary: "summary.ja", media: "heroImage" },
    prepare: ({ title, year, jaTitle, jaSummary, media }) => ({
      title: year ? `${title} (${year})` : title,
      media,
      subtitle: translationSubtitle({ title: jaTitle, summary: jaSummary }),
    }),
  },
});
