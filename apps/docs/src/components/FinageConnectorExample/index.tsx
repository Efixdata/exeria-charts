"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { ProxyFinageAdapter } from "@site/src/lib/proxyFinageAdapter";
import styles from "../BinanceConnectorExample/index.module.css";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import showcaseStyles from "../docsShowcase.module.css";
import {
  applyDocsChartPreset,
  docsChartEmbedBackground,
  docsChartRuntimeTheme,
  docsChartThemeVariant,
} from "../docsChartTheme";

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
    id: "forex",
    label: "Forex",
    symbols: [
      { id: "EURUSD", name: "Euro / US Dollar", buttonLabel: "EURUSD", priceDecimals: 5 },
      { id: "GBPUSD", name: "British Pound / US Dollar", buttonLabel: "GBPUSD", priceDecimals: 5 },
      { id: "USDJPY", name: "US Dollar / Japanese Yen", buttonLabel: "USDJPY", priceDecimals: 3 },
      { id: "USDCHF", name: "US Dollar / Swiss Franc", buttonLabel: "USDCHF", priceDecimals: 5 },
      { id: "AUDUSD", name: "Australian Dollar / US Dollar", buttonLabel: "AUDUSD", priceDecimals: 5 },
      { id: "EURGBP", name: "Euro / British Pound", buttonLabel: "EURGBP", priceDecimals: 5 },
    ],
  },
  {
    id: "stocks",
    label: "Stocks & ETFs",
    symbols: [
      { id: "AAPL", name: "Apple Inc.", buttonLabel: "AAPL", priceDecimals: 2 },
      { id: "SPY", name: "SPDR S&P 500 ETF", buttonLabel: "SPY", priceDecimals: 2 },
      { id: "QQQ", name: "Invesco QQQ Trust (ETF)", buttonLabel: "QQQ", priceDecimals: 2 },
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

export default function FinageConnectorExample() {
  const [selectedSymbol, setSelectedSymbol] = useState("EURUSD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [candles, setCandles] = useState<number>(0);
  const [chartReady, setChartReady] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<ProxyFinageAdapter | null>(null);
  const activeSymbol = findSymbolMeta(selectedSymbol);
  const activeTimeframe = TIMEFRAMES.find((tf) => tf.id === selectedTimeframe) ?? {
    id: "day",
    label: "1D",
    interval: "1d",
  };
  

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

        adapterRef.current = new ProxyFinageAdapter();

        const chart = chartModule.createChart({
          container: chartContainerRef.current,
          instrument: {
            symbol: selectedSymbol,
            description: activeSymbol.name,
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
        (chartRef.current as any)?.unsubscribeFromUpdates?.();
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

        adapterRef.current = new ProxyFinageAdapter();
        chartRef.current?.setDataAdapter(adapterRef.current);
        await adapterRef.current.initialize({});

        await chartRef.current?.loadData(selectedSymbol, {
          interval: activeTimeframe?.interval ?? "1d",
          limit: 500,
        });

        const seriesManager = chartRef.current?.getSeriesManager();
        let count = 0;
        if (seriesManager) {
          for (const key in seriesManager) {
            const series = seriesManager[key];
            if (Array.isArray(series?.data) && series?.data.length > count) {
              count = series?.data.length;
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
        background={docsChartEmbedBackground}
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
              <strong>✓ Finage proxy:</strong> Forex and US stocks/ETFs via `/api/finage`
            </p>
            <p>
              <strong>✓ API key safe:</strong> Server-side only — not bundled in the browser
            </p>
            <p>
              <strong>✓ US equities:</strong> Update during market hours; weekends show the last
              available session.
            </p>
            <p>
              <strong>✓ Attribution:</strong> Data provided by{" "}
              <a href="https://finage.co.uk/" target="_blank" rel="noreferrer">
                Finage
              </a>
            </p>
          </div>

          <div className={styles.codeExample}>
            <h4>Code Example</h4>
            <pre className={showcaseStyles.codeHint}>
              <code>{`import { createChart } from "@efixdata/exeria-chart";
import { FinageAdapter } from "@efixdata/connector-finage";

const connector = new FinageAdapter({
  apiKey: process.env.FINAGE_API_KEY!,
});

const chart = createChart({ container, dataAdapter: connector });
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
