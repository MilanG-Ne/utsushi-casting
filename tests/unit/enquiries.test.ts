import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { payloadJsonSchema } from "@/scripts/generate-payload-schema";
import { createHttpCrmClient, type CrmClient, type CrmResult } from "@/lib/enquiries/crm";
import type { EmailMessage, EmailTransport } from "@/lib/enquiries/email";
import { drainQueue, RETRY_DELAYS_MS, submitEnquiry, type Deps } from "@/lib/enquiries/pipeline";
import { createMemoryQueue, type EnquiryQueue } from "@/lib/enquiries/queue";
import { buildPayload, enquiryInputSchema, enquiryPayloadSchema, uuidv7Hex } from "@/lib/enquiries/schema";
import { sign, verify } from "@/lib/enquiries/signature";

const input = enquiryInputSchema.parse({
  name: "Aiko Tanaka",
  email: "aiko@example.com",
  service: "voice-and-localization",
  message: "We need an English dub cast for a 90-minute animated feature.",
  consent: true,
  locale: "ja",
  sourcePage: "/ja/contact",
  preferredLanguage: "ja",
});

const T0 = Date.UTC(2026, 9, 2, 9, 0, 0);

function fixture(crmResults: CrmResult[], options: { durableQueue?: boolean; emailFails?: boolean; queue?: EnquiryQueue | null } = {}) {
  const calls: { id: string; attempt: number }[] = [];
  const crm: CrmClient = {
    async deliver(payload, attempt) {
      calls.push({ id: payload.id, attempt });
      return crmResults.shift() ?? { ok: true, crmId: "crm_1", status: 201 };
    },
  };
  const sent: EmailMessage[] = [];
  const email: EmailTransport = {
    name: "fake",
    durable: true,
    async send(message) {
      if (options.emailFails) throw new Error("smtp down");
      sent.push(message);
    },
  };
  const memory = createMemoryQueue();
  const queue = options.queue === undefined ? Object.assign(memory, { durable: options.durableQueue ?? true }) : options.queue;
  let now = T0;
  const deps: Deps = { crm, email, queue, now: () => now, sleep: async () => {}, log: () => {} };
  return { deps, calls, sent, memory, advance: (ms: number) => (now += ms), setNow: (ms: number) => (now = ms) };
}

const down: CrmResult = { ok: false, retryable: true, status: 503, error: "CRM responded 503" };
const payload = () => buildPayload(input, { site: "https://example.test", now: new Date(T0) });

describe("enquiry payload", () => {
  it("builds a payload that matches the published schema", () => {
    const p = payload();
    expect(enquiryPayloadSchema.parse(p)).toEqual(p);
    expect(p.contact.preferredLanguage).toBe("ja");
    expect(p.source).toEqual({ site: "https://example.test", page: "/ja/contact", channel: "web-form" });
  });

  it("uses time-ordered UUIDv7 identifiers", () => {
    const a = uuidv7Hex(1_700_000_000_000);
    const b = uuidv7Hex(1_700_000_000_001);
    expect(a).toMatch(/^[0-9a-f]{12}7[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
    expect(a < b).toBe(true);
  });

  it("rejects incomplete input with the failing field names", () => {
    const result = enquiryInputSchema.safeParse({ name: "", email: "nope", service: "x", message: "short", consent: false });
    expect(result.success).toBe(false);
    const fields = result.error!.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["name", "email", "service", "message", "consent"]));
  });

  it("keeps docs/enquiry-payload.schema.json in sync with the code (run pnpm schema:enquiry)", () => {
    const committed = JSON.parse(readFileSync("docs/enquiry-payload.schema.json", "utf8"));
    expect(committed).toEqual(JSON.parse(JSON.stringify(payloadJsonSchema())));
  });
});

describe("request signatures", () => {
  it("verifies its own signatures and rejects tampering or stale timestamps", () => {
    const body = JSON.stringify({ hello: "world" });
    const header = sign(body, "secret", 1_000);
    expect(verify(body, header, "secret", 1_010)).toBe(true);
    expect(verify(body + " ", header, "secret", 1_010)).toBe(false);
    expect(verify(body, header, "other", 1_010)).toBe(false);
    expect(verify(body, header, "secret", 1_000 + 301)).toBe(false);
    expect(verify(body, null, "secret")).toBe(false);
  });
});

