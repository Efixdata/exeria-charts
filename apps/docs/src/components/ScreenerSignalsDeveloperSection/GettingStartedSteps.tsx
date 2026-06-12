import Link from "@docusaurus/Link";
import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const STEPS = [
  {
    title: "See the finished app",
    body: (
      <>
        Open the{" "}
        <Link to="/starters/screener-signals/app">live signal screener</Link> in another tab.
        Filters, mini charts, expandable analysis, and alert settings — no install yet.
      </>
    ),
  },
  {
    title: "Copy a starter snippet",
    body: (
      <>
        Scroll to <strong>Starter code</strong> below, pick an example tab, and click{" "}
        <strong>Copy snippet</strong>. Paste into a Vite + React app or your existing chart shell.
      </>
    ),
  },
  {
    title: "Install dependencies",
    body: (
      <>
        In your project folder run <code>npm install @exeria/charts @exeria/charts-ui @efix-data/adapter-binance</code>.
        You need{" "}
        <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer">
          Node.js 18+
        </a>
        .
      </>
    ),
  },
  {
    title: "Run it locally",
    body: (
      <>
        Run <code>npm run dev</code> and open the local URL. Load candles, attach built-in strategies
        (<code>CROSS</code>, <code>EXCEED</code>), then wire your screener or alert backend.
      </>
    ),
  },
  {
    title: "Start changing things",
    body: (
      <>
        Swap mock signals for your API, tune filters and row layout, and connect automation when you
        are ready. See{" "}
        <Link to="/docs/scripts/strategies/key-strategies">key strategies</Link> for marker behavior.
      </>
    ),
  },
] as const;

export default function GettingStartedSteps() {
  return (
    <section className={styles.stepsSection} aria-labelledby="screener-signals-steps">
      <h3 id="screener-signals-steps">Get started in five steps</h3>
      <p className={styles.stepsIntro}>
        You do not need to understand the whole docs repo — copy one file, run it, then iterate.
      </p>
      <ol className={styles.stepsList}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.stepItem}>
            <span className={styles.stepNumber}>{index + 1}</span>
            <div>
              <strong className={styles.stepTitle}>{step.title}</strong>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
