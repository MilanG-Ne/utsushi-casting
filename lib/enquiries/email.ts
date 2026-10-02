import type { EnquiryPayload } from "./schema";

export type EmailMessage = { subject: string; text: string; html: string; replyTo?: string; idempotencyKey: string };

export interface EmailTransport {
  readonly name: string;
  /** True when messages actually leave the system (used to decide whether an enquiry is safe). */
  readonly durable: boolean;
  send(message: EmailMessage): Promise<void>;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email), no SDK. */
export function createResendTransport({ apiKey, from, to, fetchImpl = fetch }: { apiKey: string; from: string; to: string[]; fetchImpl?: typeof fetch }): EmailTransport {
  return {
    name: "resend",
    durable: true,
    async send(message) {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": message.idempotencyKey },
        body: JSON.stringify({ from, to, subject: message.subject, text: message.text, html: message.html, reply_to: message.replyTo }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    },
  };
}

/**
 * Fallback when no email provider is configured: logs that an email would have been sent,
 * identified by its idempotency key only (no names or addresses). Never counts as durable.
 */
export function createLogTransport(): EmailTransport {
  return {
    name: "log",
    durable: false,
    async send(message) {
      console.info(JSON.stringify({ scope: "enquiry", event: "email_not_configured", key: message.idempotencyKey }));
    },
  };
}

const SERVICE_LABELS: Record<string, string> = {
  "film-and-television": "Film & television",
  commercials: "Commercial & brand",
  "voice-and-localization": "Voice & localization",
  other: "Other",
};

/** Internal notification sent when the CRM could not take the enquiry (or gave up on it). */
export function fallbackEmail(payload: EnquiryPayload, reason: "crm-unavailable" | "dead-letter", detail: string): EmailMessage {
  const { contact, enquiry } = payload;
  const heading = reason === "dead-letter" ? "CRM delivery abandoned — enter this enquiry manually" : "CRM unavailable — enquiry stored for retry";
  const rows: [string, string | null][] = [
    ["Reference", payload.id],
    ["Received", payload.submittedAt],
    ["Name", contact.name],
    ["Email", contact.email],
    ["Company", contact.company],
    ["Reply in", contact.preferredLanguage === "ja" ? "Japanese" : "English"],
    ["Service", SERVICE_LABELS[enquiry.service] ?? enquiry.service],
    ["Project", enquiry.projectTitle],
    ["Dates", enquiry.timeline],
    ["Budget", enquiry.budget],
    ["Page", payload.source.page],
    ["Delivery status", detail],
  ];
  const visible = rows.filter((r): r is [string, string] => Boolean(r[1]));
  const text = [heading, "", ...visible.map(([k, v]) => `${k}: ${v}`), "", "Message:", enquiry.message, "", "Payload (JSON):", JSON.stringify(payload, null, 2)].join("\n");
  const html = `<h1 style="font:600 18px sans-serif">${escapeHtml(heading)}</h1><table style="font:14px sans-serif;border-collapse:collapse">${visible
    .map(([k, v]) => `<tr><th align="left" style="padding:4px 12px 4px 0">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join("")}</table><h2 style="font:600 15px sans-serif">Message</h2><p style="font:14px sans-serif;white-space:pre-wrap">${escapeHtml(enquiry.message)}</p>`;
  return {
    subject: `[Enquiry ${payload.id.slice(-8)}] ${contact.name} — ${SERVICE_LABELS[enquiry.service] ?? enquiry.service}${reason === "dead-letter" ? " (manual entry needed)" : ""}`,
    text,
    html,
    replyTo: contact.email,
    idempotencyKey: `${payload.id}-${reason}`,
  };
}