describe("submitEnquiry", () => {
  it("delivers to the CRM and leaves nothing in the outbox", async () => {
    const { deps, memory, sent } = fixture([]);
    const result = await submitEnquiry(payload(), deps);
    expect(result.status).toBe("delivered");
    expect(memory.records.size).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it("queues and emails the team when the CRM is down, without losing the enquiry", async () => {
    const { deps, memory, sent, calls } = fixture([down, down]);
    const p = payload();
    const result = await submitEnquiry(p, deps);
    expect(result).toMatchObject({ status: "queued", durableQueue: true, emailed: true });
    expect(calls).toEqual([
      { id: p.id, attempt: 1 },
      { id: p.id, attempt: 2 },
    ]);
    const record = memory.records.get(p.id)!;
    expect(record).toMatchObject({ status: "pending", attempts: 2, emailFallbackSent: true });
    expect(record.nextAttemptAt).toBe(T0 + RETRY_DELAYS_MS[0]!);
    expect(sent[0]!.subject).toContain("Aiko Tanaka");
    expect(sent[0]!.replyTo).toBe("aiko@example.com");
  });

  it("still succeeds through email alone when there is no durable outbox", async () => {
    const { deps } = fixture([down, down], { queue: null });
    expect((await submitEnquiry(payload(), deps)).status).toBe("queued");
  });

  it("reports failure (503 upstream) only when neither the outbox nor email is durable", async () => {
    const { deps } = fixture([down, down], { queue: null, emailFails: true });
    expect((await submitEnquiry(payload(), deps)).status).toBe("failed");
  });

  it("dead-letters payloads the CRM rejects as invalid instead of retrying them", async () => {
    const { deps, memory, calls, sent } = fixture([{ ok: false, retryable: false, status: 422, error: "CRM responded 422" }]);
    const p = payload();
    await submitEnquiry(p, deps);
    expect(calls).toHaveLength(1);
    expect(memory.records.get(p.id)?.status).toBe("dead");
    expect(sent[0]!.subject).toContain("manual entry needed");
  });
});

describe("drainQueue", () => {
  it("retries due records with the same idempotency key and removes them on success", async () => {
    const { deps, memory, calls, advance } = fixture([down, down]);
    const p = payload();
    await submitEnquiry(p, deps);

    expect(await drainQueue(deps)).toMatchObject({ processed: 0 }); // not due yet
    advance(RETRY_DELAYS_MS[0]!);
    expect(await drainQueue(deps)).toMatchObject({ processed: 1, delivered: 1 });
    expect(memory.records.size).toBe(0);
    expect(calls.map((c) => c.id)).toEqual([p.id, p.id, p.id]);
    expect(calls.at(-1)!.attempt).toBe(3);
  });

  it("backs off exponentially and dead-letters after the final retry", async () => {
    const { deps, memory, sent, setNow } = fixture(Array.from({ length: 20 }, () => down));
    const p = payload();
    await submitEnquiry(p, deps);
    sent.length = 0;

    const delays: number[] = [];
    for (let i = 0; i < 20 && memory.records.get(p.id)!.status === "pending"; i++) {
      const before = memory.records.get(p.id)!;
      setNow(before.nextAttemptAt);
      await drainQueue(deps);
      const after = memory.records.get(p.id)!;
      if (after.status === "pending") delays.push(after.nextAttemptAt - before.nextAttemptAt);
    }

    expect(delays).toEqual(RETRY_DELAYS_MS.slice(1));
    const record = memory.records.get(p.id)!;
    expect(record.status).toBe("dead");
    expect(record.attempts).toBe(2 + RETRY_DELAYS_MS.length);
    expect(sent.some((m) => m.subject.includes("manual entry needed"))).toBe(true);
  });

  it("skips records another drain has already claimed", async () => {
    const { deps, advance, memory } = fixture([down, down]);
    const p = payload();
    await submitEnquiry(p, deps);
    advance(RETRY_DELAYS_MS[0]!);
    await memory.claim(p.id, 60_000);
    expect(await drainQueue(deps)).toMatchObject({ processed: 0, skipped: 1 });
  });
});

describe("HTTP CRM client", () => {
  const p = payload();
  const client = (status: number | "timeout") =>
    createHttpCrmClient({
      endpoint: "https://crm.example.test/enquiries",
      signingSecret: "s3cret",
      fetchImpl: vi.fn(async () => {
        if (status === "timeout") throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
        return new Response(JSON.stringify({ crmId: "crm_9" }), { status });
      }) as unknown as typeof fetch,
    });

  it("treats 2xx and 409 as delivered", async () => {
    expect(await client(201).deliver(p, 1)).toMatchObject({ ok: true, crmId: "crm_9" });
    expect(await client(409).deliver(p, 1)).toMatchObject({ ok: true });
  });

  it("classifies retryable and permanent failures", async () => {
    expect(await client(503).deliver(p, 1)).toMatchObject({ ok: false, retryable: true });
    expect(await client(429).deliver(p, 1)).toMatchObject({ ok: false, retryable: true });
    expect(await client(400).deliver(p, 1)).toMatchObject({ ok: false, retryable: false });
    expect(await client("timeout").deliver(p, 1)).toMatchObject({ ok: false, retryable: true });
  });

  it("sends the idempotency key, attempt number and a verifiable signature", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 201 }));
    await createHttpCrmClient({ endpoint: "https://crm.example.test", signingSecret: "s3cret", fetchImpl: fetchImpl as unknown as typeof fetch }).deliver(p, 3);
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["idempotency-key"]).toBe(p.id);
    expect(headers["x-delivery-attempt"]).toBe("3");
    expect(verify(String(init.body), headers["x-utsushi-signature"]!, "s3cret")).toBe(true);
  });
});

