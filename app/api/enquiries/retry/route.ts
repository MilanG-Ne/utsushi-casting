import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getDeps } from "@/lib/enquiries/config";
import { drainQueue } from "@/lib/enquiries/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Drains due outbox records. Called by Vercel Cron (GET, daily on the Hobby plan) and
 * optionally by the scheduled GitHub workflow (POST). Both send `Authorization: Bearer
 * $CRON_SECRET`; Vercel adds that header automatically when CRON_SECRET is set.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }
  const deps = getDeps(req.nextUrl.origin);
  const summary = await drainQueue(deps, 50);
  const stats = deps.queue ? await deps.queue.stats() : null;
  return NextResponse.json({ status: "ok", queue: deps.queue?.name ?? "none", ...summary, remaining: stats });
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const GET = handle;
export const POST = handle;
