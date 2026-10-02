# Enquiry payload and delivery

The contact form posts to `POST /api/enquiries`. The route handler validates the input,
builds an immutable JSON payload, writes it to an outbox, and delivers it to the CRM.
This document is the contract for whoever runs the receiving CRM endpoint.

- Machine-readable schema: [`enquiry-payload.schema.json`](enquiry-payload.schema.json)
  (JSON Schema 2020-12, generated from the zod schema in `lib/enquiries/schema.ts` with
  `pnpm schema:enquiry`; a unit test fails if the two drift apart)
- Reference receiver: `app/api/mock-crm/enquiries/route.ts`

## Request to the CRM

```http
POST {CRM_ENDPOINT}
Content-Type: application/json
Idempotency-Key: enq_0199a3b2c4d57e6f8a9b0c1d2e3f4a5b
X-Delivery-Attempt: 1
X-Utsushi-Signature: t=1791278400,v1=5d41402abc4b2a76b9719d911017c592...
Authorization: Bearer {CRM_API_KEY}          (only when CRM_API_KEY is set)
```

### Example body

```json
{
  "schemaVersion": "1.0",
  "id": "enq_0199a3b2c4d57e6f8a9b0c1d2e3f4a5b",
  "submittedAt": "2026-10-02T09:15:00.000Z",
  "locale": "ja",
  "source": {
    "site": "https://utsushi-casting.vercel.app",
    "page": "/ja/contact",
    "channel": "web-form"
  },
  "contact": {
    "name": "田中 愛子",
    "email": "aiko@example.com",
    "company": "Studio Example",
    "preferredLanguage": "ja"
  },
  "enquiry": {
    "service": "voice-and-localization",
    "projectTitle": "Untitled animated feature",
    "timeline": "March 2027, two weeks",
    "budget": "10k-50k",
    "message": "We need an English dub cast for a 90-minute animated feature."
  },
  "consent": {
    "storeAndContact": true,
    "policyVersion": "2026-10",
    "consentedAt": "2026-10-02T09:15:00.000Z"
  }
}
```

### Fields

| Field | Type | Notes |
| --- | --- | --- |
| `schemaVersion` | `"1.0"` | Bumped on breaking changes. Additive fields keep `1.x`. |
| `id` | string | `enq_` + 32 hex characters (UUIDv7, time-ordered). Identical to `Idempotency-Key`. |
| `submittedAt` | ISO 8601, UTC | When the visitor pressed send. |
| `locale` | `"en"` \| `"ja"` | Language of the page the form was on. |
| `source.site` / `source.page` | string | Origin of the site and the form's path, e.g. `/ja/contact`. |
| `source.channel` | `"web-form"` | Reserved for future channels. |
| `contact.name` | string, 1–120 | Trimmed. |
| `contact.email` | string | Validated email address, max 254. |
| `contact.company` | string \| null | Optional. |
| `contact.preferredLanguage` | `"en"` \| `"ja"` | Language the visitor wants the reply in. Defaults to the page language. |
| `enquiry.service` | enum | `film-and-television`, `commercials`, `voice-and-localization`, `other`. |
| `enquiry.projectTitle` | string \| null | Optional, max 160. |
| `enquiry.timeline` | string \| null | Free text such as "March 2027, two weeks". |
| `enquiry.budget` | enum \| null | `undisclosed`, `under-10k`, `10k-50k`, `50k-plus` (GBP bands, shown with JPY equivalents). |
| `enquiry.message` | string, 20–4000 | Trimmed. |
| `consent.storeAndContact` | `true` | The form cannot be sent without consent. |
| `consent.policyVersion` | string | Version of the privacy wording the visitor agreed to. |
| `consent.consentedAt` | ISO 8601 | Same instant as `submittedAt`. |

Every object is closed (`additionalProperties: false`). Optional values are sent as `null`,
never omitted, so receivers can rely on every key being present.

### Signature

`X-Utsushi-Signature` is present when `CRM_SIGNING_SECRET` is set:

