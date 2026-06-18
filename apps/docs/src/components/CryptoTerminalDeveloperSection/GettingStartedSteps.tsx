import Link from "@docusaurus/Link";
import styles from "./cryptoTerminalDeveloperSection.module.css";

const STEPS = [
  {
    title: "See the finished app",
    body: (
      <>
        Open the{" "}
        <Link to="/starters/crypto-terminal/app">live terminal</Link> in another tab. This is what
        you are building — chart, markets, depth, and a trade panel. No install yet.
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
        prices.
      </>
    ),
  },
  {
    title: "Start changing things",
    body: (
      <>
        Open <code>src/App.tsx</code> in Cursor, VS Code, or any editor. Change a color, symbol, or
        label — save the file and the page updates automatically. The <code>snippets/</code> folder
        has extra copy-paste examples for data and trading.
      </>
    ),
  },
] as const;

export default function GettingStartedSteps() {
  return (
    <section className={styles.stepsSection} aria-labelledby="crypto-terminal-steps">
      <h3 id="crypto-terminal-steps">Get started in 5 steps</h3>
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
        Prefer the browser? Use <strong>StackBlitz</strong> below — same project, no unzip step.
      </p>
    </section>
  );
}
