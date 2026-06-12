"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@exeria/charts";
import { ProxyEodhdAdapter } from "@site/src/lib/proxyEodhdAdapter";
import styles from "../BinanceConnectorExample/index.module.css";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import showcaseStyles from "../docsShowcase.module.css";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import { buildChartTheme } from "../themeCreator/core";
import {
  configureChartDrawModeForCandles,
  extractLargestSeriesCandles,
} from "@site/src/lib/chartSeriesDisplay";

const tradingDarkPreset = themePresets.find((preset) => preset.id === "trading-dark")!;

type DemoSymbol = {
  id: string;
  name: string;
  buttonLabel: string;
  priceDecimals: number;
};

type AssetGroup = {
  id: string;
  label: string;
  symbols: DemoSymbol[];
};

const ASSET_GROUPS: AssetGroup[] = [
  {
    id: "stocks",
    label: "Stocks & ETFs",
    symbols: [
      { id: "AAPL", name: "Apple Inc.", buttonLabel: "AAPL", priceDecimals: 2 },
      { id: "TSLA", name: "Tesla Inc.", buttonLabel: "TSLA", priceDecimals: 2 },
      { id: "VTI", name: "Vanguard Total Stock Market ETF", buttonLabel: "VTI", priceDecimals: 2 },
      { id: "AMZN", name: "Amazon.com Inc.", buttonLabel: "AMZN", priceDecimals: 2 },
    ],
  },
  {
    id: "forex",
    label: "Forex",
    symbols: [
      { id: "EUR/USD", name: "Euro / US Dollar", buttonLabel: "EUR/USD", priceDecimals: 5 },
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    symbols: [
      { id: "BTC-USD", name: "Bitcoin / US Dollar", buttonLabel: "BTC-USD", priceDecimals: 2 },
    ],
  },
];

const ALL_SYMBOLS = ASSET_GROUPS.flatMap((group) => group.symbols);

const TIMEFRAMES: Array<{
  id: string;
  label: string;
  interval: string;
}> = [
  { id: "hour", label: "1H", interval: "1h" },
  { id: "day", label: "1D", interval: "1d" },
  { id: "week", label: "1W", interval: "1w" },
];

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  timestamp: number;
}

function findSymbolMeta(symbolId: string): DemoSymbol {
  return (
    ALL_SYMBOLS.find((symbol) => symbol.id === symbolId) ?? {
      id: symbolId,
      name: symbolId,
      buttonLabel: symbolId,
      priceDecimals: 4,
    }
  );
}

