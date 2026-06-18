"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { KrakenAdapter } from "../../../../../packages/adapter-kraken/src";
import styles from "../BinanceConnectorExample/index.module.css";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import showcaseStyles from "../docsShowcase.module.css";
import {
  applyDocsChartPreset,
  docsChartEmbedBackground,
  docsChartRuntimeTheme,
  docsChartThemeVariant,
} from "../docsChartTheme";

const CRYPTO_SYMBOLS = [
  { id: "BTC/USD", name: "Bitcoin (BTC)" },
  { id: "ETH/USD", name: "Ethereum (ETH)" },
  { id: "SOL/USD", name: "Solana (SOL)" },
  { id: "ADA/USD", name: "Cardano (ADA)" },
  { id: "XRP/USD", name: "Ripple (XRP)" },
];

const TIMEFRAMES = [
  { id: "hour", label: "1H", interval: "1h" },
  { id: "day", label: "1D", interval: "1d" },
  { id: "week", label: "1W", interval: "1w" },
] as const;

const DEFAULT_TIMEFRAME = TIMEFRAMES[1];

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  timestamp: number;
}

function symbolButtonLabel(symbolId: string): string {
  return symbolId.split("/")[0]?.slice(0, 3) ?? symbolId;
}

export default function KrakenConnectorExample() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [candles, setCandles] = useState<number>(0);
  const [chartReady, setChartReady] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<KrakenAdapter | null>(null);
  const activeTimeframe =
    TIMEFRAMES.find((tf) => tf.id === selectedTimeframe) ?? DEFAULT_TIMEFRAME;
  

  useEffect(() => {
    let disposed = false;

    const initChart = async () => {
      if (!chartContainerRef.current || chartRef.current) {
        return;
      }

      try {
        const chartModule = await import("@efixdata/exeria-chart");

        if (disposed) {
          return;
        }

        adapterRef.current = new KrakenAdapter({ pageDelayMs: 1000 });

        const chart = chartModule.createChart({
          container: chartContainerRef.current,
          instrument: {
            symbol: selectedSymbol,
            description: selectedSymbol,
          },
          theme: docsChartRuntimeTheme,
          themeVariant: docsChartThemeVariant,
          dataAdapter: adapterRef.current,
        });

        chartRef.current = chart;
        chart.init();
        applyDocsChartPreset(chart);
        chart.setMainDrawMode("OHLC");
        setChartReady(true);
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : "Failed to initialize chart");
        }
      }
    };

    initChart();

    return () => {
      disposed = true;

      if (chartRef.current) {
        try {
          chartRef.current.destroy?.();
        } catch (e) {
          console.error("Error destroying chart:", e);
        }
        chartRef.current = null;
      }

      try {
        (chartRef.current as any)?.unsubscribeFromUpdates?.();
      } catch (e) {
        console.error("Error unsubscribing chart updates:", e);
      }

      try {
        adapterRef.current?.disconnect?.();
      } catch (e) {
        console.error("Error disconnecting connector:", e);
      }
      adapterRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartReady) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (chartRef.current) {
          await chartRef.current.loadData(selectedSymbol, {
            interval: activeTimeframe?.interval ?? "1d",
            limit: 500,
          });

          const seriesManager = chartRef.current.getSeriesManager();
          let count = 0;
          for (const key in seriesManager) {
            const series = seriesManager[key];
            if (Array.isArray(series?.data) && series?.data.length > count) {
              count = series?.data.length;
            }
          }
          setCandles(count);

          if (adapterRef.current?.getCurrentPrice) {
            try {
              const latest = await adapterRef.current.getCurrentPrice(selectedSymbol);
              setPriceData({
                symbol: selectedSymbol,
                price: latest.price ?? latest.c ?? 0,
                change: 0,
                timestamp: latest.stamp,
              });
            } catch (_) {
              // ignore
            }
          }

          chartRef.current.unsubscribeFromUpdates();
          chartRef.current.subscribeToUpdates(selectedSymbol, (update) => {
            setPriceData({
              symbol: selectedSymbol,
              price: update.price ?? update.c ?? 0,
              change: 0,
              timestamp: update.stamp,
            });
          });
        }

        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load data";
        setError(errorMessage);
        console.error("Data loading error:", err);
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSymbol, selectedTimeframe, chartReady, activeTimeframe]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Cryptocurrency</label>
          <div className={styles.buttonGroup}>
            {CRYPTO_SYMBOLS.map((symbol) => (
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
                {symbolButtonLabel(symbol.id)}
              </button>
            ))}
          </div>
        </div>

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
        background={docsChartEmbedBackground}
      >
        <div ref={chartContainerRef} className={docChartEmbedStyles.canvas} />
      </DocChartEmbed>

      {priceData && (
        <div className={styles.priceDisplay}>
          <div className={styles.priceHeader}>
            <h3>
              {CRYPTO_SYMBOLS.find((s) => s.id === selectedSymbol)?.name ?? selectedSymbol}
            </h3>
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
            ${priceData.price.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
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
              <strong>✓ Real-time Data:</strong> Historical OHLC from Kraken REST API
            </p>
            <p>
              <strong>✓ WebSocket v2:</strong> Live candle updates on the OHLC channel
            </p>
            <p>
              <strong>✓ USD pairs:</strong> Uses Kraken symbols like <code>BTC/USD</code>
            </p>
          </div>

          <div className={styles.codeExample}>
            <h4>Code Example</h4>
            <pre className={showcaseStyles.codeHint}>
              <code>{`import { createChart } from "@efixdata/exeria-chart";
import { KrakenAdapter } from "@efixdata/connector-kraken";

const adapter = new KrakenAdapter({ pageDelayMs: 1000 });
const chart = createChart({
  container,
  dataAdapter: adapter,
});

chart.init();

await chart.loadData("${selectedSymbol}", {
  interval: "${activeTimeframe?.interval ?? '1d'}",
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
