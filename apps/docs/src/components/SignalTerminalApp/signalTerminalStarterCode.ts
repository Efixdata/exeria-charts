import type { TimeframeId } from "./constants";
import { TIMEFRAMES, WATCHLIST_SYMBOLS } from "./constants";

export type SignalCodeTabId = "chartSignals" | "chartUi" | "signalFeed";

export const SIGNAL_CODE_TABS: Array<{ id: SignalCodeTabId; label: string }> = [
  { id: "chartSignals", label: "Chart + strategies" },
  { id: "chartUi", label: "ChartUI shell" },
  { id: "signalFeed", label: "Signal feed panel" },
];

function getInterval(timeframeId: TimeframeId): string {
  return TIMEFRAMES.find((tf) => tf.id === timeframeId)?.interval ?? "1h";
}

export const RUN_LOCALLY_STEPS = `# After downloading and unzipping the starter from this page:

cd exeria-screener-signals   # or whatever you named the folder
npm install
npm run dev`;

export function buildSignalStarterCode(
  symbol: string,
  timeframeId: TimeframeId,
): Record<SignalCodeTabId, string> {
  const interval = getInterval(timeframeId);
  const pair = WATCHLIST_SYMBOLS.find((item) => item.id === symbol)?.pair ?? symbol;

  return {
    chartSignals: `import { useEffect, useRef } from "react";
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

      // Strategies resolve default inputs from indicators already on the chart.
      await chart.addScript("MACD");
      await chart.addScript("CROSS");   // MACD line vs signal → buy/sell markers
      await chart.addScript("BBAND");
      await chart.addScript("EXCEED");  // price outside bands → breakout signals
      await chart.addScript("RSI");

      chart.subscribeToUpdates(SYMBOL);
    })();

    return () => {
      chart.unsubscribeFromUpdates();
      adapter.disconnect?.();
      chart.destroy();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
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
      await instance.addScript("MACD");
      await instance.addScript("CROSS");
      await instance.addScript("BBAND");
      await instance.addScript("EXCEED");
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
    <main style={{ height: "100vh", background: "#0b0c10" }}>
      <ChartUI chart={chart}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </ChartUI>
    </main>
  );
}`,

    signalFeed: `type SignalEvent = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  strategy: string;
  price: number;
  timestamp: number;
};

// Replace with your screener / alert backend (WebSocket or REST poll).
export function SignalFeed({ events }: { events: SignalEvent[] }) {
  return (
    <aside>
      <h2>Signal feed</h2>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            <strong>{event.side.toUpperCase()}</strong> {event.strategy}
            <span>{event.symbol}</span>
            <span>@ {event.price}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}`,
  };
}
