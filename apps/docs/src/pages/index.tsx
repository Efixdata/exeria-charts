import { useEffect, useState } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import ChartQuickstartExample from "../components/ChartQuickstartExample";
import styles from "./index.module.css";

const features = [
  {
    eyebrow: "Performance",
    title: "Built for dense market data.",
    body: "Render real chart workflows without pushing your product through an iframe or a hosted dependency.",
  },
  {
    eyebrow: "Ownership",
    title: "Keep the chart surface yours.",
    body: "Start with the core runtime, ship your own product chrome, and add the React controls only when they help.",
  },
  {
    eyebrow: "DX",
    title: "Public API first.",
    body: "The docs and examples stay on the package surface you publish: lifecycle, series data, ticks, draw modes, and teardown.",
  },
  {
    eyebrow: "Release",
    title: "Documentation that reads like a product.",
    body: "Shorter guidance, cleaner defaults, and a docs shell that feels closer to a launch site than a generated theme.",
  },
];

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
    cta: "Read React guide",
  },
  {
    title: "Licensing",
    body: "Understand the source-available model before you move from evaluation to a commercial rollout.",
    href: "/docs/guides/licensing",
    cta: "Review terms",
  },
];

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
          <div className={styles.badge}>Source-available release preview</div>
          <h1 className={styles.title}>Build modern charts in your own product.</h1>
          <p className={styles.subtitle}>
            A chart runtime for teams that want trading and analytics surfaces they can fully own,
            theme, and ship without embed lock-in.
          </p>

          <div className={styles.actions}>
            <a className="button button--primary button--lg" href="/docs/getting-started/vanilla">
              Get Started
            </a>
            <a className="button button--secondary button--lg" href="/docs/getting-started/react">
              Read the React Guide
            </a>
          </div>

          <div className={styles.commandBox}>
            <span className={styles.commandText}>npm install @efixdata/exeria-chart</span>
            <span className={styles.commandHint}>Core runtime</span>
          </div>

          <div className={styles.heroChartContainer}>
            {isMounted ? (
              <ChartQuickstartExample />
            ) : (
              <div className={styles.exampleFallback}>Loading live chart example...</div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Engineered for real chart surfaces.</h2>
            <p>
              The design goal is simple: the docs should feel as intentional as the product you are
              building with the library.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((item) => (
              <article key={item.title} className={styles.featureItem}>
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