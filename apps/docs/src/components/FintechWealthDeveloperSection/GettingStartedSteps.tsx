// @ts-ignore
// @ts-ignore
import _Link from "@docusaurus/Link";

let Link = _Link as any;

import styles from "./fintechWealthDeveloperSection.module.css";

const STEPS = [
    // @ts-ignore
  {
    title: "See the finished app",
    body: (
      <>
        Open the{" "}
        <Link to="/starters/fintech-integration/app">consumer demo</Link> in another tab. This is
        what you are building — portfolio hero, compare chart, holdings, and asset detail. No
        install yet.
      </>
    ),
  },
  {
    title: "Download the starter project",
    body: (
      <>
        Scroll to <strong>Starter code</strong> below and click <strong>Download ZIP</strong>. You
        get a ready-made Vite + React project with equity CSV fixtures — no need to clone this docs
        repo.
      </>
    ),
  },
  {
    title: "Install dependencies",
    body: (
      <>
        Unzip the folder, <code>cd</code> into it, and run <code>npm install</code>. You need{" "}
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
        Run <code>npm run dev</code>. Open the local URL (usually <code>http://localhost:5173</code>
        ). The compare chart loads AAPL / VWCE / SPY from <code>public/data/fintech-equity/</code>.
      </>
    ),
  },
  {
    title: "Start changing things",
    body: (
      <>
        Open <code>src/App.tsx</code> in your editor. Tweak colors, symbols, or portfolio layout —
        save and the page updates. Check <code>snippets/</code> for chart setup, portfolio model,
        and shell components.
      </>
    ),
  },
] as const;

export default function GettingStartedSteps() {
  return (
    <section className={styles.stepsSection} aria-labelledby="fintech-wealth-steps">
      <h3 id="fintech-wealth-steps">Get started in 5 steps</h3>
      <p className={styles.stepsIntro}>
        New to React or embedding charts in a banking app? Follow this path once. After that, extend
        the shell with your data feed and product chrome.
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
