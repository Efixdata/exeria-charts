import type { TimeframeId } from "./constants";
import { TIMEFRAMES, WATCHLIST_SYMBOLS } from "./constants";
import { LAYOUT_TREE } from "./integrationMapData";

export type IntegrationLevelId = "chartOnly" | "chartUi" | "fullTerminal";

export type CodeTabId =
  | IntegrationLevelId
  | "layout"
  | "chart"
  | "data"
  | "trade";

export const INTEGRATION_LEVEL_TABS: Array<{ id: IntegrationLevelId; label: string }> = [
  { id: "chartOnly", label: "1 — Minimal chart" },
  { id: "chartUi", label: "2 — Chart + toolbar" },
  { id: "fullTerminal", label: "3 — Multi-panel app" },
];

export const SNIPPET_TABS: Array<{ id: Exclude<CodeTabId, IntegrationLevelId>; label: string }> = [
  { id: "layout", label: "File map" },
  { id: "chart", label: "Chart lifecycle" },
  { id: "data", label: "Binance data" },
  { id: "trade", label: "Orders (demo)" },
];

function getInterval(timeframeId: TimeframeId): string {
  return TIMEFRAMES.find((tf) => tf.id === timeframeId)?.interval ?? "1d";
}

export function buildStarterCode(symbol: string, timeframeId: TimeframeId): Record<CodeTabId, string> {
  const interval = getInterval(timeframeId);
  const pair = WATCHLIST_SYMBOLS.find((item) => item.id === symbol)?.pair ?? symbol;

  return {
    chartOnly: `import { useEffect, useRef } from "react";
import { createChart } from "@efixdata/exeria-chart";
import { BinanceAdapter } from "@efixdata/connector-binance";

const SYMBOL = "${symbol}";
const INTERVAL = "${interval}";

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const adapter = new BinanceAdapter();
    const chart = createChart({
      container,
      instrument: { symbol: SYMBOL, description: "${pair}" },
      themeVariant: "dark",
      dataAdapter: adapter,
    });

    chart.init();
    chart.setMainDrawMode("OHLC");

    void (async () => {
      await chart.loadData(SYMBOL, { interval: INTERVAL, limit: 1000 });
      chart.subscribeToUpdates(SYMBOL);
    })();

    return () => {
      chart.unsubscribeFromUpdates();
      adapter.disconnect?.();
      chart.destroy();
    };
  }, []);

  return (
    <main style={{ height: "100vh", background: "#0b0e14" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </main>
  );
}`,

    chartUi: `import { useEffect, useRef, useState } from "react";
import { createChart, type ChartInstance } from "@efixdata/exeria-chart";
import { ChartUI } from "@efixdata/exeria-chart-ui-react";
import { BinanceAdapter } from "@efixdata/connector-binance";

const SYMBOL = "${symbol}";
const INTERVAL = "${interval}";

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    const adapter = new BinanceAdapter();
    const instance = createChart({
      container,
      instrument: { symbol: SYMBOL, description: "${pair}" },
      themeVariant: "dark",
      dataAdapter: adapter,
    });

    instance.init();
    instance.setMainDrawMode("OHLC");

    void (async () => {
      await instance.loadData(SYMBOL, { interval: INTERVAL, limit: 1000 });
      instance.addScript("EMA");
      instance.addScript("RSI");
      instance.subscribeToUpdates(SYMBOL);
      if (!disposed) setChart(instance);
    })();

    return () => {
      disposed = true;
      instance.unsubscribeFromUpdates();
      adapter.disconnect?.();
      instance.destroy();
    };
  }, []);

  return (
    <main style={{ height: "100vh", background: "#0b0e14" }}>
      <ChartUI chart={chart}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </ChartUI>
    </main>
  );
}`,

    fullTerminal: `// Full terminal shell — copy from docs starter or fork the layout tree.
// Key modules (see Layout tab):
//   CryptoTerminalChartHost  — isolated chart + Binance ticks
//   WatchlistPanel           — markets + 24h stats (REST)
//   RightDock                — trade ticket, depth, tape, orders
//   mockMarketData.ts        — simulated L2 + tape until you wire WS
//   resolveChartClickPrice   — click chart → limit price

import CryptoTerminalApp from "./CryptoTerminalApp";

export default function App() {
  return <CryptoTerminalApp />;
}

// Wire your broker in RightDock.onPlaceOrder:
// 1. Replace simulated state with your order API
// 2. Swap mockMarketData for Binance depth + aggTrade streams
// 3. Keep CryptoTerminalChartHost memoized so tape ticks do not re-render the chart`,

    layout: LAYOUT_TREE,

    chart: `import { CHART_SETTINGS_PRESETS } from "@efixdata/exeria-chart-ui-react/chart-settings";
import { createChart } from "@efixdata/exeria-chart";

const tradingDark =
  CHART_SETTINGS_PRESETS.find((preset) => preset.id === "trading-dark")?.template ?? null;

const chart = createChart({
  container,
  instrument: { symbol: "${symbol}", description: "${pair}" },
  themeVariant: "dark",
  dataAdapter: adapter,
});

chart.init();
chart.setMainDrawMode("OHLC");

if (tradingDark) {
  chart.importChartSettingsTemplate(tradingDark);
}

const ema = structuredClone(chart.getScripts().EMA);
ema.inputs.PERIODS.value = 21;
chart.addScript("EMA", ema);
chart.addScript("RSI");`,

    data: `import { BinanceAdapter } from "@efixdata/connector-binance";

const adapter = new BinanceAdapter();

const chart = createChart({
  container,
  dataAdapter: adapter,
});

await chart.loadData("${symbol}", {
  interval: "${interval}",
  limit: 1000,
});

chart.subscribeToUpdates("${symbol}", (tick) => {
  console.log("Live tick", tick);
});`,

    trade: `import { resolveChartClickPrice } from "./resolveChartClickPrice";

chart.getInteractor().setMode("CROSSHAIR");

container.addEventListener("click", (event) => {
  const price = resolveChartClickPrice(chart, container, event);
  if (price === null) return;

  setOrderTicket({
    side: "buy",
    type: "limit",
    price,
    size: 0.01,
  });
});

function placeSimulatedOrder(price: number, side: "buy" | "sell") {
  chart.toolDrawer.drawTool({
    type: "hLine",
    anchors: [{ stamp: Date.now(), offset: 0, value: price, _index: 0 }],
    color: side === "buy" ? "#22c55e" : "#ef4444",
    editable: true,
  });
}`,
  };
}

export const RUN_LOCALLY_STEPS = `# After downloading and unzipping the starter from this page:

cd exeria-crypto-terminal   # or whatever you named the folder
npm install
npm run dev

# Open the URL printed in the terminal (usually http://localhost:5173).
# Edit src/App.tsx — save and the browser refreshes.

# ── Starting from scratch instead? ──
# npm create vite@latest my-crypto-terminal -- --template react-ts
# cd my-crypto-terminal
# npm install @efixdata/exeria-chart @efixdata/exeria-chart-ui-react @efixdata/connector-binance
# Paste a snippet from above into src/App.tsx, then: npm run dev`;