export default function EodhdConnectorExample() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedTimeframe, setSelectedTimeframe] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [candles, setCandles] = useState<number>(0);
  const [chartReady, setChartReady] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<ProxyEodhdAdapter | null>(null);
  const activeSymbol = findSymbolMeta(selectedSymbol);
  const activeTimeframe = TIMEFRAMES.find((tf) => tf.id === selectedTimeframe) ?? {
    id: "day",
    label: "1D",
    interval: "1d",
  };
  const runtimeTheme = useMemo(() => buildChartTheme(tradingDarkPreset.chart), []);

  useEffect(() => {
    let disposed = false;

    const initChart = async () => {
      if (!chartContainerRef.current || chartRef.current) {
        return;
      }

      try {
        const chartModule = await import("@exeria/charts");

        if (disposed) {
          return;
        }

        adapterRef.current = new ProxyEodhdAdapter();

        const chart = chartModule.createChart({
          container: chartContainerRef.current,
          instrument: {
            symbol: selectedSymbol,
            description: activeSymbol.name,
          },
          theme: runtimeTheme,
          themeVariant: "dark",
          dataAdapter: adapterRef.current,
        });

        chartRef.current = chart;
        chart.init();
        setChartReady(true);
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : "Failed to initialize chart");
        }
      }
    };

    void initChart();

    return () => {
      disposed = true;

      try {
        chartRef.current?.unsubscribeFromUpdates?.();
      } catch (e) {
        console.error("Error unsubscribing chart updates:", e);
      }

      try {
        void adapterRef.current?.disconnect?.();
      } catch (e) {
        console.error("Error disconnecting connector:", e);
      }

      if (chartRef.current) {
        try {
          chartRef.current.destroy?.();
        } catch (e) {
          console.error("Error destroying chart:", e);
        }
        chartRef.current = null;
      }

      adapterRef.current = null;
      setChartReady(false);
    };
  }, [runtimeTheme]);

  useEffect(() => {
    if (!chartReady || !chartRef.current) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        chartRef.current?.unsubscribeFromUpdates();

        if (adapterRef.current) {
          await adapterRef.current.disconnect();
        }

        adapterRef.current = new ProxyEodhdAdapter();
        chartRef.current?.setDataAdapter(adapterRef.current);
        await adapterRef.current.initialize({});

        await chartRef.current?.loadData(selectedSymbol, {
          interval: activeTimeframe.interval,
          limit: 500,
        });

        const seriesManager = chartRef.current?.getSeriesManager();
        const loadedCandles = extractLargestSeriesCandles(seriesManager);
        setCandles(loadedCandles.length);

        if (chartRef.current) {
          configureChartDrawModeForCandles(chartRef.current, loadedCandles, {
            fillOpacity: 0.32,
          });
        }

        if (adapterRef.current.getCurrentPrice) {
          try {
            const latest = await adapterRef.current.getCurrentPrice(selectedSymbol);
            setPriceData({
              symbol: selectedSymbol,
              price: latest.price ?? latest.c ?? 0,
              change: 0,
              timestamp: latest.stamp,
            });
          } catch {
            // ignore
          }
        }

        chartRef.current?.subscribeToUpdates(selectedSymbol, (update) => {
          setPriceData({
            symbol: selectedSymbol,
            price: update.price ?? update.c ?? 0,
            change: 0,
            timestamp: update.stamp,
          });
        });

        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load data";
        setError(errorMessage);
        console.error("Data loading error:", err);
        setLoading(false);
      }
    };

    void loadData();
  }, [selectedSymbol, selectedTimeframe, chartReady, activeTimeframe]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        {ASSET_GROUPS.map((group) => (
          <div key={group.id} className={styles.controlGroup}>
            <label>{group.label}</label>
            <div className={styles.buttonGroup}>
              {group.symbols.map((symbol) => (
                <button
                  key={symbol.id}
                  type="button"
                  className={`${styles.button} ${
                    selectedSymbol === symbol.id ? styles.active : ""
                  }`}
                  onClick={() => setSelectedSymbol(symbol.id)}
                  disabled={loading}
                  title={symbol.name}
                >
                  {symbol.buttonLabel}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className={styles.controlGroup}>
          <label>Timeframe</label>
          <div className={styles.buttonGroup}>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                type="button"
                className={`${styles.button} ${
                  selectedTimeframe === tf.id ? styles.active : ""
                }`}
                onClick={() => setSelectedTimeframe(tf.id)}
                disabled={loading}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <DocChartEmbed
        loading={loading && !chartRef.current}
        error={error}
        minHeight={400}
        height="500px"
        background="var(--doc-chart-surface)"
      >
        <div ref={chartContainerRef} className={docChartEmbedStyles.canvas} />
      </DocChartEmbed>

      {priceData && (
        <div className={styles.priceDisplay}>
          <div className={styles.priceHeader}>
            <h3>{activeSymbol.name}</h3>
            <span
              className={`${styles.change} ${
                priceData.change >= 0 ? styles.positive : styles.negative
              }`}
            >
              {priceData.change >= 0 ? "+" : ""}
              {priceData.change.toFixed(2)}%
            </span>
          </div>

          <div className={styles.priceValue}>
            {priceData.price.toLocaleString("en-US", {
              minimumFractionDigits: activeSymbol.priceDecimals,
              maximumFractionDigits: activeSymbol.priceDecimals,
            })}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Candles Loaded</span>
              <span className={styles.statValue}>{candles}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Last Update</span>
              <span className={styles.statValue}>
                {Number.isFinite(priceData.timestamp)
                  ? new Date(priceData.timestamp).toLocaleTimeString()
                  : "—"}
              </span>
            </div>
          </div>

          <div className={styles.info}>
            <p>
              <strong>✓ EODHD proxy:</strong> Stocks, forex, and crypto via `/api/eodhd`
            </p>
            <p>
              <strong>✓ API token safe:</strong> Server-side only — not bundled in the browser
            </p>
            <p>
              <strong>✓ Free tier:</strong> End-of-day bars (1D/1W); intraday requires a paid
              plan or the built-in `demo` key for sample tickers.
            </p>
            <p>
              <strong>✓ Attribution:</strong> Data provided by{" "}
              <a href="https://eodhd.com/" target="_blank" rel="noreferrer">
                EODHD
              </a>
            </p>
          </div>

          <div className={styles.codeExample}>
            <h4>Code Example</h4>
            <pre className={showcaseStyles.codeHint}>
              <code>{`import { createChart } from "@exeria/charts";
import { EodhdAdapter } from "@efix-data/adapter-eodhd";

const connector = new EodhdAdapter({
  apiKey: process.env.EODHD_API_KEY!,
});

const chart = createChart({ container, dataAdapter: connector });
chart.init();

await chart.loadData("${selectedSymbol}", {
  interval: "${activeTimeframe.interval}",
  limit: 500,
});

chart.subscribeToUpdates("${selectedSymbol}");`}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
