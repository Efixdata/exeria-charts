"use client";

import { useState } from "react";
import { TERMINAL_UI_FONT_VARS } from "../CryptoTerminalApp/terminalTypography";
import CompareChartEmbed from "./CompareChartEmbed";
import DemoBanner from "./DemoBanner";
import NewsChartEmbed from "./NewsChartEmbed";
import SidebarPanel from "./SidebarPanel";
import { MarketNewsThemeProvider } from "./MarketNewsThemeContext";
import { MARKET_NEWS_BRAND, type MarketNewsPeriodId } from "./constants";
import type { MarketNewsLayoutTheme } from "./marketNewsTheme";
import { useMarketNewsLayout } from "./useMarketNewsLayout";
import styles from "./marketNewsApp.module.css";

export default function MarketNewsApp() {
  useMarketNewsLayout();
  const [periodId, setPeriodId] = useState<MarketNewsPeriodId>("1m");
  const [layoutTheme, setLayoutTheme] = useState<MarketNewsLayoutTheme>("light");

  const shellClass = layoutTheme === "dark" ? styles.shellDark : styles.shell;

  return (
    <MarketNewsThemeProvider theme={layoutTheme}>
      <div className={shellClass} style={TERMINAL_UI_FONT_VARS}>
        <DemoBanner />

        <header className={styles.masthead}>
          <div className={styles.mastheadInner}>
            <div className={styles.brand}>{MARKET_NEWS_BRAND}</div>
            <div className={styles.mastheadRight}>
              <nav className={styles.nav} aria-label="Sections">
                <span>Markets</span>
                <span>FX</span>
                <span>Macro</span>
                <span>Analysis</span>
              </nav>
              <button
                type="button"
                className={styles.themeToggle}
                onClick={() => setLayoutTheme((current) => (current === "light" ? "dark" : "light"))}
                aria-pressed={layoutTheme === "dark"}
              >
                {layoutTheme === "light" ? "Dark" : "Light"}
              </button>
            </div>
          </div>
        </header>

        <div className={styles.layout}>
          <article className={styles.article}>
            <p className={styles.eyebrow}>Markets · 4 min read</p>
            <h1 className={styles.title}>
              Dollar softness widens the gap between euro and sterling
            </h1>
            <p className={styles.dek}>
              Major FX pairs are diverging again as readers expect context, not just quotes. Embed a
              compare chart and headline markers directly inside your story.
            </p>
            <p className={styles.byline}>
              By Market Pulse desk · Demo article · Static H1 fixtures from Exeria FX bundles
            </p>

            <div className={styles.bodyCopy}>
              <p>
                When two currencies share the same catalyst but move differently, a single price chart
                is not enough. Index both series to 100 at the start of the window and let readers see
                relative strength at a glance — without leaving the article.
              </p>

              <CompareChartEmbed periodId={periodId} onPeriodChange={setPeriodId} />

              <p className={styles.pullQuote}>
                “Charts should explain the paragraph above them, not compete with it.”
              </p>

              <p>
                The compare block above uses the same EUR/USD and GBP/USD hourly bundles that power
                the FX Opportunity Radar demo. Swap the JSON for your CMS feed when you are ready.
              </p>

              <h2 className={styles.sectionHeading}>When news hits, show it on the chart</h2>
              <p>
                Macro desks still publish headlines — the difference is whether price context travels
                with the story. Map your news API into <code>NewsFeedRecord[]</code>, add the{" "}
                <code>NEWSFEED</code> indicator, and let readers click a release to see the move.
              </p>

              <NewsChartEmbed />

              <p>
                This pattern keeps the chart footprint small: no trading toolbar, no order ticket —
                just the canvas, your caption, and optional callout UI you control.
              </p>
            </div>
          </article>

          <SidebarPanel />
        </div>
      </div>
    </MarketNewsThemeProvider>
  );
}
