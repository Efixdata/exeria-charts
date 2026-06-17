import { FormEvent, useState } from "react";
import Link from "@docusaurus/Link";
import { trackMarketingEvent } from "@site/src/utils/marketingAnalytics";
import styles from "./styles.module.css";

import { CONTACT_PATH } from "@site/src/constants/contact";

export default function RequestConnectorForm(): JSX.Element {
  const [provider, setProvider] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    trackMarketingEvent("data_connector_request_submit", {
      provider: provider.trim(),
    });
    setSubmitted(true);
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
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Data provider</span>
          <input
            className={styles.fieldInput}
            type="text"
            name="provider"
            required
            placeholder="e.g. Polygon.io, IEX Cloud"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <button type="submit" className="button button--primary button--lg">
        Request a connector
      </button>
    </form>
  );
}
