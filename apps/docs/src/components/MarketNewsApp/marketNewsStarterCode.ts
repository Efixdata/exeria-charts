export const MARKET_NEWS_INTEGRATION_TABS = [
  { id: "embedChart", label: "1 — One chart" },
  { id: "multiInstrument", label: "2 — Compare pairs" },
  { id: "newsFeed", label: "3 — News markers" },
] as const;

export const MARKET_NEWS_SNIPPET_TABS = [
  { id: "articleShell", label: "Article HTML" },
  { id: "articleApp", label: "React article" },
] as const;

export const MARKET_NEWS_SNIPPET_TABS_ALL = [
  ...MARKET_NEWS_INTEGRATION_TABS,
  ...MARKET_NEWS_SNIPPET_TABS,
] as const;

export type MarketNewsCodeTabId = (typeof MARKET_NEWS_SNIPPET_TABS_ALL)[number]["id"];

export const MARKET_NEWS_RUN_LOCALLY_STEPS = `# After downloading and unzipping the starter from this page:

cd exeria-market-news   # or whatever you named the folder
npm install
npm run dev

# Open the URL printed in the terminal (usually http://localhost:5173).
# Edit src/App.tsx — save and the browser refreshes.

# ── Starting from scratch instead? ──
# npm create vite@latest my-market-article -- --template react-ts
# cd my-market-article
# npm install @exeria/charts
# Copy public/data/*.json from the zip, paste a snippet below into src/App.tsx
# npm run dev`;

