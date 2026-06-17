import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import CaseStudiesSection from "@site/src/components/marketing/CaseStudiesSection";
import FeaturesSection from "@site/src/components/marketing/FeaturesSection";
import { CHART_INSTALL_COMMAND } from "@site/src/data/packages";
import layoutStyles from "@site/src/css/marketingLayout.module.css";
import styles from "./index.module.css";

const guides = [
  {
    title: "Vanilla Quickstart",
    body: "Mount the runtime, load candles, switch draw modes, and keep the rest of the surface in your own app shell.",
    href: "/docs/getting-started/vanilla",
    cta: "Open guide",
  },
  {
    title: "React Quickstart",
    body: "Create the runtime instance in React, then layer the toolbar and left-menu controls on top.",
    href: "/docs/getting-started/react",
    cta: "Open guide",
  },
  {
    title: "Vite + React",
    body: "Use the runtime and optional ChartUI wrapper in a browser-only React app with minimal bundler ceremony.",
    href: "/docs/getting-started/vite-react",
    cta: "Open guide",
  },
  {
    title: "Next.js App Router",
    body: "Keep the chart inside a client boundary, avoid SSR pitfalls, and stream the rest of the route from the server.",
    href: "/docs/getting-started/nextjs-app-router",
    cta: "Open guide",
  },
  {
    title: "Licensing",
    body: "Understand AGPL obligations, MIT Data Connector packages, and when you need a commercial license for closed-source products.",
    href: "/docs/guides/licensing",
    cta: "Read licensing guide",
  },
  {
    title: "Data Connectors & Commercial Use",
    body: "Ship faster with MIT connectors for public and freemium market data—or use a commercial license to keep your app closed source.",
    href: "/docs/guides/licensing#data-connectors-licensing",
    cta: "Open guide",
  },
];

const pricingPlans = [
  {
    name: "Community",
    price: "Open Source (AGPL v3)",
    features: [
      { label: "Core chart runtime & TypeScript API", emphasized: true },
      { label: "90+ built-in technical indicators", emphasized: false },
      { label: "Standard drawing tools & chart modes", emphasized: false },
      { label: "Docs, examples & GitHub community", emphasized: false },
    ],
    cta: "Read Documentation",
    href: "/docs/intro",
    variant: "secondary" as const,
    featured: false,
  },
  {
    name: "Data Connectors",
    price: "Free connectors for instant market data",
    features: [
      { label: "Free connectors for open data providers", emphasized: true },
      { label: "Freemium and API-key connectors (Massive, Finnhub, …)", emphasized: false },
      { label: "Seamless REST & WebSocket integration", emphasized: false },
      { label: "Ready to deploy out of the box", emphasized: false },
    ],
    cta: "Explore Data Connectors",
    href: "/data-connectors",
    variant: "primary" as const,
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Commercial license",
    features: [
      { label: "Keep your application code closed", emphasized: true },
      { label: "Startup-friendly pricing", emphasized: false },
      { label: "Advanced indicators & drawing tools", emphasized: false },
      { label: "Enterprise data connectors & integrations", emphasized: false },
    ],
    cta: "Contact Us",
    href: "/docs/guides/licensing#commercial-license",
    variant: "secondary" as const,
    featured: false,
  },
];

function CommandBox(): JSX.Element {
  const copyCommand = () => {
    void navigator.clipboard.writeText(CHART_INSTALL_COMMAND);
  };

  return (
    <button
      type="button"
      className={styles.commandBox}
      onClick={copyCommand}
      aria-label="Copy npm install command"
    >
      <span className={styles.commandText}>{CHART_INSTALL_COMMAND}</span>
      <svg
        className={styles.commandIcon}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main className={layoutStyles.page}>
        <section className={layoutStyles.hero}>
          <div className={styles.badge}>🏆 Winner of the Benzinga Fintech Awards</div>
          <h1 className={layoutStyles.title}>
            Build Modern Charts
            <br />
            in Minutes.
          </h1>
          <p className={layoutStyles.subtitle}>
            The high-performance open source charting library that developers love using. Integrate
            once, deploy everywhere. Zero dependencies.
          </p>

          <div className={styles.actions}>
            <a className="button button--primary button--lg" href="/docs/getting-started/vanilla">
              Get Started
            </a>
            <a className="button button--secondary button--lg" href="/docs/intro">
              Read the Docs
            </a>
          </div>

          <div className={styles.heroVideoContainer}>
            <div className={styles.heroVideo}>
              <video
                className={styles.heroVideoElement}
                src="/video/Exeriachartsok.mp4"
                autoPlay
                muted
                loop
                playsInline
                controls
                aria-label="Exeria Charts product demo"
              />
            </div>
          </div>

          <CommandBox />
        </section>

        <FeaturesSection />

        <section className={layoutStyles.section}>
          <div className={layoutStyles.sectionHeader}>
            <h2>Write once. Fit the product around it.</h2>
            <p>
              Start with the runtime. Add the React controls when they save time. Keep the surface
              self-hosted either way.
            </p>
          </div>

          <p className={styles.platformsLine}>
            <strong>React</strong> <span>/</span> Next.js <span>/</span> <strong>Vanilla JS</strong>
            <br />
            Dashboards <span>/</span> Trading surfaces <span>/</span> Embedded analytics
          </p>
        </section>

        <CaseStudiesSection />

        <section id="pricing" className={styles.pricingSection}>
          <div className={layoutStyles.sectionHeader}>
            <h2>Free open-source core. Instant data connectors to move faster.</h2>
            <p>
              Use the full charting engine under AGPL v3 for open and experimental work. Need a
              proprietary product? A commercial license lets you keep your code closed—with
              startup-friendly pricing for small teams.
            </p>
          </div>

          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={plan.featured ? styles.pricingCardFeatured : styles.pricingCard}
              >
                <h3>{plan.name}</h3>
                <p className={styles.pricingPrice}>{plan.price}</p>
                <ul className={styles.pricingList}>
                  {plan.features.map((feature) => (
                    <li key={feature.label}>
                      {feature.emphasized ? <strong>{feature.label}</strong> : feature.label}
                    </li>
                  ))}
                </ul>
                <a
                  className={`button button--${plan.variant} button--lg ${styles.pricingCta} ${
                    plan.variant === "secondary" ? styles.pricingCtaOutlined : ""
                  }`}
                  href={plan.href}
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className={layoutStyles.section}>
          <div className={layoutStyles.sectionHeader}>
            <h2>Start with the guide that matches the job.</h2>
          </div>

          <div className={styles.guidesGrid}>
            {guides.map((guide) => (
              <a key={guide.title} className={styles.guideCard} href={guide.href}>
                <h3>{guide.title}</h3>
                <p>{guide.body}</p>
                <span className={styles.guideLink}>{guide.cta} →</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
