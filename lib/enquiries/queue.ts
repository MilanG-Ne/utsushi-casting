import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { EnquiryPayload } from "./schema";

/** Outbox record: the immutable payload plus delivery bookkeeping. */
export type OutboxRecord = {
  payload: EnquiryPayload;
  status: "pending" | "dead";
  attempts: number;
  nextAttemptAt: number;
  lastError: string | null;
  emailFallbackSent: boolean;
  createdAt: number;
};

export interface EnquiryQueue {
  readonly name: string;
  /** True when records survive restarts and are shared between serverless instances. */
  readonly durable: boolean;
  put(record: OutboxRecord): Promise<void>;
  update(record: OutboxRecord): Promise<void>;
  remove(id: string): Promise<void>;
  /** Pending records due at or before `now`, oldest first. */
  due(now: number, limit: number): Promise<OutboxRecord[]>;
  deadLetter(record: OutboxRecord): Promise<void>;
  /** Short-lived lock so concurrent drains never deliver the same record twice at once. */
  claim(id: string, ttlMs: number): Promise<boolean>;
  release(id: string): Promise<void>;
  stats(): Promise<{ pending: number; dead: number }>;
}

// ------------------------------------------------------------------ in-memory (tests)

export function createMemoryQueue(): EnquiryQueue & { records: Map<string, OutboxRecord> } {
  const records = new Map<string, OutboxRecord>();
  const locks = new Map<string, number>();
  return {
    name: "memory",
    durable: false,
    records,
    async put(r) {
      records.set(r.payload.id, structuredClone(r));
    },
    async update(r) {
      records.set(r.payload.id, structuredClone(r));
    },
    async remove(id) {
      records.delete(id);
    },
    async due(now, limit) {
      return [...records.values()]
        .filter((r) => r.status === "pending" && r.nextAttemptAt <= now)
        .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt)
        .slice(0, limit)
        .map((r) => structuredClone(r));
    },
    async deadLetter(r) {
      records.set(r.payload.id, { ...structuredClone(r), status: "dead" });
    },
    async claim(id, ttlMs) {
      const now = Date.now();
      if ((locks.get(id) ?? 0) > now) return false;
      locks.set(id, now + ttlMs);
      return true;
    },
    async release(id) {
      locks.delete(id);
    },
    async stats() {
      const all = [...records.values()];
      return { pending: all.filter((r) => r.status === "pending").length, dead: all.filter((r) => r.status === "dead").length };
    },
  };
}

// ------------------------------------------------------------------ JSON file (local dev)

/**
 * JSON file on local disk: durable for `next dev` / self-hosted `next start` on one
 * machine. Never used on Vercel, where the filesystem is ephemeral per instance.
 */
export function createFileQueue(path: string): EnquiryQueue {
  const memory = createMemoryQueue();
  let loaded = false;
  let chain = Promise.resolve();
  const load = async () => {
    if (loaded) return;
    loaded = true;
    try {
      const data = JSON.parse(await readFile(path, "utf8")) as OutboxRecord[];
      for (const r of data) memory.records.set(r.payload.id, r);
    } catch {
      /* first run: no file yet */
    }
  };
  const persist = async () => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify([...memory.records.values()], null, 2));
  };
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = chain.then(load).then(fn);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
  return {
    name: "file",
    durable: true,
    put: (r) => serial(async () => (await memory.put(r), persist())),
    update: (r) => serial(async () => (await memory.update(r), persist())),
    remove: (id) => serial(async () => (await memory.remove(id), persist())),
    due: (now, limit) => serial(() => memory.due(now, limit)),
    deadLetter: (r) => serial(async () => (await memory.deadLetter(r), persist())),
    claim: (id, ttl) => memory.claim(id, ttl),
    release: (id) => memory.release(id),
    stats: () => serial(() => memory.stats()),
  };
}

// ------------------------------------------------------------------ Upstash Redis (production)

type RedisLike = {
  set(key: string, value: string, opts?: { nx?: boolean; px?: number }): Promise<unknown>;
  get<T = string>(key: string): Promise<T | null>;
  del(...keys: string[]): Promise<unknown>;
  zadd(key: string, member: { score: number; member: string }): Promise<unknown>;
  zrem(key: string, ...members: string[]): Promise<unknown>;
  zrange(key: string, min: number, max: number, opts: { byScore: true; offset: number; count: number }): Promise<unknown[]>;
  zcard(key: string): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<unknown>;
  llen(key: string): Promise<number>;
};

const K = {
  record: (id: string) => `enquiry:record:${id}`,
  lock: (id: string) => `enquiry:lock:${id}`,
  due: "enquiry:due",
  dead: "enquiry:dead",
};

/**
 * Durable outbox on Upstash Redis (REST, works on Vercel serverless):
 *   enquiry:record:<id>  JSON record        enquiry:due   sorted set by next attempt time
 *   enquiry:dead         list of dead IDs   enquiry:lock:<id>  SET NX PX claim
 */
export function createRedisQueue(redis: RedisLike): EnquiryQueue {
  const read = async (id: string) => {
    const raw = await redis.get<OutboxRecord | string>(K.record(id));
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as OutboxRecord) : raw;
  };
  const write = async (r: OutboxRecord) => {
    await redis.set(K.record(r.payload.id), JSON.stringify(r));
    if (r.status === "pending") await redis.zadd(K.due, { score: r.nextAttemptAt, member: r.payload.id });
  };
  return {
    name: "upstash-redis",
    durable: true,
    put: write,
    update: write,
    async remove(id) {
      await redis.zrem(K.due, id);
      await redis.del(K.record(id), K.lock(id));
    },
    async due(now, limit) {
      const ids = (await redis.zrange(K.due, 0, now, { byScore: true, offset: 0, count: limit })).map(String);
      const records = await Promise.all(ids.map(read));
      return records.filter((r): r is OutboxRecord => r !== null && r.status === "pending");
    },
    async deadLetter(r) {
      await redis.set(K.record(r.payload.id), JSON.stringify({ ...r, status: "dead" }));
      await redis.zrem(K.due, r.payload.id);
      await redis.lpush(K.dead, r.payload.id);
    },
    async claim(id, ttlMs) {
      return (await redis.set(K.lock(id), "1", { nx: true, px: ttlMs })) === "OK";
    },
    async release(id) {
      await redis.del(K.lock(id));
    },
    async stats() {
      const [pending, dead] = await Promise.all([redis.zcard(K.due), redis.llen(K.dead)]);
      return { pending, dead };
    },
  };
}
