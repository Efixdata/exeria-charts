import { useEffect, useState } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import ChartQuickstartExample from "../components/ChartQuickstartExample";
import styles from "./index.module.css";

const highlights = [
  {
    title: "Vanilla and React entry points",
    body: "Start with the core chart package, then layer the React UI wrapper only where you want toolbar and menu chrome.",
  },
  {
    title: "Self-hosted and customizable",
    body: "Render directly in your application surface with your own data, theme decisions, and release cadence.",
  },
  {
    title: "Real financial chart workflows",
    body: "Candles, intervals, draw modes, indicators, and runtime theming are designed for product surfaces, not toy demos.",
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
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Docs Preview</p>
            <h1 className={styles.title}>Build chart surfaces your product team can actually own.</h1>
            <p className={styles.lede}>
              Exeria Charts gives you a self-hosted chart runtime, a React UI wrapper, and a
              cleaner path to custom trading or analytics interfaces than iframe-based embeds.
            </p>
            <div className={styles.actions}>
              <a className="button button--primary button--lg" href="/docs/getting-started/vanilla">
                Start with Vanilla
              </a>
              <a className="button button--secondary button--lg" href="/docs/getting-started/react">
                React Quickstart
              </a>
            </div>
          </div>

          <div className={styles.heroPanel}>
            <div className={styles.panelLabel}>First milestone</div>
            <ul className={styles.panelList}>
              <li>Public package entrypoints only</li>
              <li>Focused quickstarts instead of release-plan archaeology</li>
              <li>Live example built from the same repo packages you publish</li>
            </ul>
          </div>
        </section>

        <section className={styles.highlights}>
          {highlights.map((item) => (
            <article key={item.title} className={styles.card}>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        <section className={styles.exampleSection}>
          <div className={styles.exampleHeader}>
            <div>
              <p className={styles.eyebrow}>Live Example</p>
              <h2>Basic chart initialization</h2>
            </div>
            <p>
              This example stays on the stable chart API surface: create a chart, initialize it,
              load candles, and switch draw modes without reaching into internal source files.
            </p>
          </div>

          {isMounted ? (
            <ChartQuickstartExample />
          ) : (
            <div className={styles.exampleFallback}>Loading live chart example...</div>
          )}
        </section>
      </main>
    </Layout>
  );
}