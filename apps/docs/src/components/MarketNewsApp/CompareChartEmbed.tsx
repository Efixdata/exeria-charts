"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore
// @ts-ignore
import _Link from "@docusaurus/Link";

let Link = _Link as any;

import type { ChartInstance } from "@efixdata/exeria-chart";
import { applyChartSettingsPreset } from "../themeCreator/applyChartSettingsPreset";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import { buildChartTheme } from "../themeCreator/core";
import { ensureChartPointerMode } from "../SignalTerminalApp/chartPanInteraction";
import { findForexPair } from "../ForexOpportunityApp/forexInstruments";
import { setupCompareChart } from "./compareChartSetup";
import { COMPARE_OVERLAY_SYMBOL, COMPARE_PRIMARY_SYMBOL, MARKET_NEWS_PERIODS, type MarketNewsPeriodId } from "./constants";
import { useMarketNewsLayoutTheme } from "./MarketNewsThemeContext";
import { computeChangePercent } from "./forexCandleUtils";
import { getMarketNewsChartTheme } from "./marketNewsTheme";
import { formatQuoteChange, quoteTone } from "./sparkline";
import styles from "./marketNewsApp.module.css";

type CompareChartEmbedProps = {
  periodId: MarketNewsPeriodId;
  onPeriodChange: (periodId: MarketNewsPeriodId) => void;
};

export default function CompareChartEmbed({ periodId, onPeriodChange }: CompareChartEmbedProps) {
  const layoutTheme = useMarketNewsLayoutTheme();
  const chartTheme = useMemo(() => getMarketNewsChartTheme(layoutTheme), [layoutTheme]);
  const chartThemeRef = useRef(chartTheme);
  chartThemeRef.current = chartTheme;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState({ primary: 0, overlay: 0 });

  const runtimeTheme = useMemo(() => {
    const preset = themePresets.find((entry) => entry.id === chartTheme.presetId) ?? themePresets[0]!;
    return buildChartTheme(preset.chart);
  }, [chartTheme.presetId]);

  useEffect(() => {
    let disposed = false;
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const mount = async () => {
      setError(null);

      try {
        const chartModule = await import("@efixdata/exeria-chart");
        if (disposed) {
          return;
        }

        const theme = chartThemeRef.current;
        const preset = themePresets.find((entry) => entry.id === theme.presetId) ?? themePresets[0]!;
        const initialRuntimeTheme = buildChartTheme(preset.chart);

        const chart = chartModule.createChart({
          container,
          instrument: {
            id: COMPARE_PRIMARY_SYMBOL,
            symbol: COMPARE_PRIMARY_SYMBOL,
            name: findForexPair(COMPARE_PRIMARY_SYMBOL).label,
            description: findForexPair(COMPARE_PRIMARY_SYMBOL).label,
            precision: findForexPair(COMPARE_PRIMARY_SYMBOL).priceDecimals,
            chart: "ohlc",
            tradable: false,
            keyWords: [COMPARE_PRIMARY_SYMBOL],
            related: [],
          },
          theme: initialRuntimeTheme,
          themeVariant: theme.variant,
        });

        chartRef.current = chart;
        chart.init();
        applyChartSettingsPreset(chart, theme.presetId);
        ensureChartPointerMode(chart);
        setChartReady(true);
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load chart");
          setLoading(false);
        }
      }
    };

    void mount();

    return () => {
      disposed = true;
      chartRef.current?.destroy();
      chartRef.current = null;
      setChartReady(false);
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chartReady || !chart) {
      return undefined;
    }

    let disposed = false;

    const refresh = async () => {
      setLoading(true);
      setError(null);

      try {
        applyChartSettingsPreset(chart, chartTheme.presetId);
        chart.applyChartTheme(runtimeTheme, chartTheme.variant);

        const { primary, overlay } = await setupCompareChart(chart, periodId, chartTheme);
        if (disposed) {
          return;
        }

        setChanges({
          primary: computeChangePercent(primary),
          overlay: computeChangePercent(overlay),
        });
        setLoading(false);
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load chart");
          setLoading(false);
        }
      }
    };

    void refresh();

    return () => {
      disposed = true;
    };
  }, [chartReady, periodId, chartTheme, runtimeTheme]);

  return (
    <figure className={styles.chartFigure}>
      <div className={styles.chartToolbar}>
        <div className={styles.periodPills} role="tablist" aria-label="Chart period">
          {MARKET_NEWS_PERIODS.map((period) => (
            <button
              key={period.id}
              type="button"
              role="tab"
              aria-selected={period.id === periodId}
              className={[
                styles.periodPill,
                period.id === periodId ? styles.periodPillActive : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onPeriodChange(period.id)}
            >
              {period.label}
            </button>
          ))}
        </div>
        <Link className={styles.chartCodeLink} to="/starters/market-news#market-news-developer">
          View embed code
        </Link>
      </div>

      <div className={styles.chartFrame}>
        {loading ? <div className={styles.chartState}>Loading chart…</div> : null}
        {error ? <div className={styles.chartStateError}>{error}</div> : null}
        <div ref={containerRef} className={styles.chartCanvas} />
      </div>

      <figcaption className={styles.chartCaption}>
        <div className={styles.legendRow}>
          <span className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: chartTheme.comparePrimary }} />
            {COMPARE_PRIMARY_SYMBOL}
            <strong className={styles[quoteTone(changes.primary)]}>{formatQuoteChange(changes.primary)}</strong>
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendSwatchDashed}
              style={{ borderColor: chartTheme.compareOverlay }}
            />
            {COMPARE_OVERLAY_SYMBOL}
            <strong className={styles[quoteTone(changes.overlay)]}>{formatQuoteChange(changes.overlay)}</strong>
          </span>
        </div>
        <p>
          Fig. 1 — Major pairs indexed to 100 at the start of the selected window. Same static H1
          fixtures as the{" "}
          <Link to="/starters/market-news/app">FX Opportunity Radar</Link> demo.
        </p>
      </figcaption>
    </figure>
  );
}
