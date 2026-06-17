export type ForexIntegrationLevelId = "chartOnly" | "chartUi" | "opportunityShell";

export type ForexSnippetTabId =
  | "strategies"
  | "publishNews"
  | "opportunityFeed"
  | "wireBackend"
  | "integrationMap";

export type ForexCodeTabId = ForexIntegrationLevelId | ForexSnippetTabId;

export const FOREX_INTEGRATION_LEVEL_TABS: Array<{ id: ForexIntegrationLevelId; label: string }> = [
  { id: "chartOnly", label: "1 — Minimal chart" },
  { id: "chartUi", label: "2 — Chart + toolbar" },
  { id: "opportunityShell", label: "3 — Radar shell" },
];

export const FOREX_SNIPPET_TABS: Array<{ id: ForexSnippetTabId; label: string }> = [
  { id: "strategies", label: "Strategies" },
  { id: "publishNews", label: "News on chart" },
  { id: "opportunityFeed", label: "Opportunity feed" },
  { id: "wireBackend", label: "Wire backend" },
  { id: "integrationMap", label: "File map" },
];

export const RUN_LOCALLY_STEPS = `# After downloading and unzipping the starter from this page:

cd exeria-fx-radar   # or whatever you named the folder
npm install
npm run dev

# Open the URL printed in the terminal (usually http://localhost:5173).
# Edit src/App.tsx — save and the browser refreshes.

# ── Starting from scratch instead? ──
# npm create vite@latest my-fx-radar -- --template react-ts
# cd my-fx-radar
# npm install @efixdata/exeria-chart @efixdata/exeria-chart-ui-react
# Paste a snippet from the starter page into src/App.tsx, then: npm run dev`;