describe("review regressions", () => {
  it("a drain running during a submission cannot touch the in-flight enquiry", async () => {
    let releaseCrm!: (r: CrmResult) => void;
    const first = new Promise<CrmResult>((resolve) => (releaseCrm = resolve));
    const { deps, memory, setNow, calls } = fixture([]);
    deps.crm = {
      async deliver(payload, attempt) {
        calls.push({ id: payload.id, attempt });
        return calls.length === 1 ? first : down;
      },
    };
    const p = payload();
    const submission = submitEnquiry(p, deps);
    await new Promise((r) => setTimeout(r, 0));
    setNow(T0 + RETRY_DELAYS_MS[0]! + 1); // even once it would be due, the claim protects it
    expect(await drainQueue(deps)).toMatchObject({ processed: 0, deadLettered: 0 });
    releaseCrm(down);
    expect((await submission).status).toBe("queued");
    expect(memory.records.get(p.id)?.status).toBe("pending");
  });

  it("an orphaned record (attempts never recorded) is retried, not dead-lettered", async () => {
    const { deps, memory } = fixture([down]);
    const p = payload();
    await memory.put({ payload: p, status: "pending", attempts: 0, nextAttemptAt: T0, lastError: null, emailFallbackSent: false, createdAt: T0 });
    expect(await drainQueue(deps)).toMatchObject({ rescheduled: 1, deadLettered: 0 });
    expect(memory.records.get(p.id)).toMatchObject({ status: "pending", attempts: 1 });
  });

  it("keeps a dead letter pending until the manual-entry email actually goes out", async () => {
    const { deps, memory } = fixture([{ ok: false, retryable: false, status: 422, error: "CRM responded 422" }], { emailFails: true });
    const p = payload();
    const result = await submitEnquiry(p, deps);
    expect(result.status).toBe("queued"); // held in the durable outbox
    expect(memory.records.get(p.id)?.status).toBe("pending");
  });

  it("skips a record that another drain already handled after the snapshot was taken", async () => {
    const { deps, memory, calls } = fixture([]);
    const p = payload();
    const record = { payload: p, status: "pending" as const, attempts: 2, nextAttemptAt: T0, lastError: null, emailFallbackSent: false, createdAt: T0 };
    await memory.put(record);
    const stale = { ...memory, due: async () => [record], get: async () => null };
    expect(await drainQueue({ ...deps, queue: stale })).toMatchObject({ processed: 0, skipped: 1 });
    expect(calls).toHaveLength(0);
  });

  it("treats a redirecting CRM endpoint as a permanent failure instead of a delivery", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 302, headers: { location: "https://crm.example.test/login" } }));
    const result = await createHttpCrmClient({ endpoint: "http://crm.example.test", fetchImpl: fetchImpl as unknown as typeof fetch }).deliver(payload(), 1);
    expect(result).toMatchObject({ ok: false, retryable: false });
  });

  it("caps request bodies even without a Content-Length header", async () => {
    const { readBodyLimited } = await import("@/lib/enquiries/body");
    const stream = new ReadableStream({
      start(controller) {
        for (let i = 0; i < 10; i++) controller.enqueue(new TextEncoder().encode("x".repeat(1024)));
        controller.close();
      },
    });
    const req = new Request("http://localhost/api", { method: "POST", body: stream, duplex: "half" } as RequestInit);
    expect(await readBodyLimited(req, 4096)).toBeNull();
    expect(await readBodyLimited(new Request("http://localhost/api", { method: "POST", body: "ok" }), 4096)).toBe("ok");
  });

  it("rejects source pages that could redirect off-site", () => {
    for (const bad of ["//evil.example", "/\\evil.example", "https://evil.example"]) {
      expect(enquiryInputSchema.safeParse({ ...input, sourcePage: bad }).success, bad).toBe(false);
    }
  });
});
