import type { FintechPeriodId } from "./constants";
import { FINTECH_PERIODS } from "./constants";
import { FINTECH_LAYOUT_TREE } from "./fintechIntegrationMapData";
import { getMarketPreset, type FintechMarketId } from "./marketPresets";

export type FintechIntegrationLevelId = "compareChart" | "wealthShell" | "fullApp";

export type FintechSnippetTabId = "layout" | "chartSetup" | "equityData" | "portfolio";

export type FintechCodeTabId = FintechIntegrationLevelId | FintechSnippetTabId;

export const INTEGRATION_LEVEL_TABS: Array<{ id: FintechIntegrationLevelId; label: string }> = [
  { id: "compareChart", label: "1 — Compare chart" },
  { id: "wealthShell", label: "2 — Wealth shell" },
  { id: "fullApp", label: "3 — Full page" },
];

export const SNIPPET_TABS: Array<{ id: FintechSnippetTabId; label: string }> = [
  { id: "layout", label: "File map" },
  { id: "chartSetup", label: "Chart setup" },
  { id: "equityData", label: "Equity CSV" },
  { id: "portfolio", label: "Portfolio model" },
];

function getPeriod(periodId: FintechPeriodId) {
  return FINTECH_PERIODS.find((entry) => entry.id === periodId) ?? FINTECH_PERIODS[2];
}

