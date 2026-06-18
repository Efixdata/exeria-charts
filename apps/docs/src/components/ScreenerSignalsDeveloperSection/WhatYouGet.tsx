// @ts-ignore
// @ts-ignore
import _Link from "@docusaurus/Link";

let Link = _Link as any;

import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const LIVE_ITEMS = [
  "1H SMA cross signals from Binance candles",
  "Mini charts with live price updates",
  "Expandable chart with strategy markers",
  "Filter bar (instrument, time, side, source)",
] as const;

const DEMO_ITEMS = [
  "Mock signal catalog and reasoning copy",
  "Paper trade ticket in the expanded row",
  "Alert / automation settings drawer",
] as const;

const YOUR_ITEMS = [
  {
    label: "Your screener or alert backend",
    href: "/docs/tutorials/live-data-stream",
  },
  {
    label: "Custom strategies and indicators",
    href: "/docs/scripts/strategies/key-strategies",
  },
  {
    label: "Broker or webhook automation",
    href: "/docs/tutorials/trade-from-chart",
  },
] as const;

export default function WhatYouGet() {
  return (
    <section className={styles.whatSection} aria-labelledby="screener-signals-what">
      <h3 id="screener-signals-what">What already works vs what you add later</h3>
      <p className={styles.whatIntro}>
        The live app is a real chart UI with public market data and built-in strategy scripts. Signal
        ranking, copy, and execution hooks are yours to connect.
      </p>

      <div className={styles.whatGrid}>
        <article className={styles.whatCard}>
          <span className={styles.whatBadgeLive}>Live from Binance</span>
          <h4>Works as soon as you run the project</h4>
          <p>Candles, crosses, and mini-chart updates without API keys.</p>
          <ul>
            {LIVE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className={styles.whatLink} to="/docs/data-connectors/binance">
            How Binance data works →
          </Link>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeDemo}>Demo only</span>
          <h4>Illustrative signal feed — not investment advice</h4>
          <p>Use the layout and chart wiring; replace catalog data with your product logic.</p>
          <ul>
            {DEMO_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeYours}>You wire this up</span>
          <h4>When you ship your screener</h4>
          <p>Point filters and rows at your API, then add alerts and execution.</p>
          <ul>
            {YOUR_ITEMS.map((item) => (
              <li key={item.label}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
          <Link className={styles.whatLink} to="/docs/tutorials/live-data-stream">
            Live data stream tutorial →
          </Link>
        </article>
      </div>
    </section>
  );
}
