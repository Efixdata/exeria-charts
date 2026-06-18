// @ts-ignore
// @ts-ignore
import _Link from "@docusaurus/Link";

let Link = _Link as any;

import styles from "../CryptoTerminalDeveloperSection/cryptoTerminalDeveloperSection.module.css";

const INCLUDED_ITEMS = [
  "FX chart with ChartUI toolbar",
  "Bundled EUR/USD H1 candles (static JSON, no API keys)",
  "WMA / EMA composite preset with buy/sell markers",
  "Equity curve in a secondary pane",
] as const;

const DEMO_ITEMS = [
  "Strategy presets (Bollinger breakout, mean reversion, slow-band)",
  "Multi-pane indicator layout and signal strips",
  "Backtest-style markers — educational, not investment advice",
] as const;

const YOUR_ITEMS = [
  {
    label: "Your historical data or live feed",
    href: "/docs/tutorials/chart-with-your-data",
  },
  {
    label: "Custom indicators and strategy scripts",
    href: "/docs/scripts/programmatic-wiring",
  },
  {
    label: "Production risk rules and execution hooks",
    href: "/docs/tutorials/trade-from-chart",
  },
] as const;

export default function WhatYouGet() {
  return (
    <section className={styles.whatSection} aria-labelledby="quant-analytics-what">
      <h3 id="quant-analytics-what">What already works vs what you add later</h3>
      <p className={styles.whatIntro}>
        The starter is a real chart <em>UI</em> with bundled FX <em>candles</em> and built-in{" "}
        <em>strategy scripts</em>. Preset rankings and equity curves are <em>demo backtests</em> on
        purpose — so you can experiment safely before wiring your data and risk engine.
      </p>

      <div className={styles.whatGrid}>
        <article className={styles.whatCard}>
          <span className={styles.whatBadgeLive}>Works out of the box</span>
          <h4>Runs as soon as you unzip and npm install</h4>
          <p>No API keys. Candles ship inside the zip; indicators wire programmatically.</p>
          <ul>
            {INCLUDED_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className={styles.whatLink} to="/docs/scripts/strategies/overview">
            Built-in strategies →
          </Link>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeDemo}>Demo only</span>
          <h4>Educational backtests — not trading advice</h4>
          <p>Use the layout and script wiring; tune or replace presets with your own logic.</p>
          <ul>
            {DEMO_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className={styles.whatCard}>
          <span className={styles.whatBadgeYours}>You wire this up</span>
          <h4>When you ship your analytics product</h4>
          <p>Point the chart at your data, add proprietary indicators, then connect execution.</p>
          <ul>
            {YOUR_ITEMS.map((item) => (
              <li key={item.label}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
          <Link className={styles.whatLink} to="/docs/tutorials/add-an-indicator">
            Add an indicator tutorial →
          </Link>
        </article>
      </div>
    </section>
  );
}
