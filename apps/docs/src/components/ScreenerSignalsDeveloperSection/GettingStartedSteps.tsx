// @ts-ignore
// @ts-ignore
import _Link from "@docusaurus/Link";

let Link = _Link as any;

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
    title: "Download the starter project",
    body: (
      <>
        Scroll to <strong>Starter code</strong> below and click <strong>Download ZIP</strong>. You
        get a ready-made Vite + React project — no need to clone this docs repo.
      </>
    ),
  },
  {
    title: "Install dependencies",
    body: (
      <>
        Unzip the folder, open your terminal app (Terminal on Mac, PowerShell on Windows),{" "}
        <code>cd</code> into the folder, and run <code>npm install</code>. You need{" "}
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
        Run <code>npm run dev</code>. Your browser will show a local URL (usually{" "}
        <code>http://localhost:5173</code>) — open it. The chart should load with live Binance
        candles and strategy markers (<code>CROSS</code>, <code>EXCEED</code>).
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
        You do not need to understand the whole docs repo — download the zip, run it, then iterate.
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
