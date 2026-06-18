import Link from "@docusaurus/Link";
import styles from "./cryptoTerminalDeveloperSection.module.css";

const LIVE_ITEMS = [
  "Chart candles and indicators",
  "Markets list with live prices",
  "Order book (depth)",
  "Trade tape (recent trades)",
] as const;

const DEMO_ITEMS = [
  "Buy / sell ticket and limit orders",
  "Open orders and positions lists",
  "Lines drawn on the chart for orders",
] as const;

const YOUR_ITEMS = [
  {
    label: "Real order execution",
    href: "/docs/tutorials/trade-from-chart",
  },
  {
    label: "Your own login, accounts, and risk rules",
    href: "/docs/tutorials/trade-from-chart",
  },
  {
    label: "Optional: private data feeds instead of Binance",
    href: "/docs/data-connectors/overview",
  },
] as const;

export default function WhatYouGet() {
  return (
    <section className={styles.whatSection} aria-labelledby="crypto-terminal-what">
      <h3 id="crypto-terminal-what">What already works vs what you add later</h3>
      <p className={styles.whatIntro}>
        The starter is a real trading <em>UI</em> with real market <em>data</em>. Trading{" "}
        <em>execution</em> is fake on purpose — so you can experiment safely before connecting your
        broker.
      </p>

      <div className={styles.whatGrid}>
        <article className={styles.whatCard}>
          <span className={styles.whatBadgeLive}>Live from Binance</span>
          <h4>Works as soon as you run the project</h4>
          <p>No API keys. Public market data streams into the app automatically.</p>
          <ul>
            {LIVE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className={styles.whatLink || ""} to="/docs/data-connectors/binance">
            How Binance data works →
          </Link>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeDemo}>Demo only</span>
          <h4>Paper trading — nothing hits a real exchange</h4>
          <p>Orders and positions live in browser memory. Great for UI tweaks and flows.</p>
          <ul>
            {DEMO_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeYours}>You wire this up</span>
          <h4>When you are ready for production</h4>
          <p>Replace the simulated order logic with your backend or broker API.</p>
          <ul>
            {YOUR_ITEMS.map((item) => (
              <li key={item.label}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
          <Link className={styles.whatLink || ""} to="/docs/tutorials/trade-from-chart">
            Trade from chart tutorial →
          </Link>
        </article>
      </div>
    </section>
  );
}
