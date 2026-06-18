import { FormEvent, useState } from "react";
import Link from "@docusaurus/Link";
import { trackMarketingEvent } from "@site/src/utils/marketingAnalytics";
import { submitNetlifyForm, NETLIFY_FORMS } from "@site/src/utils/netlifyForms";
import styles from "./styles.module.css";

type InterestKey =
  | "interestCommercialLicense"
  | "interestConsulting"
  | "interestDevelopment"
  | "interestEnterprise"
  | "interestDataConnectors"
  | "interestOther";

const INTEREST_OPTIONS: Array<{ key: InterestKey; label: string; description: string }> = [
  {
    key: "interestCommercialLicense",
    label: "Commercial license",
    description: "Use Exeria Charts in a closed-source or proprietary product.",
  },
  {
    key: "interestConsulting",
    label: "Technical consulting",
    description: "Architecture review, integration planning, or chart UX guidance.",
  },
  {
    key: "interestDevelopment",
    label: "Development services",
    description: "Hands-on implementation, custom indicators, or product build-out.",
  },
  {
    key: "interestEnterprise",
    label: "Enterprise support",
    description: "Priority onboarding, SLA, or rollout for a larger team.",
  },
  {
    key: "interestDataConnectors",
    label: "Paid Data Connectors",
    description: "Licensing for commercial market-data connector packages.",
  },
  {
    key: "interestOther",
    label: "Other partnership",
    description: "OEM, reseller, or something not listed above.",
  },
];

const LICENSE_MODEL_OPTIONS = [
  { value: "open-source-agpl", label: "Open source (AGPL-compliant)" },
  { value: "closed-source", label: "Closed-source / proprietary product" },
  { value: "evaluating", label: "Evaluating licensing options" },
  { value: "not-sure", label: "Not sure yet" },
];

const PRODUCT_TYPE_OPTIONS = [
  { value: "saas", label: "SaaS product" },
  { value: "trading", label: "Trading or brokerage interface" },
  { value: "analytics", label: "Analytics or research dashboard" },
  { value: "mobile", label: "Mobile application" },
  { value: "embedded", label: "Embedded / white-label charting" },
  { value: "internal", label: "Internal operations tool" },
  { value: "other", label: "Other" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "ASAP — active build or launch" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "3-6-months", label: "3–6 months" },
  { value: "6-plus-months", label: "6+ months" },
  { value: "exploring", label: "Just exploring" },
];

const TEAM_SIZE_OPTIONS = [
  { value: "solo", label: "Solo / freelancer" },
  { value: "2-10", label: "2–10 people" },
  { value: "11-50", label: "11–50 people" },
  { value: "51-200", label: "51–200 people" },
  { value: "200-plus", label: "200+ people" },
];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  companyWebsite: string;
  country: string;
  interests: Record<InterestKey, boolean>;
  licenseModel: string;
  productType: string;
  productTypeOther: string;
  projectDescription: string;
  timeline: string;
  teamSize: string;
  referralSource: string;
  additionalNotes: string;
  botField: string;
};

const INITIAL_STATE: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  jobTitle: "",
  companyWebsite: "",
  country: "",
  interests: {
    interestCommercialLicense: false,
    interestConsulting: false,
    interestDevelopment: false,
    interestEnterprise: false,
    interestDataConnectors: false,
    interestOther: false,
  },
  licenseModel: "",
  productType: "",
  productTypeOther: "",
  projectDescription: "",
  timeline: "",
  teamSize: "",
  referralSource: "",
  additionalNotes: "",
  botField: "",
};

function buildSubmissionPayload(form: FormState): Record<string, string> {
  const payload: Record<string, string> = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    company: form.company.trim(),
    jobTitle: form.jobTitle.trim(),
    companyWebsite: form.companyWebsite.trim(),
    country: form.country.trim(),
    licenseModel: form.licenseModel,
    productType: form.productType,
    productTypeOther: form.productTypeOther.trim(),
    projectDescription: form.projectDescription.trim(),
    timeline: form.timeline,
    teamSize: form.teamSize,
    referralSource: form.referralSource.trim(),
    additionalNotes: form.additionalNotes.trim(),
    "bot-field": form.botField,
  };

  for (const option of INTEREST_OPTIONS) {
    payload[option.key] = form.interests[option.key] ? "yes" : "";
  }

  return payload;
}

