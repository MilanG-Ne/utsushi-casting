import { join } from "node:path";
import { Redis } from "@upstash/redis";
import { createHttpCrmClient } from "./crm";
import { createLogTransport, createResendTransport, type EmailTransport } from "./email";
import type { Deps } from "./pipeline";
import { createFileQueue, createRedisQueue, type EnquiryQueue } from "./queue";

/**
 * Wires the pipeline from environment variables. Every external service is optional:
 *
 *   CRM_ENDPOINT                  default: this site's mock CRM (/api/mock-crm/enquiries)
 *   CRM_SIGNING_SECRET            HMAC secret shared with the CRM (also checked by the mock)
 *   CRM_API_KEY                   optional bearer token for a real CRM
 *   UPSTASH_REDIS_REST_URL/TOKEN  durable outbox (or KV_REST_API_URL/TOKEN from the Vercel
 *                                 Upstash integration); without it: a JSON file when running
 *                                 on your own machine, and no outbox on Vercel (email
 *                                 becomes the safety net)
 *   RESEND_API_KEY                email fallback; without it emails are only logged (dev)
 *   ENQUIRY_EMAIL_TO / _FROM      recipients and sender for fallback emails
 */
let queueSingleton: EnquiryQueue | null | undefined;

export function getQueue(): EnquiryQueue | null {
  if (queueSingleton !== undefined) return queueSingleton;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) {
    queueSingleton = createRedisQueue(new Redis({ url, token }));
  } else if (!process.env.VERCEL || process.env.ENQUIRY_QUEUE === "file") {
    queueSingleton = createFileQueue(join(process.cwd(), ".data", "enquiry-outbox.json"));
  } else {
    queueSingleton = null;
  }
  return queueSingleton;
}

export function getEmailTransport(): EmailTransport {
  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.ENQUIRY_EMAIL_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (apiKey && to.length) {
    return createResendTransport({ apiKey, to, from: process.env.ENQUIRY_EMAIL_FROM ?? "Utsushi Casting website <onboarding@resend.dev>" });
  }
  return createLogTransport();
}

export function getDeps(requestOrigin: string): Deps {
  const endpoint = process.env.CRM_ENDPOINT || `${requestOrigin}/api/mock-crm/enquiries`;
  return {
    crm: createHttpCrmClient({
      endpoint,
      signingSecret: process.env.CRM_SIGNING_SECRET,
      apiKey: process.env.CRM_API_KEY,
      timeoutMs: Number(process.env.CRM_TIMEOUT_MS ?? 4000),
    }),
    queue: getQueue(),
    email: getEmailTransport(),
  };
}
