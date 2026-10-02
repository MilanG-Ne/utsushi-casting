import { after, type NextRequest, NextResponse } from "next/server";
import { isPlainObject, readBodyLimited } from "@/lib/enquiries/body";
import { getDeps } from "@/lib/enquiries/config";
import { drainQueue, errorCode, submitEnquiry } from "@/lib/enquiries/pipeline";
import { rateLimit } from "@/lib/enquiries/rate-limit";
import { buildPayload, enquiryInputSchema, invalidFields, uuidv7Hex } from "@/lib/enquiries/schema";
import { LOCALES } from "@/lib/i18n/config";
import { href } from "@/lib/i18n/routes";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

/** Generous enough for a 4,000-character Japanese message sent url-encoded (9 bytes per character). */
const MAX_BODY_BYTES = 64 * 1024;
/** The only pages a no-JavaScript post may be redirected back to. */
const CONTACT_PAGES = new Set(LOCALES.map((lang) => href({ name: "contact" }, lang)));

/**
 * Contact form endpoint. Accepts JSON (enhanced form) or a regular url-encoded form post
 * (no JavaScript). JSON callers get a JSON status; form posts are redirected back to the
 * contact page with a fragment (#enquiry-sent, #enquiry-invalid, #enquiry-error) that CSS
 * reveals.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const origin = req.nextUrl.origin;
  const fallbackPage = contactPageFrom(req.headers.get("referer"));

  const sourceOrigin = req.headers.get("origin");
  if (sourceOrigin && sourceOrigin !== origin && sourceOrigin !== SITE_URL) {
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }

  const body = await readBodyLimited(req, MAX_BODY_BYTES);
  if (body === null) return respond(isJson, origin, fallbackPage, 413, { status: "too-large" }, "enquiry-error");

  let raw: unknown;
  try {
    raw = isJson ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body));
  } catch {
    raw = null;
  }
  if (!isPlainObject(raw)) return respond(isJson, origin, fallbackPage, 400, { status: "invalid", fields: ["form"] }, "enquiry-invalid");
  if (!isJson) normalizeFormFields(raw);

  // Only known contact pages are accepted as the source, so redirects can never leave the site.
  const sourcePage = typeof raw.sourcePage === "string" && CONTACT_PAGES.has(raw.sourcePage) ? raw.sourcePage : fallbackPage;
  raw.sourcePage = sourcePage;

  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip, Number(process.env.ENQUIRY_RATE_LIMIT ?? 5))) {
    return respond(isJson, origin, sourcePage, 429, { status: "rate-limited" }, "enquiry-error");
  }

  const parsed = enquiryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return respond(isJson, origin, sourcePage, 422, { status: "invalid", fields: invalidFields(parsed.error) }, "enquiry-invalid");
  }

  // Honeypot filled in: answer exactly like a success so bots learn nothing, but store nothing.
  if (parsed.data.website) {
    return respond(isJson, origin, sourcePage, 200, { status: "delivered", id: `enq_${uuidv7Hex()}` }, "enquiry-sent");
  }

  const deps = getDeps(origin);
  const payload = buildPayload(parsed.data, { site: SITE_URL, now: new Date() });
  const result = await submitEnquiry(payload, deps);

  // Opportunistically retry older queued enquiries after the response is sent.
  after(() => drainQueue(deps, 5).catch((error) => console.error(JSON.stringify({ scope: "enquiry", event: "background_drain_failed", error: errorCode(error) }))));

  if (result.status === "failed") {
    return respond(isJson, origin, sourcePage, 503, { status: "failed", id: result.id }, "enquiry-error");
  }
  return respond(isJson, origin, sourcePage, result.status === "delivered" ? 200 : 202, { status: result.status, id: result.id }, "enquiry-sent");
}

function normalizeFormFields(obj: Record<string, unknown>) {
  obj.consent = obj.consent === "on" || obj.consent === "true";
  if (obj.budget === "") obj.budget = null;
}

function contactPageFrom(referer: string | null): string {
  try {
    const path = referer ? new URL(referer).pathname : "";
    if (CONTACT_PAGES.has(path)) return path;
  } catch {
    /* malformed referer */
  }
  return href({ name: "contact" }, "en");
}

function respond(isJson: boolean, origin: string, page: string, status: number, body: Record<string, unknown>, fragment: string) {
  if (isJson) return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  return NextResponse.redirect(new URL(`${page}#${fragment}`, origin), 303);
}
