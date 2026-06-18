import Link from "@docusaurus/Link";
import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const STEPS = [
  {
    title: "See the finished app",
    body: (
      <>
        Open the{" "}
        <Link to="/starters/quant-analytics/app">live dashboard</Link> in another tab. Strategy
        presets, buy/sell markers, indicator panes, and an equity curve — no install yet.
      </>
    ),
  },
  {
    title: "Download the starter project",
    body: (
      <>
        Scroll to <strong>Starter code</strong> below and click <strong>Download ZIP</strong>. You
        get a ready-made Vite + React project with bundled EUR/USD candles — no need to clone this
        docs repo.
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
        <code>http://localhost:5173</code>) — open it. The chart loads EUR/USD H1 candles from{" "}
        <code>public/data/eur-usd-h1.json</code> and wires the default WMA/EMA composite strategy.
      </>
    ),
  },
  {
    title: "Start changing things",
    body: (
      <>
        Open <code>src/App.tsx</code> in Cursor, VS Code, or any editor. Tweak indicator periods,
        swap presets, or add your own scripts — save the file and the page updates automatically.
        The <code>snippets/</code> folder has copy-paste examples for Bollinger breakout, mean
        reversion, and equity curve wiring.
      </>
    ),
  },
] as const;

export default function GettingStartedSteps() {
  return (
    <section className={styles.stepsSection} aria-labelledby="quant-analytics-steps">
      <h3 id="quant-analytics-steps">Get started in 5 steps</h3>
      <p className={styles.stepsIntro}>
        New to React or charting? Follow this path once. After that, vibe-code whatever you want on
        top.
      </p>
      <ol className={styles.stepsList}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.stepItem}>
            <span className={styles.stepNumber} aria-hidden>
              {index + 1}
            </span>
            <div>
              <strong className={styles.stepTitle}>{step.title}</strong>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className={styles.stepsAlt}>
        Prefer the browser? Use <strong>StackBlitz</strong> below — same workflow, no unzip step.
      </p>
    </section>
  );
}
