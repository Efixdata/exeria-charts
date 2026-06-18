import Link from "@docusaurus/Link";
import styles from "./fintechWealthDeveloperSection.module.css";

const INCLUDED_ITEMS = [
  "Multi-asset compare chart (% axis)",
  "Portfolio value from positions × price",
  "Cash + invested breakdown",
  "Equity CSV fixtures (AAPL, VWCE, SPY)",
  "Holdings list and allocation ring pattern",
] as const;

const DEMO_ITEMS = [
  "Mock user name and savings goal",
  "Watchlist radar cards",
  "Bottom navigation (decorative)",
] as const;

const YOUR_ITEMS = [
  {
    label: "Your equity or fund data connector",
    href: "/docs/data-connectors/massive",
  },
  {
    label: "Real positions from your core banking API",
    href: "/docs/tutorials/chart-with-your-data",
  },
  {
    label: "Branded light theme for traditional banks",
    href: "/docs/tutorials/custom-theme",
  },
] as const;

export default function WhatYouGet() {
  return (
    <section className={styles.whatSection} aria-labelledby="fintech-wealth-what">
      <h3 id="fintech-wealth-what">What already works vs what you add later</h3>
      <p className={styles.whatIntro}>
        The starter is a consumer <em>wealth UI</em> with chart runtime and static equity fixtures.
        Toggle <strong>Crypto</strong> in the live demo for live Binance data — wire your own feed
        when you go to production.
      </p>

      <div className={styles.whatGrid}>
        <article className={styles.whatCard}>
          <span className={styles.whatBadgeLive}>In the starter ZIP</span>
          <h4>Works as soon as you run the project</h4>
          <p>No API keys for equities — CSV files ship in the zip under public/data/.</p>
          <ul>
            {INCLUDED_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className={styles.whatLink || ""} to="/docs/chart-usage/multi-instrument-charts">
            Multi-instrument charts →
          </Link>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeDemo}>Demo chrome</span>
          <h4>Product polish — replace with your brand</h4>
          <p>Decorative UI that shows layout patterns retail users expect.</p>
          <ul>
            {DEMO_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeYours}>You wire this up</span>
          <h4>When you are ready for production</h4>
          <p>Swap CSV fixtures for your CMS, market data API, or custodian feed.</p>
          <ul>
            {YOUR_ITEMS.map((item) => (
              <li key={item.label}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
          <Link className={styles.whatLink || ""} to="/docs/getting-started/nextjs-app-router">
            Next.js quickstart →
          </Link>
        </article>
      </div>
    </section>
  );
}
