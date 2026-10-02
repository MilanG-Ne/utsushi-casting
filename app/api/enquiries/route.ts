import { after, type NextRequest, NextResponse } from "next/server";
import { getDeps } from "@/lib/enquiries/config";
import { drainQueue, submitEnquiry } from "@/lib/enquiries/pipeline";
import { rateLimit } from "@/lib/enquiries/rate-limit";
import { buildPayload, enquiryInputSchema, invalidFields } from "@/lib/enquiries/schema";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Contact form endpoint. Accepts JSON (enhanced form) or a regular form post (no JS).
 * JSON callers get a JSON status; form posts are redirected back to the contact page
 * with a fragment (#enquiry-sent, #enquiry-invalid, #enquiry-error) that CSS reveals.
 */
export async function POST(req: NextRequest) {
  const isJson = (req.headers.get("content-type") ?? "").includes("application/json");
  const origin = req.nextUrl.origin;

  const sourceOrigin = req.headers.get("origin");
  if (sourceOrigin && sourceOrigin !== origin && sourceOrigin !== SITE_URL) {
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ status: "too-large" }, { status: 413 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = isJson ? await req.json() : formToObject(await req.formData());
  } catch {
    return respond(isJson, origin, "/contact", 400, { status: "invalid", fields: ["form"] }, "enquiry-invalid");
  }

  const sourcePage = typeof raw.sourcePage === "string" && raw.sourcePage.startsWith("/") ? raw.sourcePage : "/contact";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return respond(isJson, origin, sourcePage, 429, { status: "rate-limited" }, "enquiry-error");
  }

  const parsed = enquiryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return respond(isJson, origin, sourcePage, 422, { status: "invalid", fields: invalidFields(parsed.error) }, "enquiry-invalid");
  }

  // Honeypot filled in: answer like a success so bots learn nothing, but store nothing.
  if (parsed.data.website) {
    return respond(isJson, origin, sourcePage, 200, { status: "delivered", id: "enq_ignored" }, "enquiry-sent");
  }

  const deps = getDeps(origin);
  const payload = buildPayload(parsed.data, { site: SITE_URL, now: new Date() });
  const result = await submitEnquiry(payload, deps);

  // Opportunistically retry older queued enquiries after the response is sent.
  after(() => drainQueue(deps, 5).catch((error) => console.error("[enquiry] background drain failed", error)));

  if (result.status === "failed") {
    return respond(isJson, origin, sourcePage, 503, { status: "failed", id: result.id }, "enquiry-error");
  }
  return respond(isJson, origin, sourcePage, result.status === "delivered" ? 200 : 202, { status: result.status, id: result.id }, "enquiry-sent");
}

function formToObject(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) if (typeof value === "string") obj[key] = value;
  obj.consent = obj.consent === "on" || obj.consent === "true";
  if (obj.budget === "") obj.budget = null;
  return obj;
}

function respond(isJson: boolean, origin: string, sourcePage: string, status: number, body: Record<string, unknown>, fragment: string) {
  if (isJson) return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  return NextResponse.redirect(new URL(`${sourcePage}#${fragment}`, origin), 303);
}