export default function ContactForm(): JSX.Element {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInterest = Object.values(form.interests).some(Boolean);
  const showProductTypeOther = form.productType === "other";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!hasInterest) {
      setError("Select at least one area of interest.");
      return;
    }

    setSubmitting(true);

    try {
      await submitNetlifyForm(NETLIFY_FORMS.CONTACT, buildSubmissionPayload(form));
      trackMarketingEvent("contact_form_submit", {
        licenseModel: form.licenseModel,
        productType: form.productType,
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong while sending your message. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.successPanel}>
        <h2 className={styles.successTitle}>Thank you — we received your inquiry</h2>
        <p className={styles.successText}>
          Our team will review your project details and reply to{" "}
          <strong>{form.email.trim()}</strong> within one to two business days.
        </p>
        <div className={styles.successActions}>
          <Link className="button button--primary button--lg" to="/docs/guides/licensing">
            Read licensing guide
          </Link>
          <Link className="button button--secondary button--outline button--lg" to="/docs/intro">
            Back to documentation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className={styles.form}
      name="exeria-contact"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      noValidate
    >
      <input type="hidden" name="form-name" value="exeria-contact" />

      <fieldset className={styles.fieldset}>
        <legend className={styles.fieldsetLegend}>About you</legend>
        <p className={styles.fieldsetHint}>So we know who to follow up with and in what context.</p>

        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>First name</span>
            <input
              className={styles.fieldInput}
              type="text"
              name="firstName"
              required
              autoComplete="given-name"
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Last name</span>
            <input
              className={styles.fieldInput}
              type="text"
              name="lastName"
              required
              autoComplete="family-name"
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
            />
          </label>
        </div>

        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Work email</span>
            <input
              className={styles.fieldInput}
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Phone <span className={styles.optional}>(optional)</span>
            </span>
            <input
              className={styles.fieldInput}
              type="tel"
              name="phone"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </label>
        </div>

        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Company</span>
            <input
              className={styles.fieldInput}
              type="text"
              name="company"
              required
              autoComplete="organization"
              value={form.company}
              onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Job title / role</span>
            <input
              className={styles.fieldInput}
              type="text"
              name="jobTitle"
              required
              autoComplete="organization-title"
              placeholder="e.g. CTO, Lead Frontend Engineer"
              value={form.jobTitle}
              onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))}
            />
          </label>
        </div>

        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Company website <span className={styles.optional}>(optional)</span>
            </span>
            <input
              className={styles.fieldInput}
              type="url"
              name="companyWebsite"
              placeholder="https://"
              value={form.companyWebsite}
              onChange={(event) =>
                setForm((current) => ({ ...current, companyWebsite: event.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Country</span>
            <input
              className={styles.fieldInput}
              type="text"
              name="country"
              required
              autoComplete="country-name"
              value={form.country}
              onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.fieldsetLegend}>How can we help?</legend>
        <p className={styles.fieldsetHint}>Select everything that applies. We route inquiries based on this.</p>

        <div className={styles.checkboxGrid}>
          {INTEREST_OPTIONS.map((option) => (
            <label key={option.key} className={styles.checkboxCard}>
              <input
                type="checkbox"
                name={option.key}
                checked={form.interests[option.key]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    interests: {
                      ...current.interests,
                      [option.key]: event.target.checked,
                    },
                  }))
                }
              />
              <span className={styles.checkboxContent}>
                <span className={styles.checkboxTitle}>{option.label}</span>
                <span className={styles.checkboxDescription}>{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.fieldsetLegend}>Your project</legend>
        <p className={styles.fieldsetHint}>
          Tell us what you are building, whether it stays closed source, and how Exeria Charts fits in.
        </p>

        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Licensing model</span>
            <select
              className={styles.fieldSelect}
              name="licenseModel"
              required
              value={form.licenseModel}
              onChange={(event) =>
                setForm((current) => ({ ...current, licenseModel: event.target.value }))
              }
            >
              <option value="" disabled>
                Select one
              </option>
              {LICENSE_MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Product type</span>
            <select
              className={styles.fieldSelect}
              name="productType"
              required
              value={form.productType}
              onChange={(event) =>
                setForm((current) => ({ ...current, productType: event.target.value }))
              }
            >
              <option value="" disabled>
                Select one
              </option>
              {PRODUCT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {showProductTypeOther ? (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Describe the product type</span>
            <input
              className={styles.fieldInput}
              type="text"
              name="productTypeOther"
              required
              value={form.productTypeOther}
              onChange={(event) =>
                setForm((current) => ({ ...current, productTypeOther: event.target.value }))
              }
            />
          </label>
        ) : null}

        <label className={styles.field}>
          <span className={styles.fieldLabel}>What are you building?</span>
          <textarea
            className={styles.fieldTextarea}
            name="projectDescription"
            required
            rows={5}
            placeholder="Product vision, target users, markets, charting requirements, current stack…"
            value={form.projectDescription}
            onChange={(event) =>
              setForm((current) => ({ ...current, projectDescription: event.target.value }))
            }
          />
        </label>

        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Target timeline</span>
            <select
              className={styles.fieldSelect}
              name="timeline"
              required
              value={form.timeline}
              onChange={(event) => setForm((current) => ({ ...current, timeline: event.target.value }))}
            >
              <option value="" disabled>
                Select one
              </option>
              {TIMELINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Team size</span>
            <select
              className={styles.fieldSelect}
              name="teamSize"
              required
              value={form.teamSize}
              onChange={(event) => setForm((current) => ({ ...current, teamSize: event.target.value }))}
            >
              <option value="" disabled>
                Select one
              </option>
              {TEAM_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.fieldsetLegend}>Anything else?</legend>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            How did you hear about Exeria? <span className={styles.optional}>(optional)</span>
          </span>
          <input
            className={styles.fieldInput}
            type="text"
            name="referralSource"
            placeholder="Conference, GitHub, colleague, search…"
            value={form.referralSource}
            onChange={(event) =>
              setForm((current) => ({ ...current, referralSource: event.target.value }))
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Additional notes <span className={styles.optional}>(optional)</span>
          </span>
          <textarea
            className={styles.fieldTextarea}
            name="additionalNotes"
            rows={3}
            placeholder="Budget range, compliance needs, preferred call times…"
            value={form.additionalNotes}
            onChange={(event) =>
              setForm((current) => ({ ...current, additionalNotes: event.target.value }))
            }
          />
        </label>
      </fieldset>

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

      <div className={styles.submitRow}>
        <button type="submit" className="button button--primary button--lg" disabled={submitting}>
          {submitting ? "Sending…" : "Send inquiry"}
        </button>
        <p className={styles.privacyNote}>
          By submitting, you agree that we may contact you about your inquiry. See our{" "}
          <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
      </div>
    </form>
  );
}
