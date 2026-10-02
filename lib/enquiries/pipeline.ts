import type { CrmClient, CrmResult } from "./crm";
import { fallbackEmail, type EmailTransport } from "./email";
import type { EnquiryQueue, OutboxRecord } from "./queue";
import type { EnquiryPayload } from "./schema";

/**
 * Delivery guarantees
 * -------------------
 * 1. The enquiry is written to the outbox *before* the CRM is called (write-ahead), already
 *    scheduled for its first retry and claimed by the request, so a concurrent drain can
 *    never pick up an enquiry that is still being submitted.
 * 2. The CRM gets up to two quick attempts during the request.
 * 3. If the CRM is down, the team is emailed straight away and the outbox retries with
 *    exponential backoff (1 min → 24 h). Retries reuse the same Idempotency-Key.
 * 4. After the last retry (or a permanent CRM rejection) a "manual entry" email is sent and
 *    the record is dead-lettered. If that email cannot be sent, the record stays pending and
 *    the next drain tries again, so a dead letter is never parked silently.
 * 5. The visitor only sees success when the enquiry is safe in at least one durable place:
 *    the CRM, the durable outbox, or a sent email. Otherwise they get a 503 with the
 *    studio's email address, so nothing is ever silently dropped.
 */
export const RETRY_DELAYS_MS = [1, 5, 15, 60, 180, 360, 720, 1440].map((min) => min * 60_000);
export const IN_REQUEST_ATTEMPTS = 2;
const CLAIM_TTL_MS = 60_000;
const NOTIFY_RETRY_MS = 60 * 60_000;

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
/**
 * Error class only: some client libraries embed the failed command (including the whole
 * enquiry) in their error messages, so messages are never logged.
 */
export const errorCode = (error: unknown) => (error instanceof Error ? error.name : "UnknownError");

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

/** Sends the "manual entry" email; true only if it actually left through a durable transport. */
async function notifyDeadLetter(deps: Deps, record: OutboxRecord, detail: string, log: NonNullable<Deps["log"]>): Promise<boolean> {
  try {
    await deps.email.send(fallbackEmail(record.payload, "dead-letter", detail));
    return deps.email.durable;
  } catch (error) {
    log("dead_letter_email_failed", { id: record.payload.id, error: errorCode(error) });
    return false;
  }
}

export async function submitEnquiry(payload: EnquiryPayload, deps: Deps): Promise<SubmitResult> {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? defaultLog;
  const sleep = deps.sleep ?? defaultSleep;
  const id = payload.id;
  const queue = deps.queue;

  const record: OutboxRecord = {
    payload,
    status: "pending",
    attempts: 0,
    nextAttemptAt: now() + RETRY_DELAYS_MS[0]!,
    lastError: null,
    emailFallbackSent: false,
    createdAt: now(),
  };

  let stored = false;
  if (queue) {
    try {
      await queue.put(record);
      stored = true;
      await queue.claim(id, CLAIM_TTL_MS);
    } catch (error) {
      log("outbox_write_failed", { id, queue: queue.name, error: errorCode(error) });
    }
  }

  try {
    const { result, attempts } = await attemptDelivery(deps.crm, payload, 1, IN_REQUEST_ATTEMPTS, sleep);
    record.attempts = attempts;

    if (result.ok) {
      log("delivered", { id, attempts, crmStatus: result.status });
      if (stored) await queue!.remove(id).catch((error) => log("outbox_cleanup_failed", { id, error: errorCode(error) }));
      return { status: "delivered", id };
    }

    record.lastError = result.error;
    log("crm_failed", { id, attempts, error: result.error, retryable: result.retryable });

    let emailed = false;
    if (result.retryable) {
      try {
        await deps.email.send(fallbackEmail(payload, "crm-unavailable", result.error));
        emailed = deps.email.durable;
      } catch (error) {
        log("email_fallback_failed", { id, transport: deps.email.name, error: errorCode(error) });
      }
    } else {
      emailed = await notifyDeadLetter(deps, record, `CRM rejected the payload: ${result.error}`, log);
    }
    record.emailFallbackSent = emailed;

    if (stored) {
      try {
        if (!result.retryable && emailed) {
          await queue!.deadLetter(record);
        } else {
          // Retryable failure, or a rejection nobody has been told about yet: keep it pending.
          record.nextAttemptAt = now() + (result.retryable ? RETRY_DELAYS_MS[0]! : NOTIFY_RETRY_MS);
          await queue!.update(record);
        }
      } catch (error) {
        log("outbox_update_failed", { id, error: errorCode(error) });
      }
    }

    const durableQueue = stored && queue!.durable;
    if (durableQueue || emailed) {
      log("queued", { id, durableQueue, emailed });
      return { status: "queued", id, durableQueue, emailed };
    }
    log("not_stored", { id });
    return { status: "failed", id };
  } finally {
    if (stored) await queue!.release(id).catch(() => undefined);
  }
}

export type DrainSummary = { processed: number; delivered: number; rescheduled: number; deadLettered: number; skipped: number };

/** Retries due outbox records. Safe to run concurrently: per-record claims plus a re-read. */
export async function drainQueue(deps: Deps, limit = 20): Promise<DrainSummary> {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? defaultLog;
  const summary: DrainSummary = { processed: 0, delivered: 0, rescheduled: 0, deadLettered: 0, skipped: 0 };
  const queue = deps.queue;
  if (!queue) return summary;

  for (const candidate of await queue.due(now(), limit)) {
    const id = candidate.payload.id;
    if (!(await queue.claim(id, CLAIM_TTL_MS))) {
      summary.skipped++;
      continue;
    }
    try {
      // The candidate list is a snapshot: another drain may have handled this record since.
      const record = await queue.get(id);
      if (!record || record.status !== "pending" || record.nextAttemptAt > now()) {
        summary.skipped++;
        continue;
      }
      summary.processed++;

      const result = await deps.crm.deliver(record.payload, record.attempts + 1);
      record.attempts++;

      if (result.ok) {
        await queue.remove(id);
        summary.delivered++;
        log("retry_delivered", { id, attempts: record.attempts });
        continue;
      }

      record.lastError = result.error;
      // Scheduled retries used so far; never below 1, even for a record orphaned before its
      // in-request attempts were recorded.
      const retriesUsed = Math.max(1, record.attempts - IN_REQUEST_ATTEMPTS);
      const delay = RETRY_DELAYS_MS[retriesUsed];

      if (result.retryable && delay !== undefined) {
        record.nextAttemptAt = now() + delay;
        await queue.update(record);
        summary.rescheduled++;
        log("retry_rescheduled", { id, attempts: record.attempts, inMs: delay, error: result.error });
        continue;
      }

      const notified = await notifyDeadLetter(deps, record, `${record.attempts} attempts; last error: ${result.error}`, log);
      if (notified) {
        await queue.deadLetter(record);
        summary.deadLettered++;
        log("dead_lettered", { id, attempts: record.attempts, error: result.error });
      } else {
        record.nextAttemptAt = now() + NOTIFY_RETRY_MS;
        await queue.update(record);
        summary.rescheduled++;
        log("dead_letter_pending_notification", { id, attempts: record.attempts });
      }
    } finally {
      await queue.release(id).catch(() => undefined);
    }
  }
  return summary;
}
