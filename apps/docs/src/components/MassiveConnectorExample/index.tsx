"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { ProxyMassiveAdapter } from "@site/src/lib/proxyMassiveAdapter";
import styles from "../BinanceConnectorExample/index.module.css";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import showcaseStyles from "../docsShowcase.module.css";
import {
  applyDocsChartPreset,
  docsChartEmbedBackground,
  docsChartRuntimeTheme,
  docsChartThemeVariant,
} from "../docsChartTheme";

type AssetClass = "stocks" | "forex" | "crypto";

const ASSET_GROUPS: Array<{
  id: AssetClass;
  label: string;
  symbols: Array<{ id: string; name: string }>;
}> = [
  {
    id: "stocks",
    label: "Stocks",
    symbols: [
      { id: "AAPL", name: "Apple Inc." },
      { id: "MSFT", name: "Microsoft" },
    ],
  },
  {
    id: "forex",
    label: "Forex",
    symbols: [
      { id: "EUR/USD", name: "Euro / US Dollar" },
      { id: "GBP/USD", name: "British Pound / US Dollar" },
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    symbols: [
      { id: "BTC-USD", name: "Bitcoin / USD" },
      { id: "ETH-USD", name: "Ethereum / USD" },
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

function findAssetClass(symbolId: string): AssetClass {
  for (const group of ASSET_GROUPS) {
    if (group.symbols.some((symbol) => symbol.id === symbolId)) {
      return group.id;
    }
  }

  return "stocks";
}

function formatPrice(symbolId: string, price: number): string {
  const assetClass = findAssetClass(symbolId);

  if (assetClass === "forex") {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 5,
    });
  }

  if (assetClass === "crypto") {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MassiveConnectorExample() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedTimeframe, setSelectedTimeframe] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [candles, setCandles] = useState<number>(0);
  const [chartReady, setChartReady] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<ProxyMassiveAdapter | null>(null);
  const activeTimeframe = TIMEFRAMES.find((tf) => tf.id === selectedTimeframe) ?? {
    id: "day",
    label: "1D",
    interval: "1d",
  };
  
  const selectedMeta = ALL_SYMBOLS.find((symbol) => symbol.id === selectedSymbol);
  const selectedAssetClass = findAssetClass(selectedSymbol);

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

        adapterRef.current = new ProxyMassiveAdapter();

        const chart = chartModule.createChart({
          container: chartContainerRef.current,
          instrument: {
            symbol: "AAPL",
            description: "Apple Inc.",
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
  }, []);

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

        adapterRef.current = new ProxyMassiveAdapter();
        chartRef.current?.setDataAdapter(adapterRef.current);
        await adapterRef.current.initialize({});

        await chartRef.current?.loadData(selectedSymbol, {
          interval: activeTimeframe.interval,
          limit: 500,
        });

        const seriesManager = chartRef.current?.getSeriesManager();
        let count = 0;
        if (seriesManager) {
          for (const key in seriesManager) {
            const series = seriesManager[key];
            if (Array.isArray(series.data) && series.data.length > count) {
              count = series.data.length;
            }
          }
        }
        setCandles(count);

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
          <div className={styles.controlGroup} key={group.id}>
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
                  {symbol.id}
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
        background={docsChartEmbedBackground}
      >
        <div ref={chartContainerRef} className={docChartEmbedStyles.canvas} />
      </DocChartEmbed>

      {priceData && (
        <div className={styles.priceDisplay}>
          <div className={styles.priceHeader}>
            <h3>{selectedMeta?.name ?? selectedSymbol}</h3>
            <span className={styles.change}>
              {selectedAssetClass.charAt(0).toUpperCase() + selectedAssetClass.slice(1)}
            </span>
          </div>

          <div className={styles.priceValue}>
            {formatPrice(selectedSymbol, priceData.price)}
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
              <strong>✓ Massive proxy:</strong> History and live prices via `/api/massive`
            </p>
            <p>
              <strong>✓ Multi-asset:</strong> Stocks (`AAPL`), forex (`EUR/USD`), crypto (`BTC-USD`)
            </p>
            <p>
              <strong>✓ API key safe:</strong> Server-side only — not bundled in the browser
            </p>
            <p>
              <strong>✓ Attribution:</strong> Data provided by{" "}
              <a href="https://massive.com/" target="_blank" rel="noreferrer">
                Massive
              </a>{" "}
              (formerly Polygon.io)
            </p>
          </div>

          <div className={styles.codeExample}>
            <h4>Code Example</h4>
            <pre className={showcaseStyles.codeHint}>
              <code>{`import { createChart } from "@efixdata/exeria-chart";
import { MassiveAdapter } from "@efixdata/connector-massive";

const connector = new MassiveAdapter({
  apiKey: process.env.MASSIVE_API_KEY!,
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
