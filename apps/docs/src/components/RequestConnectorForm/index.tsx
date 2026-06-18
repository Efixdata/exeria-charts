import { FormEvent, useState } from "react";
// @ts-ignore
// @ts-ignore
import _Link from "@docusaurus/Link";

let Link = _Link as any;

import { trackMarketingEvent } from "@site/src/utils/marketingAnalytics";
import { submitNetlifyForm, NETLIFY_FORMS } from "@site/src/utils/netlifyForms";
import styles from "./styles.module.css";

import { CONTACT_PATH } from "@site/src/constants/contact";

export default function RequestConnectorForm(): JSX.Element {
  const [form, setForm] = useState({
    provider: "",
    email: "",
    notes: "",
    botField: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await submitNetlifyForm(NETLIFY_FORMS.CONNECTOR_REQUEST, {
        provider: form.provider.trim(),
        email: form.email.trim(),
        notes: form.notes.trim(),
        "bot-field": form.botField,
      });

      trackMarketingEvent("data_connector_request_submit", {
        provider: form.provider.trim(),
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.successPanel}>
        <h3 className={styles.successTitle}>Request received</h3>
        <p className={styles.successText}>
          We&apos;ll review your provider request and follow up by email. For urgent integrations,
          continue via our commercial licensing contact.
        </p>
        <Link className="button button--secondary button--outline button--lg" to={CONTACT_PATH}>
          Contact Exeria
        </Link>
      </div>
    );
  }

  return (
    <form 
      className={styles.form} 
      name="connector-request"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit} 
      noValidate
    >
      <input type="hidden" name="form-name" value="connector-request" />

      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Data provider</span>
          <input
            className={styles.fieldInput}
            type="text"
            name="provider"
            required
            placeholder="e.g. Polygon.io, IEX Cloud"
            value={form.provider}
            onChange={(event) => setForm((curr) => ({ ...curr, provider: event.target.value }))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Work email</span>
          <input
            className={styles.fieldInput}
            type="email"
            name="email"
            required
            placeholder="you@company.com"
            value={form.email}
            onChange={(event) => setForm((curr) => ({ ...curr, email: event.target.value }))}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>What are you building? (optional)</span>
        <textarea
          className={styles.fieldTextarea}
          name="notes"
          rows={3}
          placeholder="Product type, markets, timeline…"
          value={form.notes}
          onChange={(event) => setForm((curr) => ({ ...curr, notes: event.target.value }))}
        />
      </label>

      <p className={styles.honeypot} aria-hidden="true">
        <label>
          Do not fill this out
          <input
            type="text"
            name="bot-field"
            tabIndex={-1}
            autoComplete="off"
            value={form.botField}
            onChange={(event) => setForm((current) => ({ ...current, botField: event.target.value }))}
          />
        </label>
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button type="submit" className="button button--primary button--lg" disabled={submitting}>
        {submitting ? "Sending..." : "Request a connector"}
      </button>
    </form>
  );
}
