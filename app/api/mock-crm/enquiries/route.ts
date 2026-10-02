import { type NextRequest, NextResponse } from "next/server";
import { readBodyLimited } from "@/lib/enquiries/body";
import { enquiryPayloadSchema } from "@/lib/enquiries/schema";
import { SIGNATURE_HEADER, verify } from "@/lib/enquiries/signature";

export const runtime = "nodejs";

/**
 * Stand-in for a real CRM so the whole pipeline can be exercised end to end.
 * - Verifies the HMAC signature when CRM_SIGNING_SECRET is set
 * - Validates the body against the published payload schema (422 on mismatch)
 * - Deduplicates on the signed payload id (per instance): repeats return 200 with
 *   duplicate: true; an Idempotency-Key header that disagrees with the id is rejected
 * - Simulates outages: MOCK_CRM_MODE=down returns 503; MOCK_CRM_FAILURE_RATE=0.3 fails 30%
 * It stores nothing beyond the idempotency keys of the current instance.
 */
const seen = new Map<string, string>();

export async function POST(req: NextRequest) {
  const mode = process.env.MOCK_CRM_MODE ?? "up";
  const failureRate = Number(process.env.MOCK_CRM_FAILURE_RATE ?? 0);
  if (mode === "down" || (failureRate > 0 && Math.random() < failureRate)) {
    return NextResponse.json({ error: "Service unavailable (simulated)" }, { status: 503, headers: { "retry-after": "60" } });
  }

  const body = await readBodyLimited(req, 64 * 1024);
  if (body === null) return NextResponse.json({ error: "Body too large" }, { status: 413 });
  const secret = process.env.CRM_SIGNING_SECRET;
  if (secret && !verify(body, req.headers.get(SIGNATURE_HEADER), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Body is not JSON" }, { status: 400 });
  }
  const parsed = enquiryPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload does not match schema", issues: parsed.error.issues.slice(0, 10) }, { status: 422 });
  }

  const key = parsed.data.id;
  const header = req.headers.get("idempotency-key");
  if (header && header !== key) return NextResponse.json({ error: "Idempotency-Key does not match payload id" }, { status: 400 });
  const existing = seen.get(key);
  if (existing) return NextResponse.json({ crmId: existing, duplicate: true }, { status: 200 });

  const crmId = `crm_${parsed.data.id.slice(-12)}`;
  seen.set(key, crmId);
  if (seen.size > 1000) seen.delete(seen.keys().next().value!);
  return NextResponse.json({ crmId, duplicate: false, receivedAt: new Date().toISOString() }, { status: 201 });
}
