import Link from "@docusaurus/Link";
import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const INCLUDED_ITEMS = [
  "FX chart with ChartUI toolbar",
  "Bundled EUR/USD candles (static JSON, no API keys)",
  "NEWSFEED indicator and news-dot pattern",
  "Strategy scripts (CROSS, EXCEED, overlays)",
] as const;

const DEMO_ITEMS = [
  "Illustrative opportunity catalog (arb-signals-feed.json)",
  "Macro calendar strip and signal brief copy",
  "Triangular arb math and chart scenes",
] as const;

const YOUR_ITEMS = [
  {
    label: "Live FX data (Kraken or your connector)",
    href: "/docs/data-connectors/kraken",
  },
  {
    label: "Your opportunity scorer API",
    href: "/docs/tutorials/live-data-stream",
  },
  {
    label: "Alerts and execution hooks",
    href: "/docs/tutorials/trade-from-chart",
  },
] as const;

export default function WhatYouGet() {
  return (
    <section className={styles.whatSection} aria-labelledby="forex-opportunity-what">
      <h3 id="forex-opportunity-what">What already works vs what you add later</h3>
      <p className={styles.whatIntro}>
        The starter is a real chart <em>UI</em> with bundled FX <em>candles</em>. Opportunity
        rankings and macro copy are <em>demo data</em> on purpose — so you can experiment safely
        before wiring your backend.
      </p>

      <div className={styles.whatGrid}>
        <article className={styles.whatCard}>
          <span className={styles.whatBadgeLive}>Works out of the box</span>
          <h4>Runs as soon as you unzip and npm install</h4>
          <p>No API keys. Candles ship inside the zip; the chart renders immediately.</p>
          <ul>
            {INCLUDED_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className={styles.whatLink} to="/docs/tutorials/chart-with-your-data">
            Load your own data →
          </Link>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeDemo}>Demo only</span>
          <h4>Illustrative opportunities — not investment advice</h4>
          <p>Use the layout and chart wiring; replace the catalog with your product logic.</p>
          <ul>
            {DEMO_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeYours}>You wire this up</span>
          <h4>When you ship your platform</h4>
          <p>Point the feed at your API, stream live prices, then add alerts and execution.</p>
          <ul>
            {YOUR_ITEMS.map((item) => (
              <li key={item.label}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
          <Link className={styles.whatLink} to="/docs/data-connectors/kraken">
            Kraken connector →
          </Link>
        </article>
      </div>
    </section>
  );
}
