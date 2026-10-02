"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

type Labels = Dictionary["contact"];
type FieldName = "name" | "email" | "service" | "message" | "consent";
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "success"; id: string; queued: boolean } | { kind: "error" };

const REQUIRED: FieldName[] = ["name", "email", "service", "message", "consent"];
const subscribeNoop = () => () => {};

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

/**
 * Progressive enhancement: the server renders a normal <form method="post"> that works
 * without JavaScript. Once hydrated, it validates with localized messages, submits JSON,
 * and reports the result in place, moving focus to the outcome.
 */
export function EnquiryForm({ lang, labels, email, sourcePage }: { lang: Locale; labels: Labels; email: string; sourcePage: string }) {
  // false during server render and hydration, true afterwards: native validation stays on without JS.
  const enhanced = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status.kind === "success" || status.kind === "error") outcomeRef.current?.focus();
  }, [status.kind]);

  const fieldError = (name: FieldName): string => labels.errors[name];

  function validate(form: HTMLFormElement): Partial<Record<FieldName, string>> {
    const found: Partial<Record<FieldName, string>> = {};
    for (const name of REQUIRED) {
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (!el) continue;
      const tooShort = name === "message" && el.value.trim().length < 20;
      if (!el.checkValidity() || tooShort) found[name] = fieldError(name);
    }
    return found;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "sending") return;
    const form = event.currentTarget;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const body = { ...data, consent: data.consent === "on", budget: data.budget || null };
    setStatus({ kind: "sending" });
    try {
      const res = await fetch(form.action, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
      const json = (await res.json().catch(() => ({}))) as { status?: string; id?: string; fields?: string[] };
      if (res.status === 422 && json.fields) {
        const serverErrors: Partial<Record<FieldName, string>> = {};
        for (const f of json.fields) if ((REQUIRED as string[]).includes(f)) serverErrors[f as FieldName] = fieldError(f as FieldName);
        setErrors(serverErrors);
        setStatus({ kind: "idle" });
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      }
      if ((res.status === 200 || res.status === 202) && json.id) {
        const queued = json.status === "queued";
        setStatus({ kind: "success", id: json.id, queued });
        window.plausible?.("Enquiry", { props: { locale: lang, result: queued ? "queued" : "delivered" } });
        return;
      }
      setStatus({ kind: "error" });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  if (status.kind === "success") {
    const body = (status.queued ? labels.queuedBody : labels.successBody).replace("{id}", status.id.slice(-8).toUpperCase());
    return (
      <div ref={outcomeRef} className="form-outcome form-outcome--success" role="status" tabIndex={-1} data-testid="enquiry-success">
        <h3>{labels.successHeading}</h3>
        <p>{body}</p>
      </div>
    );
  }

  const describedBy = (name: string, help?: boolean) => [help ? `enq-${name}-help` : null, errors[name as FieldName] ? `enq-${name}-error` : null].filter(Boolean).join(" ") || undefined;
  const errorText = (name: FieldName) =>
    errors[name] ? (
      <p id={`enq-${name}-error`} className="field-error">
        {errors[name]}
      </p>
    ) : null;
  const requiredTag = <span className="field-tag">{labels.required}</span>;
  const errorList = Object.entries(errors) as [FieldName, string][];

  return (
    <form ref={formRef} className="enquiry-form" method="post" action="/api/enquiries" noValidate={enhanced} onSubmit={onSubmit} aria-describedby="enquiry-required-note">
      {status.kind === "error" && (
        <div ref={outcomeRef} className="form-outcome form-outcome--error" role="alert" tabIndex={-1} data-testid="enquiry-error">
          <h3>{labels.errorHeading}</h3>
          <p>
            {labels.errorBody.split("{email}")[0]}
            <a href={`mailto:${email}`}>{email}</a>
            {labels.errorBody.split("{email}")[1]}
          </p>
        </div>
      )}

      {errorList.length > 0 && (
        <div ref={summaryRef} className="form-outcome form-outcome--error" role="alert" tabIndex={-1} data-testid="enquiry-invalid">
          <h3>{labels.invalidHeading}</h3>
          <ul>
            {errorList.map(([name, message]) => (
              <li key={name}>
                <a href={`#enq-${name}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <input type="hidden" name="locale" value={lang} />
      <input type="hidden" name="sourcePage" value={sourcePage} />

      <div className="form-grid">
        <div className="field">
          <label htmlFor="enq-name">
            {labels.name} {requiredTag}
          </label>
          <input id="enq-name" name="name" type="text" autoComplete="name" required maxLength={120} aria-invalid={errors.name ? true : undefined} aria-describedby={describedBy("name")} />
          {errorText("name")}
        </div>

        <div className="field">
          <label htmlFor="enq-email">
            {labels.email} {requiredTag}
          </label>
          <input id="enq-email" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} aria-invalid={errors.email ? true : undefined} aria-describedby={describedBy("email")} />
          {errorText("email")}
        </div>

        <div className="field">
          <label htmlFor="enq-company">
            {labels.company} <span className="field-optional">({labels.optional})</span>
          </label>
          <input id="enq-company" name="company" type="text" autoComplete="organization" maxLength={160} />
        </div>

        <div className="field">
          <label htmlFor="enq-service">
            {labels.service} {requiredTag}
          </label>
          <select id="enq-service" name="service" required defaultValue="" aria-invalid={errors.service ? true : undefined} aria-describedby={describedBy("service")}>
            <option value="" disabled>
              {labels.choose}
            </option>
            {Object.entries(labels.serviceOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errorText("service")}
        </div>

        <div className="field">
          <label htmlFor="enq-projectTitle">
            {labels.projectTitle} <span className="field-optional">({labels.optional})</span>
          </label>
          <input id="enq-projectTitle" name="projectTitle" type="text" maxLength={160} />
        </div>

        <div className="field">
          <label htmlFor="enq-budget">
            {labels.budget} <span className="field-optional">({labels.optional})</span>
          </label>
          <select id="enq-budget" name="budget" defaultValue="">
            <option value="">{labels.choose}</option>
            {Object.entries(labels.budgetOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field field--wide">
          <label htmlFor="enq-timeline">
            {labels.timeline} <span className="field-optional">({labels.optional})</span>
          </label>
          <p id="enq-timeline-help" className="field-help">
            {labels.timelineHelp}
          </p>
          <input id="enq-timeline" name="timeline" type="text" maxLength={160} aria-describedby="enq-timeline-help" />
        </div>

        <div className="field field--wide">
          <label htmlFor="enq-message">
            {labels.message} {requiredTag}
          </label>
          <p id="enq-message-help" className="field-help">
            {labels.messageHelp}
          </p>
          <textarea id="enq-message" name="message" rows={6} required minLength={20} maxLength={4000} aria-invalid={errors.message ? true : undefined} aria-describedby={describedBy("message", true)} />
          {errorText("message")}
        </div>

        <fieldset className="field field--wide choice-group">
          <legend>{labels.preferredLanguage}</legend>
          <div className="choices">
            <label className="choice">
              <input type="radio" name="preferredLanguage" value="en" defaultChecked={lang === "en"} />
              {labels.languageEn}
            </label>
            <label className="choice">
              <input type="radio" name="preferredLanguage" value="ja" defaultChecked={lang === "ja"} />
              {labels.languageJa}
            </label>
          </div>
        </fieldset>

        <div className="field field--wide">
          <div className="choice choice--consent">
            <input id="enq-consent" name="consent" type="checkbox" required aria-invalid={errors.consent ? true : undefined} aria-describedby={describedBy("consent")} />
            <label htmlFor="enq-consent">
              {labels.consent} {requiredTag}
            </label>
          </div>
          {errorText("consent")}
        </div>

        <div className="hp" aria-hidden="true">
          <label htmlFor="enq-website">{labels.honeypot}</label>
          <input id="enq-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      <div className="form-actions">
        <button className="button button--primary" type="submit" aria-disabled={status.kind === "sending" || undefined}>
          {status.kind === "sending" ? labels.sending : labels.submit}
        </button>
        <p id="enquiry-required-note" className="field-help">
          {labels.responseTime}
        </p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {status.kind === "sending" ? labels.sending : ""}
      </p>
    </form>
  );
}
