import Link from "@docusaurus/Link";
import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const STEPS = [
  {
    title: "See the finished article",
    body: (
      <>
        Open the{" "}
        <Link to="/starters/market-news/app">live article demo</Link> in another tab — compare
        chart, news markers, editorial layout. No install yet.
      </>
    ),
  },
  {
    title: "Download the starter project",
    body: (
      <>
        Scroll to <strong>Starter code</strong> below and click <strong>Download ZIP</strong>. You
        get a Vite + React article with sample FX JSON — no need to clone this docs repo.
      </>
    ),
  },
  {
    title: "Install dependencies",
    body: (
      <>
        Unzip the folder, open Terminal (Mac) or PowerShell (Windows), <code>cd</code> into it, run{" "}
        <code>npm install</code>. You need{" "}
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
        Run <code>npm run dev</code> and open the local URL (usually{" "}
        <code>http://localhost:5173</code>). You should see the article with two working charts.
      </>
    ),
  },
  {
    title: "Vibe-code your story",
    body: (
      <>
        Edit <code>src/App.tsx</code> in Cursor or VS Code — change the headline, add a paragraph,
        tweak chart height. Swap <code>src/data/*.json</code> when you wire your CMS. Extra
        examples live in <code>snippets/</code>.
      </>
    ),
  },
] as const;

export default function GettingStartedSteps() {
  return (
    <section className={styles.stepsSection} aria-labelledby="market-news-steps">
      <h3 id="market-news-steps">Get started in 5 steps</h3>
      <p className={styles.stepsIntro}>
        New to chart embeds or React? Follow this once. After that, paste snippets into your
        newsroom stack and let your editor help with the rest.
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
        Prefer the browser? Use <strong>StackBlitz</strong> below — blank Vite template, then paste
        a snippet.
      </p>
    </section>
  );
}