export function buildMarketNewsStarterCode(): Record<MarketNewsCodeTabId, string> {
  return {
    embedChart: `// Smallest embed — one div, one FX line chart.
// Good first file: paste into any Vite/React/Next page.

import { createChart } from "@exeria/charts";
import eurUsdH1 from "./data/eur-usd-h1.json";

const container = document.getElementById("article-chart");
if (!container) throw new Error("Missing #article-chart");

const chart = createChart({ container });
chart.init();

const candles = eurUsdH1.candles.slice(-168); // last week of H1 bars
await chart.setMainSeriesData(candles, { symbol: "1h", milis: 3_600_000 });
chart.setMainDrawMode("Line");
chart.fit();
chart.moveToEnd();
chart.render();`,

    multiInstrument: `// Compare story — two pairs indexed to 100 at window start.
import { createChart } from "@exeria/charts";

function indexTo100(candles) {
  const anchor = candles[0]?.c ?? 1;
  const scale = 100 / anchor;
  return candles.map((c) => ({
    ...c,
    o: c.o * scale,
    h: c.h * scale,
    l: c.l * scale,
    c: c.c * scale,
  }));
}

const chart = createChart({ container });
chart.init();

const interval = { symbol: "1h", milis: 3_600_000 };
const primary = indexTo100(eurUsdH1.candles.slice(-200));
const overlay = indexTo100(gbpUsdH1.candles.slice(-200));

await chart.setMainSeriesData(primary, interval);
chart.setMainDrawMode("Line");

const overlayId = "overlay-GBP/USD";
chart.getSeriesManager()[overlayId] = {
  seriesId: overlayId,
  data: overlay,
  interval,
};
chart.setInstrumentDrawMode("Line", overlayId);
chart.applyChartInstrumentSettings(overlayId, {
  lineColor: "#d97706",
  lineDash: [5, 4],
});

chart.setValueAxisMode("%");
chart.setAutoScale(true);
chart.fit();
chart.moveToEnd();
chart.render();`,

    newsFeed: `// Headlines as clickable dots on the chart (NEWSFEED script).
import { createChart, setInstrumentNewsFeed } from "@exeria/charts";
import eurUsdH1 from "./data/eur-usd-h1.json";
import newsBundle from "./data/eur-usd-news-feed.json";

const chart = createChart({ container });
chart.init();

const candles = eurUsdH1.candles.slice(-720);
await chart.setMainSeriesData(candles, { symbol: "1h", milis: 3_600_000 });
chart.setMainDrawMode("Line");
await chart.addScript("NEWSFEED");

setInstrumentNewsFeed(newsBundle.events, candles);
await chart.recalculateScripts?.({ rerender: true });
chart.fit();
chart.moveToEnd();
chart.render();`,

    articleShell: `<!-- Drop into your CMS / newsroom template.
     Each chart needs a fixed-height div; captions stay outside the canvas. -->

<article class="story">
  <header>
    <p class="eyebrow">Markets · 4 min read</p>
    <h1>Your headline here</h1>
    <p class="dek">Lead paragraph before the first chart.</p>
  </header>

  <figure>
    <div id="compare-chart" style="height: 320px; width: 100%"></div>
    <figcaption>Fig. 1 — EUR/USD vs GBP/USD, indexed to 100.</figcaption>
  </figure>

  <p>Body copy between charts…</p>

  <figure>
    <div id="news-chart" style="height: 320px; width: 100%"></div>
    <figcaption>Fig. 2 — Macro headlines on the price line.</figcaption>
  </figure>
</article>

<!-- Mount charts from your JS bundle (see React article tab or vanilla embed). -->`,

    articleApp: `// Full article page — start here after npm run dev.
import { useEffect, useRef } from "react";
import { createChart, setInstrumentNewsFeed } from "@exeria/charts";
import eurUsdH1 from "./data/eur-usd-h1.json";
import gbpUsdH1 from "./data/gbp-usd-h1.json";
import newsBundle from "./data/eur-usd-news-feed.json";

const H1 = { symbol: "1h", milis: 3_600_000 };

function indexTo100(candles: typeof eurUsdH1.candles) {
  const anchor = candles[0]?.c ?? 1;
  const scale = 100 / anchor;
  return candles.map((c) => ({
    ...c,
    o: c.o * scale,
    h: c.h * scale,
    l: c.l * scale,
    c: c.c * scale,
  }));
}

function useCompareChart(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart({ container });
    chart.init();

    void (async () => {
      const primary = indexTo100(eurUsdH1.candles.slice(-200));
      const overlay = indexTo100(gbpUsdH1.candles.slice(-200));
      await chart.setMainSeriesData(primary, H1);
      chart.setMainDrawMode("Line");
      const overlayId = "overlay-GBP/USD";
      chart.getSeriesManager()[overlayId] = { seriesId: overlayId, data: overlay, interval: H1 };
      chart.setInstrumentDrawMode("Line", overlayId);
      chart.setValueAxisMode("%");
      chart.setAutoScale(true);
      chart.fit();
      chart.moveToEnd();
      chart.render();
    })();

    return () => chart.destroy();
  }, [containerRef]);
}

export default function App() {
  const compareRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  useCompareChart(compareRef);

  useEffect(() => {
    const container = newsRef.current;
    if (!container) return;

    const chart = createChart({ container });
    chart.init();

    void (async () => {
      const candles = eurUsdH1.candles.slice(-720);
      await chart.setMainSeriesData(candles, H1);
      chart.setMainDrawMode("Line");
      await chart.addScript("NEWSFEED");
      setInstrumentNewsFeed(newsBundle.events, candles);
      await chart.recalculateScripts?.({ rerender: true });
      chart.fit();
      chart.moveToEnd();
      chart.render();
    })();

    return () => chart.destroy();
  }, []);

  return (
    <article style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem", fontFamily: "system-ui" }}>
      <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>Markets</p>
      <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>Dollar softness widens the euro–sterling gap</h1>
      <p>Indexed compare chart and news markers — static JSON, no API keys.</p>

      <figure style={{ margin: "2rem 0" }}>
        <div ref={compareRef} style={{ height: 320, width: "100%" }} />
        <figcaption style={{ fontSize: 14, color: "#555" }}>Fig. 1 — EUR/USD vs GBP/USD</figcaption>
      </figure>

      <figure style={{ margin: "2rem 0" }}>
        <div ref={newsRef} style={{ height: 320, width: "100%" }} />
        <figcaption style={{ fontSize: 14, color: "#555" }}>Fig. 2 — Headlines on the chart</figcaption>
      </figure>
    </article>
  );
}`,
  };
}
