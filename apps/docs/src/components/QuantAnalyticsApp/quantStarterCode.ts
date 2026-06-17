import type { ForexTimeframeId } from "../ForexOpportunityApp/forexInstruments";
import { toChartInterval } from "../ForexOpportunityApp/forexInstruments";
import type { QuantPresetId } from "./strategyPresets";
import { findQuantPreset } from "./strategyPresets";
import { DEFAULT_SYMBOL, DEFAULT_TIMEFRAME_ID } from "./constants";

export type QuantIntegrationLevelId = "chartOnly" | "chartUi" | "quantShell";

export type QuantSnippetTabId =
  | "wmaEmaComposite"
  | "bollingerBreakout"
  | "meanReversion"
  | "equityCurve"
  | "programmaticWiring"
  | "integrationMap";

export type QuantCodeTabId = QuantIntegrationLevelId | QuantSnippetTabId;

export const QUANT_INTEGRATION_LEVEL_TABS: Array<{ id: QuantIntegrationLevelId; label: string }> = [
  { id: "chartOnly", label: "1 — Minimal chart" },
  { id: "chartUi", label: "2 — Chart + toolbar" },
  { id: "quantShell", label: "3 — Dashboard shell" },
];

export const QUANT_SNIPPET_TABS: Array<{ id: QuantSnippetTabId; label: string }> = [
  { id: "wmaEmaComposite", label: "WMA / EMA composite" },
  { id: "bollingerBreakout", label: "Bollinger breakout" },
  { id: "meanReversion", label: "Mean reversion" },
  { id: "equityCurve", label: "Equity curve" },
  { id: "programmaticWiring", label: "Script wiring" },
  { id: "integrationMap", label: "File map" },
];

export const RUN_LOCALLY_STEPS = `# After downloading and unzipping the starter from this page:

cd exeria-quant-analytics   # or whatever you named the folder
npm install
npm run dev

# Open the URL printed in the terminal (usually http://localhost:5173).
# Edit src/App.tsx — save and the browser refreshes.

# ── Starting from scratch instead? ──
# npm create vite@latest my-quant-dashboard -- --template react-ts
# cd my-quant-dashboard
# npm install @efixdata/exeria-chart @efixdata/exeria-chart-ui-react
# Paste a snippet from the starter page into src/App.tsx, then: npm run dev`;

function pairSlug(symbol: string): string {
  return symbol.toLowerCase().replace("/", "-");
}

function datasetPath(symbol: string, timeframeId: ForexTimeframeId): string {
  return `/data/${pairSlug(symbol)}-${timeframeId}.json`;
}

const WIRING_HELPERS = `function getSeriesRef(chart: any, field: string) {
  const series: any = Object.values(chart.getSeriesManager()).find(
    (candidate: any) => candidate.seriesId && candidate.fields.includes(field),
  );
  return \`\${series.seriesId}:\${field}\`;
}

function getScriptOutputRef(chart: any, scriptKey: string, field: string, index = 0) {
  const scripts = (chart.model?.scripts ?? []).filter((entry: any) => entry.key === scriptKey);
  const script = scripts[index];
  const seriesManager = chart.getSeriesManager();

  for (const seriesId of Object.values(script.outputs ?? {}) as string[]) {
    const series = seriesManager[seriesId];
    if (series?.fields?.includes(field)) {
      return \`\${seriesId}:\${field}\`;
    }
  }

  throw new Error(\`Missing \${scriptKey} output \${field}\`);
}`;