export function buildForexStarterCode(): Record<ForexCodeTabId, string> {
  return {
    chartOnly: `import { useEffect, useRef } from "react";
import { createChart } from "@efixdata/exeria-chart";

const SYMBOL = "EUR/USD";
const INTERVAL = { symbol: "15m", milis: 900_000 };

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart({
      container,
      instrument: { symbol: SYMBOL, description: "Euro / US Dollar" },
      themeVariant: "light",
    });

    chart.init();
    chart.setMainDrawMode("OHLC");

    void (async () => {
      const response = await fetch("/data/eur-usd-m15.json");
      const payload = (await response.json()) as { candles: unknown[] };
      await chart.setMainSeriesData(
        payload.candles as Parameters<typeof chart.setMainSeriesData>[0],
        INTERVAL,
      );
      chart.fit();
    })();

    return () => chart.destroy();
  }, []);

  return (
    <main style={{ height: "100vh", background: "#f0f3fa" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </main>
  );
}`,

    chartUi: `import { useEffect, useRef, useState } from "react";
import { createChart, type ChartInstance } from "@efixdata/exeria-chart";
import { ChartUI } from "@efixdata/exeria-chart-ui-react";

const SYMBOL = "EUR/USD";
const INTERVAL = { symbol: "15m", milis: 900_000 };

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    const instance = createChart({
      container,
      instrument: { symbol: SYMBOL, description: "Euro / US Dollar" },
      themeVariant: "light",
    });

    instance.init();
    instance.setMainDrawMode("OHLC");

    void (async () => {
      const response = await fetch("/data/eur-usd-m15.json");
      const payload = (await response.json()) as { candles: unknown[] };
      await instance.setMainSeriesData(
        payload.candles as Parameters<typeof instance.setMainSeriesData>[0],
        INTERVAL,
      );
      await instance.addScript("NEWSFEED");
      instance.fit();
      if (!disposed) setChart(instance);
    })();

    return () => {
      disposed = true;
      instance.destroy();
    };
  }, []);

  return (
    <main style={{ height: "100vh", background: "#f0f3fa" }}>
      <ChartUI chart={chart}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </ChartUI>
    </main>
  );
}`,

    opportunityShell: `import { useEffect, useRef } from "react";
import { createChart } from "@efixdata/exeria-chart";
import { ChartUI } from "@efixdata/exeria-chart-ui-react";

export default function FxOpportunityRadar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart({ container, themeVariant: "light" });
    chartRef.current = chart;
    chart.init();
    // load candles, apply chartScene from your opportunity API, render news dots

    return () => chart.destroy();
  }, []);

  return (
    <div className="fx-shell">
      <OpportunityFeed /* left rail — arb, rare, signals, events */ />
      <ChartUI chart={chartRef.current}>
        <div ref={containerRef} style={{ height: "100%" }} />
        <NewsChartCallout /* expand news dots on click */ />
      </ChartUI>
      <OpportunityBrief /* right rail — thesis + confluence */ />
    </div>
  );
}`,

    strategies: `import { createChart } from "@efixdata/exeria-chart";

export async function mountSignalChart(container: HTMLElement, candles, interval) {
  const chart = createChart({ container, themeVariant: "dark" });
  chart.init();
  await chart.setMainSeriesData(candles, interval);

  await chart.addScript("MACD");
  const cross = structuredClone(chart.getScripts().CROSS);
  cross.inputs.LINE.value = "series-a:MACDLine";
  cross.inputs.SIGNAL.value = "series-a:MACDSignal";
  await chart.addScript("CROSS", cross);

  await chart.addScript("BBAND");
  const exceed = structuredClone(chart.getScripts().EXCEED);
  exceed.inputs.UPPER.value = "series-a:BBUpper";
  exceed.inputs.LOWER.value = "series-a:BBLower";
  exceed.inputs.HIGH.value = "series-a:c";
  exceed.inputs.LOW.value = "series-a:c";
  await chart.addScript("EXCEED", exceed);

  chart.fit();
  return chart;
}`,

    publishNews: `import type { ChartInstance, Candle, NewsFeedRecord } from "@efixdata/exeria-chart";

// 1) Add the NEWSFEED indicator to the chart
await chart.addScript("NEWSFEED");

// 2) Push your API records into the chart runtime
import { setInstrumentNewsFeed } from "@efixdata/exeria-chart";

const records: NewsFeedRecord[] = await fetch("/api/news?instrument=EUR/USD").then((r) => r.json());
setInstrumentNewsFeed(records, candles);
await chart.recalculateScripts?.({ rerender: true });

// 3) Optional: draw release line + impact zone when user clicks a dot
// See NewsChartCallout.tsx in the docs app for overlay positioning`,

    opportunityFeed: `type Opportunity = {
  id: string;
  category: "arb" | "rare" | "signal" | "event";
  title: string;
  edgeLabel: string;
  linkedNewsId?: string;
};

export function OpportunityFeed({
  items,
  selectedId,
  onSelect,
}: {
  items: Opportunity[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" aria-pressed={item.id === selectedId} onClick={() => onSelect(item.id)}>
            <span>{item.category}</span>
            <strong>{item.title}</strong>
            <span>{item.edgeLabel}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// Selecting an item should sync instrument, timeframe, and chartScene — see applyArbSignalScene.ts`,

    wireBackend: `// Swap static JSON bundles for a live connector when you are ready.

import { KrakenAdapter } from "@efixdata/connector-kraken";

const liveAdapter = new KrakenAdapter();
const chart = createChart({ container, dataAdapter: liveAdapter });
chart.init();
await chart.loadData("EUR/USD", { interval: "15m", limit: 1000 });

// Opportunity scorer → GET /api/opportunities → OpportunityFeed
// News API → NewsFeedRecord[] → setInstrumentNewsFeed(records, candles)`,

    integrationMap: `ForexOpportunityApp/          (live demo in this docs repo)
  index.tsx                   — shell, theme toggle, mobile tabs
  ForexChartHost.tsx          — ChartUI + static FX bundles
  data/*.json                 — 1000-bar M15/H1 candles per pair
  data/arb-signals-feed.json  — opportunity records + chartScene recipes
  applyArbSignalScene.ts      — apply scene when user picks an opportunity
  forexNewsIndicator.ts       — NEWSFEED wiring + sync
  OpportunityFeed.tsx         — left rail discovery
  OpportunityBrief.tsx        — thesis, confluence, arb math
  NewsChartCallout.tsx        — expand news dots on click`,
  };
}
