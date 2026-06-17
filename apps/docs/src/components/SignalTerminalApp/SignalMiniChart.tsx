"use client";

import { useEffect, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { docsInterval } from "../chartExampleData";
import { disableMiniChartPan, enableMiniChartPan } from "./enableMiniChartPan";
import { applyChartSettingsPreset } from "../themeCreator/applyChartSettingsPreset";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import { buildChartTheme } from "../themeCreator/core";
import { applyMiniChartScene } from "./applyMiniChartScene";
import { applyMiniChartChrome, refreshMiniChartChrome } from "./miniChartChrome";
import { isolateMiniChartModel } from "./isolateMiniChartModel";
import { updateMiniChartLivePrice } from "./miniChartLivePrice";
import { SCREENER_CHART_PRESET_ID } from "./constants";
import type { ScreenerSignal } from "./signalCatalog";
import {
  buildMiniChartWindow,
  fetchMiniChartCandles,
  miniChartFetchLimit,
  resolveSignalOnWindow,
} from "./signalMiniChartData";
import styles from "./signalTerminalApp.module.css";

type SignalMiniChartProps = {
  signal: ScreenerSignal;
  marketPrice?: number;
};

export default function SignalMiniChart({ signal, marketPrice }: SignalMiniChartProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let disposed = false;
    const preset = themePresets.find((item) => item.id === SCREENER_CHART_PRESET_ID)!;
    const runtimeTheme = buildChartTheme(preset.chart);

    const mount = async () => {
      setLoading(true);
      setError(false);

      try {
        const chartModule = await import("@efixdata/exeria-chart");
        const limit = miniChartFetchLimit(signal.timestamp);
        const allCandles = await fetchMiniChartCandles(signal.symbol, limit);
        const window = buildMiniChartWindow(allCandles, signal.timestamp);

        if (disposed || !containerRef.current) {
          return;
        }

        chartRef.current?.destroy?.();

        const chart = chartModule.createChart({
          container,
          instrument: {
            symbol: signal.symbol,
            description: signal.pair,
          },
          theme: runtimeTheme,
          themeVariant: "dark",
          layout: { mode: "compact" },
        });

        chartRef.current = chart;
        isolateMiniChartModel(chart);
        chart.init();
        applyChartSettingsPreset(chart, SCREENER_CHART_PRESET_ID);
        applyMiniChartChrome(chart);
        enableMiniChartPan(chart, container);

        const chartCandles = window.candles.map((candle) => ({ ...candle }));
        await chart.setMainSeriesData(chartCandles, docsInterval, false);
        const resolved = resolveSignalOnWindow(chartCandles, signal);
        await applyMiniChartScene(chart, chartCandles, signal, resolved);

        if (marketPrice !== undefined) {
          updateMiniChartLivePrice(chart, signal.symbol, marketPrice);
        }

        if (!disposed) {
          setLoading(false);
        }
      } catch {
        if (!disposed) {
          setError(true);
          setLoading(false);
        }
      }
    };

    void mount();

    return () => {
      disposed = true;
      if (chartRef.current) {
        disableMiniChartPan(chartRef.current);
      }
      chartRef.current?.destroy?.();
      chartRef.current = null;
    };
  }, [signal, visible]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || loading || marketPrice === undefined) {
      return;
    }

    updateMiniChartLivePrice(chart, signal.symbol, marketPrice);
  }, [marketPrice, loading, signal.symbol]);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;

    if (!chart || !container || loading) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        if (chartRef.current !== chart) {
          return;
        }

        refreshMiniChartChrome(chart);
        chart.render();
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [loading]);

  return (
    <div
      ref={wrapRef}
      className={styles.miniChartWrap}
      data-side={signal.side}
      aria-label={`${signal.pair} signal chart`}
    >
      <div className={styles.miniChartPlot}>
        <div ref={containerRef} className={styles.miniChartCanvas} />
      </div>
      {!visible || loading ? <span className={styles.miniChartOverlay}>…</span> : null}
      {error ? <span className={styles.miniChartOverlay}>—</span> : null}
    </div>
  );
}
