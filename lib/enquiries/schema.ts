import { z } from "zod";

/**
 * Enquiry payload, version 1. This is the exact JSON body POSTed to the CRM and the
 * source of docs/enquiry-payload.schema.json (generated with `pnpm schema:enquiry`).
 * The payload is immutable once built: retries resend the same bytes with the same
 * Idempotency-Key, so the CRM can safely deduplicate.
 */
export const SERVICE_KEYS = ["film-and-television", "commercials", "voice-and-localization", "other"] as const;
export const BUDGET_KEYS = ["undisclosed", "under-10k", "10k-50k", "50k-plus"] as const;
export const LANGS = ["en", "ja"] as const;
export const PAYLOAD_SCHEMA_VERSION = "1.0";
export const CONSENT_POLICY_VERSION = "2026-10";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length ? v : null))
    .nullable();

/** What the form sends (JSON from the enhanced form, or form fields without JavaScript). */
export const enquiryInputSchema = z.object({
  name: trimmed(120).min(1, "name"),
  email: z.email("email").max(254),
  company: optionalText(160).optional().default(null),
  service: z.enum(SERVICE_KEYS, "service"),
  projectTitle: optionalText(160).optional().default(null),
  timeline: optionalText(160).optional().default(null),
  budget: z.enum(BUDGET_KEYS).nullable().optional().default(null),
  message: trimmed(4000).min(20, "message"),
  preferredLanguage: z.enum(LANGS).default("en"),
  consent: z.literal(true, "consent"),
  locale: z.enum(LANGS).default("en"),
  sourcePage: z
    .string()
    .max(200)
    .regex(/^\/[\w\-/]*$/)
    .default("/contact"),
  /** Honeypot: humans never see this field. Anything here marks the submission as spam. */
  website: z.string().max(200).optional().default(""),
});

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export const enquiryPayloadSchema = z
  .object({
    schemaVersion: z.literal(PAYLOAD_SCHEMA_VERSION).describe("Payload format version. Breaking changes bump the major version."),
    id: z
      .string()
      .regex(/^enq_[0-9a-f]{32}$/)
      .describe("Enquiry ID (UUIDv7, time-ordered). Also sent as the Idempotency-Key header."),
    submittedAt: z.iso.datetime().describe("When the visitor submitted the form (UTC, ISO 8601)."),
    locale: z.enum(LANGS).describe("Language of the page the form was submitted from."),
    source: z
      .object({
        site: z.url().describe("Origin of the website."),
        page: z.string().describe("Path of the page that hosted the form, e.g. /ja/contact."),
        channel: z.literal("web-form"),
      })
      .strict(),
    contact: z
      .object({
        name: z.string().min(1).max(120),
        email: z.email().max(254),
        company: z.string().max(160).nullable(),
        preferredLanguage: z.enum(LANGS).describe("Language the visitor wants the reply in."),
      })
      .strict(),
    enquiry: z
      .object({
        service: z.enum(SERVICE_KEYS),
        projectTitle: z.string().max(160).nullable(),
        timeline: z.string().max(160).nullable(),
        budget: z.enum(BUDGET_KEYS).nullable(),
        message: z.string().min(20).max(4000),
      })
      .strict(),
    consent: z
      .object({
        storeAndContact: z.literal(true),
        policyVersion: z.string(),
        consentedAt: z.iso.datetime(),
      })
      .strict(),
  })
  .strict()
  .describe("Utsushi Casting website enquiry");

export type EnquiryPayload = z.infer<typeof enquiryPayloadSchema>;

/** Time-ordered UUIDv7 as 32 hex characters (RFC 9562). */
export function uuidv7Hex(now = Date.now(), random: Uint8Array = crypto.getRandomValues(new Uint8Array(10))): string {
  const ts = now.toString(16).padStart(12, "0").slice(-12);
  const r = Array.from(random, (b) => b.toString(16).padStart(2, "0")).join("");
  const version = `7${r.slice(0, 3)}`;
  const variant = ((parseInt(r.slice(3, 4), 16) & 0x3) | 0x8).toString(16) + r.slice(4, 7);
  return `${ts}${version}${variant}${r.slice(7, 19)}`;
}

export function buildPayload(input: EnquiryInput, ctx: { site: string; now: Date; id?: string }): EnquiryPayload {
  const submittedAt = ctx.now.toISOString();
  return {
    schemaVersion: PAYLOAD_SCHEMA_VERSION,
    id: ctx.id ?? `enq_${uuidv7Hex(ctx.now.getTime())}`,
    submittedAt,
    locale: input.locale,
    source: { site: ctx.site, page: input.sourcePage, channel: "web-form" },
    contact: {
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      preferredLanguage: input.preferredLanguage,
    },
    enquiry: {
      service: input.service,
      projectTitle: input.projectTitle ?? null,
      timeline: input.timeline ?? null,
      budget: input.budget ?? null,
      message: input.message,
    },
    consent: { storeAndContact: true, policyVersion: CONSENT_POLICY_VERSION, consentedAt: submittedAt },
  };
}

/** Field names that failed validation, for highlighting on the form. */
export function invalidFields(error: z.ZodError): string[] {
  return [...new Set(error.issues.map((i) => String(i.path[0] ?? "form")))];
}