export function buildFintechStarterCode(
  periodId: FintechPeriodId,
  marketId: FintechMarketId = "equities",
): Record<FintechCodeTabId, string> {
  const period = getPeriod(periodId);
  const market = getMarketPreset(marketId);
  const assetLines = market.assets
    .map(
      (asset) =>
        `  { id: "${asset.id}", symbol: "${asset.symbol}", label: "${asset.label}", color: "${asset.color}" },`,
    )
    .join("\n");
  const primary = market.assets[0];

  return {
    compareChart: `import { useEffect, useRef } from "react";
import { createChart, type ChartInstance } from "@exeria/charts";
import { loadEquityCandles } from "./equityDataLoader";

const ASSETS = [
${assetLines}
];

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart({
      container,
      instrument: { symbol: ASSETS[0].symbol, description: ASSETS[0].label },
      themeVariant: "dark",
    });

    chartRef.current = chart;
    chart.init();
    chart.setMainDrawMode("Line");
    chart.setValueAxisMode("%");

    void (async () => {
      const candles = await loadEquityCandles(ASSETS[0].symbol, "1m");
      await chart.setMainSeriesData(candles, "1d");
      chart.applyChartAppearanceSettings({
        ...chart.getChartAppearanceSettings(),
        background: "#000000",
        gridVisible: false,
        chartLineFillVisible: true,
        chartLineFillMode: "gradient",
      });
      chart.render();
    })();

    return () => chart.destroy();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#000" }}>
      <div ref={containerRef} style={{ width: "100%", height: "min(56vh, 420px)" }} />
    </main>
  );
}`,

    wealthShell: `export function WealthHeader({
  value,
  change,
}: {
  value: string;
  change: string;
}) {
  return (
    <header style={{ padding: "24px 20px 8px", color: "#f5f7fb" }}>
      <p style={{ margin: 0, opacity: 0.72, fontSize: 14 }}>Total portfolio</p>
      <h1 style={{ margin: "6px 0 4px", fontSize: 34, letterSpacing: "-0.03em" }}>{value}</h1>
      <p style={{ margin: 0, color: "#7ce7a5", fontSize: 15 }}>{change}</p>
    </header>
  );
}

export function CashRow({ cash, invested }: { cash: string; invested: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 20px" }}>
      <div>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Available to invest</p>
        <strong>{cash}</strong>
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Invested</p>
        <strong>{invested}</strong>
      </div>
    </div>
  );
}

export function PeriodPills({
  periods,
  active,
  onChange,
}: {
  periods: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "12px 20px", overflowX: "auto" }}>
      {periods.map((period) => (
        <button
          key={period.id}
          type="button"
          onClick={() => onChange(period.id)}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "8px 14px",
            background: active === period.id ? "#f5f7fb" : "#151821",
            color: active === period.id ? "#050608" : "#9aa3b7",
            fontWeight: 600,
          }}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}`,

    fullApp: `import { useEffect, useRef } from "react";
import { createChart } from "@exeria/charts";
import { loadEquityCandles } from "./equityDataLoader";

const ASSETS = [
${assetLines}
];

export default function App() {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    const chart = createChart({
      container,
      instrument: { symbol: ASSETS[0].symbol, description: ASSETS[0].label },
      themeVariant: "dark",
    });

    chart.init();
    chart.setMainDrawMode("Line");
    chart.setValueAxisMode("%");

    void loadEquityCandles(ASSETS[0].symbol, "1m").then((candles) => {
      void chart.setMainSeriesData(candles, "1d").then(() => chart.render());
    });

    return () => chart.destroy();
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "#000", color: "#f5f7fb" }}>
      <header style={{ padding: "24px 20px 8px" }}>
        <p style={{ margin: 0, opacity: 0.72 }}>Nova Wealth</p>
        <h1 style={{ margin: "6px 0 0", fontSize: 34 }}>Portfolio</h1>
      </header>
      <div ref={chartRef} style={{ height: "min(52vh, 420px)" }} />
      <section style={{ padding: "0 20px 24px" }}>
        {ASSETS.map((asset) => (
          <div key={asset.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
            <span style={{ color: asset.color }}>{asset.label}</span>
            <span>{asset.symbol}</span>
          </div>
        ))}
      </section>
    </main>
  );
}`,

    layout: FINTECH_LAYOUT_TREE,

    chartSetup: `// Multi-asset compare chart — mirrors the live demo setup.
// See fintechCompareChartSetup.ts in the docs repo for the full version.

import type { ChartInstance } from "@exeria/charts";

export async function setupCompareChart(chart: ChartInstance, assets, loadCandles) {
  const primary = assets[0];
  const candles = await loadCandles(primary.symbol);
  await chart.setMainSeriesData(candles, "1d");
  chart.setMainDrawMode("Line");
  chart.setValueAxisMode("%");

  chart.applyChartAppearanceSettings({
    ...chart.getChartAppearanceSettings(),
    background: "#000000",
    gridVisible: false,
    chartLineFillVisible: true,
    chartLineFillMode: "gradient",
  });

  // Add overlays for assets[1], assets[2] via chart model / seriesManager
  chart.render();
}`,

    equityData: `// public/data/fintech-equity/{SYMBOL}.csv
// date,open,high,low,close,volume

import type { Candle } from "@exeria/charts";

export async function loadEquityCsv(symbol: string): Promise<Candle[]> {
  const response = await fetch(\`/data/fintech-equity/\${symbol}.csv\`);
  const text = await response.text();
  const lines = text.trim().split("\\n").slice(1);

  return lines.map((line) => {
    const [date, open, high, low, close, volume] = line.split(",");
    return {
      stamp: Date.parse(\`\${date}T00:00:00Z\`),
      o: Number(open),
      h: Number(high),
      l: Number(low),
      c: Number(close),
      v: Number(volume ?? 0),
    };
  });
}

export async function loadEquityCandles(symbol: string, periodId = "1m") {
  const all = await loadEquityCsv(symbol);
  const limits = { "1d": 2, "1w": 7, "1m": 30, "3m": 90, "1y": 180, max: all.length };
  return all.slice(-limits[periodId]);
}`,

    portfolio: `// Portfolio value = cash + sum(quantity × lastClose × eurPerUsd)

export const PORTFOLIO = {
  cashEur: 2840,
  eurPerUsd: 0.92,
  positions: [
    { assetId: "aapl", quantity: 48 },
    { assetId: "vwce", quantity: 72 },
    { assetId: "spy", quantity: 9 },
  ],
};

export function holdingValueEur(quantity: number, lastCloseUsd: number) {
  return quantity * lastCloseUsd * PORTFOLIO.eurPerUsd;
}`,
  };
}

export const RUN_LOCALLY_STEPS = `# After downloading and unzipping the starter from /starters/fintech-integration:

cd exeria-fintech-wealth
npm install
npm run dev

# Open the URL printed in the terminal (usually http://localhost:5173).
# Edit src/App.tsx — save and the browser refreshes.

# Equity CSV fixtures are in public/data/fintech-equity/
# Swap AAPL.csv / VWCE.csv / SPY.csv for your own historical data.

# ── Starting from scratch instead? ──
# npm create vite@latest my-wealth-app -- --template react-ts
# cd my-wealth-app
# npm install @exeria/charts
# Copy snippets/ from the zip, then: npm run dev`;
