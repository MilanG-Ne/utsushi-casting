import { defineField, defineType } from "sanity";

/**
 * Field-level localization. Every translatable field is an object with one sub-field
 * per language, so a single document holds both languages and shares slugs, references,
 * images and dates. English is required; a missing Japanese value is a warning so
 * editors can publish English first and translate later (the site falls back to English
 * and marks that text lang="en").
 */
export const LANGUAGES = [
  { id: "en", title: "English" },
  { id: "ja", title: "日本語" },
] as const;

type Kind = "string" | "text";

const MISSING_JA = "Japanese translation missing";

function languageFields(kind: Kind) {
  return LANGUAGES.map((language) => {
    const isEnglish = language.id === "en";
    if (kind === "text") {
      return defineField({
        name: language.id,
        title: language.title,
        type: "text",
        rows: 4,
        validation: (rule) =>
          isEnglish ? rule.required().error("English is required") : rule.custom((value) => (value ? true : MISSING_JA)).warning(),
      });
    }
    return defineField({
      name: language.id,
      title: language.title,
      type: "string",
      validation: (rule) =>
        isEnglish ? rule.required().error("English is required") : rule.custom((value) => (value ? true : MISSING_JA)).warning(),
    });
  });
}

export const localeString = defineType({
  name: "localeString",
  title: "Localized string",
  type: "object",
  options: { columns: 2 },
  fields: languageFields("string"),
});

export const localeText = defineType({
  name: "localeText",
  title: "Localized text",
  type: "object",
  fields: languageFields("text"),
});

export const blockContent = defineType({
  name: "blockContent",
  title: "Rich text",
  type: "array",
  of: [
    {
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [defineField({ name: "href", type: "url", validation: (rule) => rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }) })],
          },
        ],
      },
    },
  ],
});

export const localePortableText = defineType({
  name: "localePortableText",
  title: "Localized rich text",
  type: "object",
  fields: LANGUAGES.map((language) =>
    defineField({
      name: language.id,
      title: language.title,
      type: "blockContent",
      options: { collapsible: true, collapsed: language.id !== "en" },
      validation: (rule) =>
        language.id === "en"
          ? rule.required().error("English is required")
          : rule.custom((value) => (Array.isArray(value) && value.length > 0 ? true : MISSING_JA)).warning(),
    }),
  ),
});
