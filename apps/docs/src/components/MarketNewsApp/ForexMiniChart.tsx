"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ChartInstance } from "@exeria/charts";
import { applyChartSettingsPreset } from "../themeCreator/applyChartSettingsPreset";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import { buildChartTheme } from "../themeCreator/core";
import { applyInstrumentLineStyle } from "../ForexOpportunityApp/forexInstrumentLineStyle";
import { findForexPair, toChartInterval } from "../ForexOpportunityApp/forexInstruments";
import { loadStaticForexCandles } from "../ForexOpportunityApp/forexStaticData";
import { disableMiniChartPan, enableMiniChartPan } from "../SignalTerminalApp/enableMiniChartPan";
import { isolateMiniChartModel } from "../SignalTerminalApp/isolateMiniChartModel";
import { applyMiniChartChrome, refreshMiniChartChrome } from "../SignalTerminalApp/miniChartChrome";
import { fitMiniChartSeriesViewport } from "../SignalTerminalApp/miniChartSignalTagViewport";
import { FOREX_MINI_CHART_BARS, MARKET_NEWS_TIMEFRAME_ID } from "./constants";
import { stripMarketNewsMiniChartDecorations } from "./forexMiniChartSetup";
import { useMarketNewsLayoutTheme } from "./MarketNewsThemeContext";
import { getMarketNewsChartTheme } from "./marketNewsTheme";
import styles from "./marketNewsApp.module.css";

type ForexMiniChartProps = {
  symbol: string;
  color: string;
};

type ChartHost = ChartInstance & {
  model: { mainSeries: string };
};

export default function ForexMiniChart({ symbol, color }: ForexMiniChartProps) {
  const layoutTheme = useMarketNewsLayoutTheme();
  const chartTheme = useMemo(() => getMarketNewsChartTheme(layoutTheme), [layoutTheme]);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const runtimeTheme = useMemo(() => {
    const preset = themePresets.find((item) => item.id === chartTheme.miniChartPresetId) ?? themePresets[0]!;
    return buildChartTheme(preset.chart);
  }, [chartTheme.miniChartPresetId]);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
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
    const pair = findForexPair(symbol);

    const mount = async () => {
      setLoading(true);
      setError(false);

      try {
        const chartModule = await import("@exeria/charts");
        const candles = (await loadStaticForexCandles(symbol, MARKET_NEWS_TIMEFRAME_ID)).slice(
          -FOREX_MINI_CHART_BARS,
        );

        if (disposed || !containerRef.current || candles.length === 0) {
          return;
        }

        chartRef.current?.destroy?.();

        const chart = chartModule.createChart({
          container,
          instrument: {
            id: symbol,
            symbol,
            name: pair.label,
            description: pair.label,
            precision: pair.priceDecimals,
            chart: "ohlc",
            tradable: false,
            keyWords: [symbol],
            related: [],
          },
          theme: runtimeTheme,
          themeVariant: chartTheme.variant,
          layout: { mode: "compact" },
        });

        chartRef.current = chart;
        isolateMiniChartModel(chart);
        chart.init();
        applyChartSettingsPreset(chart, chartTheme.miniChartPresetId);
        applyMiniChartChrome(chart);
        stripMarketNewsMiniChartDecorations(chart);

        await chart.setMainSeriesData(candles, toChartInterval(MARKET_NEWS_TIMEFRAME_ID), false);

        const host = chart as ChartHost;
        applyInstrumentLineStyle(chart, host.model.mainSeries, {
          lineColor: color,
          lineFillMode: "gradient",
          fillOpacity: chartTheme.variant === "light" ? 0.28 : 0.32,
        });

        fitMiniChartSeriesViewport(chart);
        enableMiniChartPan(chart, container);
        chart.render();

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
  }, [chartTheme, color, runtimeTheme, symbol, visible]);

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
        stripMarketNewsMiniChartDecorations(chart);
        fitMiniChartSeriesViewport(chart);
        chart.render();
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [loading]);

  return (
    <div ref={wrapRef} className={styles.miniChartWrap} style={{ "--mini-accent": color } as CSSProperties}>
      <div className={styles.miniChartPlot}>
        <div ref={containerRef} className={styles.miniChartCanvas} />
      </div>
      {!visible || loading ? <span className={styles.miniChartOverlay}>…</span> : null}
      {error ? <span className={styles.miniChartOverlay}>—</span> : null}
    </div>
  );
}
