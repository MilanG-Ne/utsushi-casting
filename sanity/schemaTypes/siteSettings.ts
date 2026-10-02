import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Studio name", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "tagline", type: "localeString", validation: (rule) => rule.required() }),
    defineField({
      name: "description",
      description: "Used in the footer and as the Organization description in structured data.",
      type: "localeText",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "email", title: "Enquiries email", type: "email", validation: (rule) => rule.required() }),
    defineField({ name: "foundingYear", type: "number", validation: (rule) => rule.integer().min(1900).max(2100) }),
    defineField({ name: "studios", type: "array", of: [{ type: "studioLocation" }], validation: (rule) => rule.min(1) }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
