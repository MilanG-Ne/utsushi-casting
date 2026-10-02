import type { EnquiryPayload } from "./schema";
import { SIGNATURE_HEADER, sign } from "./signature";

export type CrmResult =
  | { ok: true; crmId: string | null; status: number }
  | { ok: false; retryable: boolean; status: number | null; error: string };

export interface CrmClient {
  deliver(payload: EnquiryPayload, attempt: number): Promise<CrmResult>;
}

type Options = {
  endpoint: string;
  signingSecret?: string;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/**
 * POSTs the payload as JSON. 2xx and 409 (already received) count as delivered.
 * Network errors, timeouts, 408, 429 and 5xx are retryable; other 4xx (and redirects, which
 * point at a misconfigured endpoint) are permanent, so the enquiry is dead-lettered and
 * handed to the team by email.
 */
export function createHttpCrmClient({ endpoint, signingSecret, apiKey, timeoutMs = 4000, fetchImpl = fetch }: Options): CrmClient {
  return {
    async deliver(payload, attempt) {
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "idempotency-key": payload.id,
        "x-delivery-attempt": String(attempt),
        "user-agent": "utsushi-casting-website/1.0",
      };
      if (signingSecret) headers[SIGNATURE_HEADER] = sign(body, signingSecret);
      if (apiKey) headers.authorization = `Bearer ${apiKey}`;
      try {
        // Never follow redirects: a 301/302 would turn the POST into a bodiless GET whose 200
        // could be mistaken for a delivery.
        const res = await fetchImpl(endpoint, { method: "POST", headers, body, signal: AbortSignal.timeout(timeoutMs), cache: "no-store", redirect: "manual" });
        if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
          return { ok: false, retryable: false, status: res.status || null, error: "CRM endpoint redirected; check CRM_ENDPOINT" };
        }
        if (res.ok || res.status === 409) {
          const data = (await res.json().catch(() => null)) as { crmId?: string } | null;
          return { ok: true, crmId: data?.crmId ?? null, status: res.status };
        }
        const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
        return { ok: false, retryable, status: res.status, error: `CRM responded ${res.status}` };
      } catch (error) {
        const name = error instanceof Error ? error.name : "Error";
        return { ok: false, retryable: true, status: null, error: name === "TimeoutError" ? `CRM timed out after ${timeoutMs}ms` : `CRM unreachable (${name})` };
      }
    },
  };
}
