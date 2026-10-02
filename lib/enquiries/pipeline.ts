import type { CrmClient, CrmResult } from "./crm";
import { fallbackEmail, type EmailTransport } from "./email";
import type { EnquiryQueue, OutboxRecord } from "./queue";
import type { EnquiryPayload } from "./schema";

/**
 * Delivery guarantees
 * -------------------
 * 1. The enquiry is written to the outbox *before* the CRM is called (write-ahead).
 * 2. The CRM gets up to two quick attempts during the request.
 * 3. If the CRM is down, the team is emailed straight away and the outbox retries with
 *    exponential backoff (1 min → 24 h). Retries reuse the same Idempotency-Key.
 * 4. After the last retry the record is dead-lettered and a "manual entry" email is sent.
 * 5. The visitor only sees success when the enquiry is safe in at least one durable place:
 *    the CRM, the durable outbox, or a sent email. Otherwise they get a 503 with the
 *    studio's email address, so nothing is ever silently dropped.
 */
export const RETRY_DELAYS_MS = [1, 5, 15, 60, 180, 360, 720, 1440].map((min) => min * 60_000);
export const IN_REQUEST_ATTEMPTS = 2;
const CLAIM_TTL_MS = 60_000;

export type Deps = {
  crm: CrmClient;
  queue: EnquiryQueue | null;
  email: EmailTransport;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  log?: (event: string, data: Record<string, unknown>) => void;
};

export type SubmitResult =
  | { status: "delivered"; id: string }
  | { status: "queued"; id: string; durableQueue: boolean; emailed: boolean }
  | { status: "failed"; id: string };

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** Structured log without personal data (no names, emails or messages). */
const defaultLog = (event: string, data: Record<string, unknown>) => console.info(JSON.stringify({ scope: "enquiry", event, ...data }));

async function attemptDelivery(crm: CrmClient, payload: EnquiryPayload, firstAttempt: number, tries: number, sleep: (ms: number) => Promise<void>): Promise<{ result: CrmResult; attempts: number }> {
  let result: CrmResult = { ok: false, retryable: true, status: null, error: "not attempted" };
  let attempts = 0;
  for (let i = 0; i < tries; i++) {
    attempts++;
    result = await crm.deliver(payload, firstAttempt + i);
    if (result.ok || !result.retryable) break;
    if (i < tries - 1) await sleep(300 * 2 ** i);
  }
  return { result, attempts };
}

export async function submitEnquiry(payload: EnquiryPayload, deps: Deps): Promise<SubmitResult> {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? defaultLog;
  const sleep = deps.sleep ?? defaultSleep;
  const id = payload.id;

  const record: OutboxRecord = {
    payload,
    status: "pending",
    attempts: 0,
    nextAttemptAt: now(),
    lastError: null,
    emailFallbackSent: false,
    createdAt: now(),
  };

  let stored = false;
  if (deps.queue) {
    try {
      await deps.queue.put(record);
      stored = true;
    } catch (error) {
      log("outbox_write_failed", { id, queue: deps.queue.name, error: String(error) });
    }
  }

  const { result, attempts } = await attemptDelivery(deps.crm, payload, 1, IN_REQUEST_ATTEMPTS, sleep);
  record.attempts = attempts;

  if (result.ok) {
    log("delivered", { id, attempts, crmStatus: result.status });
    if (stored) await deps.queue!.remove(id).catch((error) => log("outbox_cleanup_failed", { id, error: String(error) }));
    return { status: "delivered", id };
  }

  record.lastError = result.error;
  log("crm_failed", { id, attempts, error: result.error, retryable: result.retryable });

  let emailed = false;
  try {
    await deps.email.send(fallbackEmail(payload, result.retryable ? "crm-unavailable" : "dead-letter", result.error));
    emailed = deps.email.durable;
    record.emailFallbackSent = emailed;
  } catch (error) {
    log("email_fallback_failed", { id, transport: deps.email.name, error: String(error) });
  }

  if (stored) {
    try {
      if (result.retryable) {
        record.nextAttemptAt = now() + RETRY_DELAYS_MS[0]!;
        await deps.queue!.update(record);
      } else {
        await deps.queue!.deadLetter(record);
      }
    } catch (error) {
      log("outbox_update_failed", { id, error: String(error) });
    }
  }

  const durableQueue = stored && deps.queue!.durable;
  if (durableQueue || emailed) {
    log("queued", { id, durableQueue, emailed });
    return { status: "queued", id, durableQueue, emailed };
  }
  log("not_stored", { id });
  return { status: "failed", id };
}

export type DrainSummary = { processed: number; delivered: number; rescheduled: number; deadLettered: number; skipped: number };

/** Retries due outbox records. Safe to run concurrently thanks to per-record claims. */
export async function drainQueue(deps: Deps, limit = 20): Promise<DrainSummary> {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? defaultLog;
  const summary: DrainSummary = { processed: 0, delivered: 0, rescheduled: 0, deadLettered: 0, skipped: 0 };
  if (!deps.queue) return summary;

  for (const record of await deps.queue.due(now(), limit)) {
    const id = record.payload.id;
    if (!(await deps.queue.claim(id, CLAIM_TTL_MS))) {
      summary.skipped++;
      continue;
    }
    summary.processed++;
    try {
      const result = await deps.crm.deliver(record.payload, record.attempts + 1);
      record.attempts++;

      if (result.ok) {
        await deps.queue.remove(id);
        summary.delivered++;
        log("retry_delivered", { id, attempts: record.attempts });
        continue;
      }

      record.lastError = result.error;
      const retryIndex = record.attempts - IN_REQUEST_ATTEMPTS; // scheduled retries used so far
      const delay = RETRY_DELAYS_MS[retryIndex];
      if (!result.retryable || delay === undefined) {
        await deps.queue.deadLetter(record);
        summary.deadLettered++;
        log("dead_lettered", { id, attempts: record.attempts, error: result.error });
        await deps.email
          .send(fallbackEmail(record.payload, "dead-letter", `${record.attempts} attempts; last error: ${result.error}`))
          .catch((error) => log("dead_letter_email_failed", { id, error: String(error) }));
        continue;
      }
      record.nextAttemptAt = now() + delay;
      await deps.queue.update(record);
      summary.rescheduled++;
      log("retry_rescheduled", { id, attempts: record.attempts, inMs: delay, error: result.error });
    } finally {
      await deps.queue.release(id).catch(() => undefined);
    }
  }
  return summary;
}
