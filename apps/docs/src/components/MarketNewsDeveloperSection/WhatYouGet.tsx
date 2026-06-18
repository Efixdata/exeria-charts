import Link from "@docusaurus/Link";
import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const INCLUDED_ITEMS = [
  "Compare chart (EUR/USD vs GBP/USD, indexed to 100)",
  "News markers on EUR/USD (NEWSFEED script)",
  "Static H1 candle JSON — works offline",
  "Vanilla embed snippets (no React required)",
] as const;

const DEMO_ITEMS = [
  "Full article chrome in the live docs demo",
  "Sidebar sparklines and theme toggle",
  "Period pills and editorial captions",
] as const;

const YOUR_ITEMS = [
  {
    label: "Your CMS headlines → NewsFeedRecord[]",
    href: "/docs/advanced/news-feed-data-model",
  },
  {
    label: "Live or scheduled FX data",
    href: "/docs/tutorials/chart-with-your-data",
  },
  {
    label: "Custom themes for light newsroom pages",
    href: "/docs/theming/overview",
  },
] as const;

export default function WhatYouGet() {
  return (
    <section className={styles.whatSection} aria-labelledby="market-news-what">
      <h3 id="market-news-what">What the ZIP includes vs what you add later</h3>
      <p className={styles.whatIntro}>
        The starter is a minimal <em>article + charts</em> app with bundled demo data. The live docs
        demo adds extra editorial polish you can copy when you are ready.
      </p>

      <div className={styles.whatGrid}>
        <article className={styles.whatCard}>
          <span className={styles.whatBadgeLive}>In the ZIP</span>
          <h4>Works after npm run dev</h4>
          <p>No API keys. JSON files ship in <code>src/data/</code>.</p>
          <ul>
            {INCLUDED_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className={styles.whatLink || ""} to="/docs/getting-started/vanilla">
            Vanilla quickstart →
          </Link>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeDemo}>Live demo only</span>
          <h4>Extra UI in the docs article</h4>
          <p>Open the live app to see patterns you can borrow — not all are in the ZIP.</p>
          <ul>
            {DEMO_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className={styles.whatLink || ""} to="/starters/market-news/app">
            Open live article →
          </Link>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeYours}>You wire this up</span>
          <h4>When you ship to production</h4>
          <p>Replace fixtures with your pipeline and embed in your CMS template.</p>
          <ul>
            {YOUR_ITEMS.map((item) => (
              <li key={item.label}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
          <Link className={styles.whatLink || ""} to="/docs/chart-usage/multi-instrument-charts">
            Multi-instrument charts →
          </Link>
        </article>
      </div>
    </section>
  );
}
