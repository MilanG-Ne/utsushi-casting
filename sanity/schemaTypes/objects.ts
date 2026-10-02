import { defineField, defineType } from "sanity";

export const localizedImage = defineType({
  name: "localizedImage",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alternative text",
      description: "Describe the image for screen reader users. Leave empty only for purely decorative images.",
      type: "localeString",
    }),
  ],
});

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      description: "Shown in search results and browser tabs. The site name is appended automatically.",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Meta description",
      description: "About 120 characters in English, 70–90 characters in Japanese.",
      type: "localeText",
      validation: (rule) => rule.required(),
    }),
  ],
});

export const video = defineType({
  name: "video",
  title: "Video",
  type: "object",
  description: "Shown behind a click-to-play poster. Videos never autoplay.",
  fields: [
    defineField({ name: "title", type: "localeString", validation: (rule) => rule.required() }),
    defineField({
      name: "description",
      title: "Description",
      description: "Shown under the player and used as the VideoObject description. Also serves as the text alternative.",
      type: "localeText",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      title: "Video file URL",
      description: "MP4 (H.264). Absolute URL or a path on this site, e.g. /media/video/clip.mp4.",
      type: "url",
      validation: (rule) => rule.required().uri({ allowRelative: true, scheme: ["https"] }),
    }),
    defineField({ name: "poster", type: "localizedImage", validation: (rule) => rule.required() }),
    defineField({
      name: "durationSeconds",
      title: "Duration (seconds)",
      type: "number",
      validation: (rule) => rule.required().positive().integer(),
    }),
    defineField({ name: "uploadDate", type: "date", validation: (rule) => rule.required() }),
    defineField({ name: "hasAudio", title: "Has an audio track", type: "boolean", initialValue: false }),
  ],
});

export const stat = defineType({
  name: "stat",
  title: "Figure",
  type: "object",
  fields: [
    defineField({ name: "value", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "label", type: "localeString", validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: "value.en", subtitle: "label.en" } },
});

export const step = defineType({
  name: "step",
  title: "Step",
  type: "object",
  fields: [
    defineField({ name: "title", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "body", type: "localeText", validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: "title.en", subtitle: "body.en" } },
});

export const faqItem = defineType({
  name: "faqItem",
  title: "Question",
  type: "object",
  fields: [
    defineField({ name: "question", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "answer", type: "localeText", validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: "question.en" } },
});

export const credit = defineType({
  name: "credit",
  title: "Credit",
  type: "object",
  fields: [
    defineField({ name: "role", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "name", type: "localeString", validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: "name.en", subtitle: "role.en" } },
});

export const studio = defineType({
  name: "studioLocation",
  title: "Studio",
  type: "object",
  fields: [
    defineField({ name: "city", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "area", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "addressLocality", title: "Locality (schema.org)", type: "string" }),
    defineField({
      name: "addressCountry",
      title: "Country code (ISO 3166-1)",
      type: "string",
      validation: (rule) => rule.length(2).uppercase(),
    }),
  ],
  preview: { select: { title: "city.en", subtitle: "area.en" } },
});