```text
t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw request body>")>
```

Verify against the raw body bytes, compare in constant time, and reject timestamps more than
five minutes old. See `lib/enquiries/signature.ts`.

### Expected responses

| CRM response | Site behaviour |
| --- | --- |
| `2xx` | Delivered; the outbox record is removed. Body may include `{ "crmId": "..." }`. |
| `409` | Treated as delivered (the CRM already has this `Idempotency-Key`). |
| `408`, `429`, `5xx`, timeout (4 s), network error | Retryable: kept in the outbox and retried. |
| Other `4xx`, or any `3xx` redirect | Permanent: emailed to the team for manual entry, then dead-lettered. Redirects are never followed, because a redirected POST would arrive as a bodiless GET. |

Receivers must be idempotent on `Idempotency-Key` (which always equals the signed `id`): the
same enquiry can arrive more than once, for example when a response is lost after the CRM
committed it.

## Delivery guarantees

```text
POST /api/enquiries
  ├─ origin check, 64 KB body cap (also for chunked uploads), per-instance rate limit
  ├─ validate input (zod) ────────────── 422 with field names, or 303 to #enquiry-invalid
  ├─ outbox.put(record) + claim           write-ahead, scheduled +1 min, locked for this request
  ├─ CRM attempt 1 → (300 ms) → attempt 2
  │    ├─ delivered → outbox.remove → 200 { status: "delivered", id }
  │    └─ failed    → email the team + schedule retry → 202 { status: "queued", id }
  └─ no durable outbox and no email sent → 503 { status: "failed" } (the form shows the studio email)

Retries (same payload, same Idempotency-Key):
  +1 min, +5 min, +15 min, +1 h, +3 h, +6 h, +12 h, +24 h → "manual entry" email → dead letter
  (if that email cannot be sent, the record stays pending and is retried hourly)
Concurrent drains: each record is claimed (SET NX PX) and re-read before delivery
Triggers: after() at the end of every submission, Vercel Cron (daily on Hobby),
          and the optional "Retry queued enquiries" GitHub workflow (every 15 minutes)
```

The visitor only sees a success message when the enquiry is safe in at least one durable
place: the CRM, the durable outbox (Upstash Redis, or a local JSON file when self-hosted),
or an email that was actually sent (Resend). If none of these is available, the API answers
`503` and the form shows the studio's email address instead of pretending.

Logs are structured JSON and contain only the enquiry ID, attempt counts and error classes;
names, email addresses, messages and client-library error messages (which can embed the
failed command) are never logged. No-JavaScript posts are only ever redirected to the
site's own contact pages.

## Configuration

| Variable | Purpose |
| --- | --- |
| `CRM_ENDPOINT` | Receiving endpoint. Defaults to this site's mock: `/api/mock-crm/enquiries`. |
| `CRM_SIGNING_SECRET` | HMAC secret shared with the CRM (the mock verifies it when set). |
| `CRM_API_KEY` | Optional bearer token for a real CRM. |
| `CRM_TIMEOUT_MS` | Per-attempt timeout, default `4000`. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Durable outbox. `KV_REST_API_URL` / `KV_REST_API_TOKEN` from the Vercel Upstash integration also work. |
| `RESEND_API_KEY`, `ENQUIRY_EMAIL_TO`, `ENQUIRY_EMAIL_FROM` | Email fallback through Resend. `ENQUIRY_EMAIL_TO` accepts a comma-separated list. |
| `CRON_SECRET` | Bearer token required by `/api/enquiries/retry`. Vercel Cron sends it automatically. |
| `MOCK_CRM_MODE=down`, `MOCK_CRM_FAILURE_RATE=0.3` | Simulate a CRM outage on the mock endpoint. |

## Trying the outage path locally

```bash
MOCK_CRM_MODE=down pnpm dev          # submit the form: you get the "queued" message
cat .data/enquiry-outbox.json        # the enquiry is in the outbox with nextAttemptAt
pnpm dev                             # restart with the CRM "back up"
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/enquiries/retry
```