export function buildQuantStarterSnippet(
  presetId: QuantPresetId,
  symbol: string,
  timeframeId: ForexTimeframeId,
): string {
  const preset = findQuantPreset(presetId);
  const interval = toChartInterval(timeframeId);
  const dataUrl = datasetPath(symbol, timeframeId);

  const presetBlocks: Record<QuantPresetId, string> = {
    macdCrossover: `  const close = getSeriesRef(chart, "c");

  const wma = structuredClone(chart.getScripts().WMA);
  wma.inputs.PERIODS.value = 14;
  await chart.addScript("WMA", wma);

  const ema = structuredClone(chart.getScripts().EMA);
  ema.inputs.PERIODS.value = 28;
  await chart.addScript("EMA", ema);

  const emaRef = getSeriesRef(chart, "EMA");
  const wmaRef = getSeriesRef(chart, "WMAValue");

  const greaterLessBuy = structuredClone(chart.getScripts().GREATERLESS);
  greaterLessBuy.inputs.LINE1.value = close;
  greaterLessBuy.inputs.LINE2.value = emaRef;
  greaterLessBuy.inputs.CHOICE.value = "greater than";
  greaterLessBuy.inputs.RT.value = "Buy";
  greaterLessBuy.pane = "new";
  await chart.addScript("GREATERLESS", greaterLessBuy);

  const greaterLessPane = chart.getChartPanels().at(-1)?.id;

  const greaterLessSell = structuredClone(chart.getScripts().GREATERLESS);
  greaterLessSell.inputs.LINE1.value = close;
  greaterLessSell.inputs.LINE2.value = emaRef;
  greaterLessSell.inputs.CHOICE.value = "less than";
  greaterLessSell.inputs.RT.value = "Sell";
  greaterLessSell.pane = greaterLessPane;
  await chart.addScript("GREATERLESS", greaterLessSell);

  const greaterLessBuyRef = getScriptOutputRef(chart, "GREATERLESS", "GreaterLess", 0);
  const greaterLessSellRef = getScriptOutputRef(chart, "GREATERLESS", "GreaterLess", 1);

  const cross = structuredClone(chart.getScripts().CROSS);
  cross.inputs.LINE.value = close;
  cross.inputs.SIGNAL.value = wmaRef;
  cross.inputs.ONDN.value = "Sell";
  cross.inputs.ONUP.value = "Buy";
  cross.pane = "new";
  await chart.addScript("CROSS", cross);

  const crossRef = getScriptOutputRef(chart, "CROSS", "CrossValue", 0);

  const doubleCheckBuy = structuredClone(chart.getScripts().DOUBLECHECK);
  doubleCheckBuy.inputs.FIRST.value = greaterLessBuyRef;
  doubleCheckBuy.inputs.SECOND.value = crossRef;
  await chart.addScript("DOUBLECHECK", doubleCheckBuy);

  const doubleCheckSell = structuredClone(chart.getScripts().DOUBLECHECK);
  doubleCheckSell.inputs.FIRST.value = greaterLessSellRef;
  doubleCheckSell.inputs.SECOND.value = crossRef;
  await chart.addScript("DOUBLECHECK", doubleCheckSell);

  const doubleCheckBuyRef = getScriptOutputRef(chart, "DOUBLECHECK", "Double", 0);
  const doubleCheckSellRef = getScriptOutputRef(chart, "DOUBLECHECK", "Double", 1);

  const join = structuredClone(chart.getScripts().JOIN);
  join.inputs.FIRST.value = doubleCheckBuyRef;
  join.inputs.SECOND.value = doubleCheckSellRef;
  await chart.addScript("JOIN", join);`,
    bollingerBreakout: `  await chart.addScript("BBAND");

  const exceed = structuredClone(chart.getScripts().EXCEED);
  const close = getSeriesRef(chart, "c");
  exceed.inputs.UPPER.value = getSeriesRef(chart, "BBUpper");
  exceed.inputs.LOWER.value = getSeriesRef(chart, "BBLower");
  exceed.inputs.HIGH.value = close;
  exceed.inputs.LOW.value = close;
  await chart.addScript("EXCEED", exceed);`,
    meanReversion: `  await chart.addScript("BBAND");

  const rebound = structuredClone(chart.getScripts().REBOUND);
  const close = getSeriesRef(chart, "c");
  rebound.inputs.UPPER.value = getSeriesRef(chart, "BBUpper");
  rebound.inputs.LOWER.value = getSeriesRef(chart, "BBLower");
  rebound.inputs.VALUE.value = close;
  await chart.addScript("REBOUND", rebound);`,
    slowBandReversion: `  const bband = structuredClone(chart.getScripts().BBAND);
  bband.inputs.PERIODS.value = 20;
  await chart.addScript("BBAND", bband);

  const rebound = structuredClone(chart.getScripts().REBOUND);
  const close = getSeriesRef(chart, "c");
  rebound.inputs.UPPER.value = getSeriesRef(chart, "BBUpper");
  rebound.inputs.LOWER.value = getSeriesRef(chart, "BBLower");
  rebound.inputs.VALUE.value = close;
  await chart.addScript("REBOUND", rebound);`,
  };

  return `import { createChart } from "@efixdata/exeria-chart";

${WIRING_HELPERS}

export async function mountQuantDashboard(container: HTMLElement) {
  const chart = createChart({
    container,
    instrument: { symbol: "${symbol}", description: "${symbol}", tradable: true },
    themeVariant: "dark",
  });
  chart.init();

  const response = await fetch("${dataUrl}");
  const payload = await response.json();
  await chart.setMainSeriesData(payload.candles, ${JSON.stringify(interval)});

${presetBlocks[presetId]}

  const equity = structuredClone(chart.getScripts().EQUITY);
  equity.inputs.STRATEGY.value = ${
    presetId === "macdCrossover"
      ? 'getScriptOutputRef(chart, "JOIN", "Join", 0)'
      : `getSeriesRef(chart, "${preset.strategyField}")`
  };
  equity.inputs.PRICE.value = getSeriesRef(chart, "c");
  equity.inputs.SPREAD.value = 0;
  equity.inputs.COMMISION.value = 0;
  equity.inputs.INITEQ.value = 0;
  equity.inputs.LOTSIZE.value = 100000;
  await chart.addScript("EQUITY", equity);

  await chart.recalculateScripts?.({ rerender: true });
  return chart;
}`;
}

