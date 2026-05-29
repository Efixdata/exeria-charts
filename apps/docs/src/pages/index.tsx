import { useEffect, useState } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import ChartQuickstartExample from "../components/ChartQuickstartExample";
import CryptoTerminalCaseStudyChart from "../components/CryptoTerminalCaseStudyChart";
import styles from "./index.module.css";

const features = [
  {
    eyebrow: "Performance",
    title: "Built for dense market data.",
    body: "Render millions of data points at a flawless 60 FPS without browser lag. Real chart workflows powered by a highly optimized, raw HTML5 Canvas engine.",
    icon: "lightning",
  },
  {
    eyebrow: "Ownership",
    title: "Keep the chart surface yours.",
    body: "No iframes, no bloated external dependencies. Start with our core runtime, integrate seamlessly, and build your own custom UI controls around the chart.",
    icon: "cube",
  },
  {
    eyebrow: "Developer Experience",
    title: "Public API first. Native TypeScript.",
    body: "Enjoy a first-class developer experience with strict type-checking, comprehensive autocompletion, and a predictable lifecycle architecture.",
    icon: "code",
  },
  {
    eyebrow: "Release & Reliability",
    title: "Documentation that reads like a product.",
    body: "Trusted in high-stakes financial environments and built by Benzinga Award winners. Shorter guidance, cleaner defaults, and examples that help you launch faster.",
    icon: "badge",
  },
] as const;

function FeatureIcon({ name }: { name: (typeof features)[number]["icon"] }): JSX.Element {
  const paths: Record<(typeof features)[number]["icon"], string> = {
    lightning: "M13 10V3L4 14h7v7l9-11h-7z",
    cube: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    code: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    badge:
      "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  };

  return (
    <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={paths[name]} />
    </svg>
  );
}

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
    body: "Understand AGPL obligations, plugin licenses, and when you need a commercial license for closed-source products.",
    href: "/docs/guides/licensing",
    cta: "Read licensing guide",
  },
  {
    title: "Plugins & Commercial Use",
    body: "Ship faster with ready-made plugins for indicators, drawing tools, and data bridges—or use a commercial license to keep your code closed in large, professional products.",
    href: "/docs/guides/licensing#plugin-licenses",
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
    name: "Plugin Store",
    price: "Perpetual license per project",
    features: [
      { label: "One license per app or codebase", emphasized: true },
      { label: "Advanced technical indicators", emphasized: false },
      { label: "Advanced drawing & annotation tools", emphasized: false },
      { label: "Data bridge plugins", emphasized: false },
    ],
    cta: "Browse Plugins",
    href: "/docs/guides/licensing#plugin-licenses",
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
      { label: "Enterprise data bridges & integrations", emphasized: false },
    ],
    cta: "Contact Us",
    href: "/docs/guides/licensing#commercial-license",
    variant: "secondary" as const,
    featured: false,
  },
];

const caseStudies = [
  {
    id: "crypto-terminal",
    title: "The Ultimate Crypto Terminal.",
    body: "Deliver the institutional trading experience your power users demand. Leverage our robust windowing framework to build fully customizable workspaces.",
    href: "/docs/getting-started/react",
  },
  {
    id: "quant-analytics",
    title: "Quant Analytics Dashboard.",
    body: "Visualize complex backtest results, equity curves, and proprietary indicators over millions of historical ticks without browser lag.",
    href: "/docs/getting-started/vanilla",
  },
  {
    id: "forex-platforms",
    title: "Next-Gen Forex Platforms.",
    body: "Upgrade your users from clunky legacy interfaces. Visualize fractional pip movements and dynamic bid/ask spreads with zero latency.",
    href: "/docs/getting-started/vite-react",
  },
  {
    id: "mobile-native",
    title: "Mobile and touch-ready charts.",
    body: "Pan, pinch, compact layout, and dense toolbar chrome on narrow viewports. Follow the mobile integration guide for viewport, safe-area, and QA setup.",
    href: "/docs/advanced/mobile-and-responsive",
  },
];

const NPM_COMMAND = "npm install @exeria/charts";

function CommandBox(): JSX.Element {
  const copyCommand = () => {
    void navigator.clipboard.writeText(NPM_COMMAND);
  };

  return (
    <button
      type="button"
      className={styles.commandBox}
      onClick={copyCommand}
      aria-label="Copy npm install command"
    >
      <span className={styles.commandText}>{NPM_COMMAND}</span>
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.badge}>🏆 Winner of the Benzinga Fintech Awards</div>
          <h1 className={styles.title}>
            Build Modern Charts
            <br />
            in Minutes.
          </h1>
          <p className={styles.subtitle}>
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

          <div className={styles.heroChartContainer}>
            {isMounted ? (
              <ChartQuickstartExample />
            ) : (
              <div className={styles.exampleFallback}>Loading live chart example...</div>
            )}
          </div>

          <CommandBox />
        </section>

        <section id="features" className={styles.featuresSection}>
          <div className={styles.featuresGrid}>
            {features.map((item) => (
              <article key={item.title} className={styles.featureItem}>
                <FeatureIcon name={item.icon} />
                <p className={styles.featureEyebrow}>{item.eyebrow}</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
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

        <section id="case-studies" className={styles.caseStudiesSection}>
          <div className={styles.sectionHeader}>
            <h2>Engineered for every use case.</h2>
          </div>

          <div className={styles.caseGrid}>
            {caseStudies.map((item) => (
              <article key={item.title} className={styles.caseCard}>
                <div className={styles.caseVisual}>
                  {isMounted ? (
                    item.id === "crypto-terminal" ? (
                      <CryptoTerminalCaseStudyChart />
                    ) : (
                      <ChartQuickstartExample compact />
                    )
                  ) : (
                    <div className={styles.caseChartFallback}>Loading chart...</div>
                  )}
                </div>
                <div className={styles.caseContent}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <a className={styles.caseLink} href={item.href}>
                    View Implementation <span aria-hidden>→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.pricingSection}>
          <div className={styles.sectionHeader}>
            <h2>Free open-source core. Pro plugins to move faster.</h2>
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

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
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