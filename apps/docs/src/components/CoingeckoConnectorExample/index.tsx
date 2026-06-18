"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { CoingeckoAdapter } from "../../../../../packages/adapter-coingecko/src";
import styles from "../BinanceConnectorExample/index.module.css";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import showcaseStyles from "../docsShowcase.module.css";
import {
  applyDocsChartPreset,
  docsChartEmbedBackground,
  docsChartRuntimeTheme,
  docsChartThemeVariant,
} from "../docsChartTheme";

const CRYPTO_COINS = [
  { id: "bitcoin", name: "Bitcoin (BTC)", label: "BTC" },
  { id: "ethereum", name: "Ethereum (ETH)", label: "ETH" },
  { id: "solana", name: "Solana (SOL)", label: "SOL" },
  { id: "cardano", name: "Cardano (ADA)", label: "ADA" },
  { id: "ripple", name: "Ripple (XRP)", label: "XRP" },
  { id: "binancecoin", name: "BNB", label: "BNB" },
];

const TIMEFRAMES = [
  { id: "day", label: "1D", interval: "1d" },
  { id: "hour", label: "1H", interval: "1h" },
] as const;

const DEFAULT_TIMEFRAME = TIMEFRAMES[0];

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  timestamp: number;
}

export default function CoingeckoConnectorExample() {
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [selectedTimeframe, setSelectedTimeframe] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [candles, setCandles] = useState<number>(0);
  const [chartReady, setChartReady] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<CoingeckoAdapter | null>(null);
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

        adapterRef.current = new CoingeckoAdapter({ pollIntervalMs: 60_000 });

        const chart = chartModule.createChart({
          container: chartContainerRef.current,
          instrument: {
            symbol: selectedCoin,
            description: selectedCoin,
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
          await chartRef.current.loadData(selectedCoin, {
            interval: activeTimeframe?.interval ?? "1d",
            limit: 90,
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
              const latest = await adapterRef.current.getCurrentPrice(selectedCoin);
              setPriceData({
                symbol: selectedCoin,
                price: latest.price ?? latest.c ?? 0,
                change: 0,
                timestamp: latest.stamp,
              });
            } catch (_) {
              // ignore
            }
          }

          chartRef.current.unsubscribeFromUpdates();
          chartRef.current.subscribeToUpdates(selectedCoin, (update) => {
            setPriceData({
              symbol: selectedCoin,
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
  }, [selectedCoin, selectedTimeframe, chartReady, activeTimeframe]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Cryptocurrency</label>
          <div className={styles.buttonGroup}>
            {CRYPTO_COINS.map((coin) => (
              <button
                key={coin.id}
                type="button"
                className={`${styles.button} ${
                  selectedCoin === coin.id ? styles.active : ""
                }`}
                onClick={() => setSelectedCoin(coin.id)}
                disabled={loading}
                title={coin.name}
              >
                {coin.label}
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
              {CRYPTO_COINS.find((coin) => coin.id === selectedCoin)?.name ?? selectedCoin}
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
              <strong>✓ Market Data:</strong> Historical OHLC from CoinGecko REST API
            </p>
            <p>
              <strong>✓ Near-Real-Time:</strong> Price polling every 60 seconds (no WebSocket)
            </p>
            <p>
              <strong>✓ Coin IDs:</strong> Uses CoinGecko ids like <code>bitcoin</code>, not exchange pairs
            </p>
          </div>

          <div className={styles.codeExample}>
            <h4>Code Example</h4>
            <pre className={showcaseStyles.codeHint}>
              <code>{`import { createChart } from "@efixdata/exeria-chart";
import { CoingeckoAdapter } from "@efixdata/connector-coingecko";

const adapter = new CoingeckoAdapter({ pollIntervalMs: 60_000 });
const chart = createChart({
  container,
  dataAdapter: adapter,
});

chart.init();

await chart.loadData("${selectedCoin}", {
  interval: "${activeTimeframe?.interval ?? '1d'}",
  limit: 90,
});

chart.subscribeToUpdates("${selectedCoin}");`}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