export function buildQuantStarterCode(
  symbol = DEFAULT_SYMBOL,
  timeframeId: ForexTimeframeId = DEFAULT_TIMEFRAME_ID,
): Record<QuantCodeTabId, string> {
  const interval = toChartInterval(timeframeId);
  const dataUrl = datasetPath(symbol, timeframeId);
  const pairSlugValue = pairSlug(symbol);

  return {
    chartOnly: `import { useEffect, useRef } from "react";
import { createChart } from "@efixdata/exeria-chart";

const SYMBOL = "${symbol}";
const INTERVAL = ${JSON.stringify(interval)};

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart({
      container,
      instrument: { symbol: SYMBOL, description: SYMBOL },
      themeVariant: "dark",
    });

    chart.init();
    chart.setMainDrawMode("OHLC");

    void (async () => {
      const response = await fetch("${dataUrl}");
      const payload = (await response.json()) as { candles: unknown[] };
      await chart.setMainSeriesData(payload.candles, INTERVAL);
      chart.fit();
    })();

    return () => chart.destroy();
  }, []);

  return (
    <main style={{ height: "100vh", background: "#0b1220" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </main>
  );
}`,

    chartUi: `import { useEffect, useRef, useState } from "react";
import { type ChartInstance } from "@efixdata/exeria-chart";
import { ChartUI } from "@efixdata/exeria-chart-ui-react";
import { mountQuantDashboard } from "./mountQuantDashboard";

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let instance: ChartInstance | null = null;

    void (async () => {
      instance = await mountQuantDashboard(container);
      if (!disposed) setChart(instance);
    })();

    return () => {
      disposed = true;
      instance?.destroy();
    };
  }, []);

  return (
    <main style={{ height: "100vh", background: "#0b1220" }}>
      <ChartUI chart={chart}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </ChartUI>
    </main>
  );
}`,

    quantShell: `import { useEffect, useRef, useState } from "react";
import { createChart, type ChartInstance } from "@efixdata/exeria-chart";
import { ChartUI } from "@efixdata/exeria-chart-ui-react";
import { mountQuantDashboard } from "./mountQuantDashboard";

const PRESETS = [
  { id: "wma-ema", label: "WMA / EMA composite" },
  { id: "bollinger", label: "Bollinger breakout" },
  { id: "reversion", label: "Band mean reversion" },
] as const;

export default function QuantDashboard() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [presetId, setPresetId] = useState(PRESETS[0].id);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let instance: ChartInstance | null = null;

    void (async () => {
      instance?.destroy();
      instance = await mountQuantDashboard(container);
      if (!disposed) setChart(instance);
    })();

    return () => {
      disposed = true;
      instance?.destroy();
    };
  }, [presetId]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "100vh" }}>
      <aside style={{ padding: "1rem", background: "#111827", color: "#e5e7eb" }}>
        <h2 style={{ fontSize: "0.85rem", letterSpacing: "0.08em" }}>STRATEGY MODEL</h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          Pick a preset — indicators and rules load on the chart.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0" }}>
          {PRESETS.map((preset) => (
            <li key={preset.id} style={{ marginBottom: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setPresetId(preset.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: preset.id === presetId ? "1px solid #7c3aed" : "1px solid #374151",
                  background: preset.id === presetId ? "#1f2937" : "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                {preset.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <ChartUI chart={chart}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </ChartUI>
    </div>
  );
}`,

    wmaEmaComposite: buildQuantStarterSnippet("macdCrossover", symbol, timeframeId),

    bollingerBreakout: buildQuantStarterSnippet("bollingerBreakout", symbol, timeframeId),

    meanReversion: buildQuantStarterSnippet("meanReversion", symbol, timeframeId),

    equityCurve: `import { createChart } from "@efixdata/exeria-chart";

${WIRING_HELPERS}

// After your strategy script is on the chart, add EQUITY in a new pane:
export async function attachEquityCurve(chart, strategyFieldRef) {
  const equity = structuredClone(chart.getScripts().EQUITY);
  equity.inputs.STRATEGY.value = strategyFieldRef;
  equity.inputs.PRICE.value = getSeriesRef(chart, "c");
  equity.inputs.SPREAD.value = 0;
  equity.inputs.COMMISION.value = 0;
  equity.inputs.INITEQ.value = 0;
  equity.inputs.LOTSIZE.value = 100000;
  equity.pane = "new";
  await chart.addScript("EQUITY", equity);
  await chart.recalculateScripts?.({ rerender: true });
}

// Example: strategyFieldRef = getScriptOutputRef(chart, "JOIN", "Join", 0)
//          or getSeriesRef(chart, "ExceedValue") for Bollinger breakout`,

    programmaticWiring: `// Built-in scripts expose inputs you wire with string refs like "series-a:c".
// Clone the template from chart.getScripts(), set inputs, then chart.addScript(key, clone).

import { createChart } from "@efixdata/exeria-chart";

${WIRING_HELPERS}

export async function wireCrossStrategy(chart) {
  await chart.addScript("WMA");
  await chart.addScript("EMA");

  const cross = structuredClone(chart.getScripts().CROSS);
  cross.inputs.LINE.value = getSeriesRef(chart, "c");
  cross.inputs.SIGNAL.value = getSeriesRef(chart, "WMAValue");
  cross.inputs.ONUP.value = "Buy";
  cross.inputs.ONDN.value = "Sell";
  await chart.addScript("CROSS", cross);

  return getScriptOutputRef(chart, "CROSS", "CrossValue", 0);
}

// Tips:
// - structuredClone(chart.getScripts().KEY) — never mutate the template in place
// - pane: "new" — opens a sub-pane for oscillators or signal strips
// - await chart.recalculateScripts({ rerender: true }) — refresh after wiring`,

    integrationMap: `QuantAnalyticsApp/              (live demo in this docs repo)
  index.tsx                     — shell, pair/timeframe controls, preset sidebar
  QuantChartHost.tsx            — ChartUI + static FX bundles
  strategyPresets.ts            — preset labels and script lists
  applyQuantPreset.ts           — wires indicators + strategy per preset
  quantChartHelpers.ts          — addScript, pane layout helpers
  quantStarterCode.ts           — copy-paste snippets for this page
  clearQuantScripts.ts          — reset scripts when switching presets

ForexOpportunityApp/data/
  ${pairSlugValue}-${timeframeId}.json   — bundled OHLC candles (no API keys)

Docs:
  /docs/scripts/strategies/overview     — built-in strategy keys
  /docs/scripts/programmatic-wiring     — wiring inputs and outputs
  /docs/tutorials/add-an-indicator      — add overlays step by step`,
  };
}
