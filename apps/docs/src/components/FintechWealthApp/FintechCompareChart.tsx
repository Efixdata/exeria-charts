"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import { buildChartTheme } from "../themeCreator/core";
import type { FintechAsset, FintechPeriodId } from "./constants";
import {
  alignChartViewportToEnd,
  applyFintechCompareChartTheme,
  applySeriesFocus,
  readAssetPerformance,
  readMainSeriesBarCount,
  setupFintechCompareChart,
  type AssetPerformance,
  type FintechDataContext,
  type FintechThemeVariant,
} from "./fintechCompareChartSetup";
import type { FintechMarketId } from "./marketPresets";
import styles from "./fintechWealthApp.module.css";

type FintechCompareChartProps = {
  marketId: FintechMarketId;
  assets: FintechAsset[];
  periodId: FintechPeriodId;
  interval: string;
  limit: number;
  focusedAssetId: string | null;
  themeVariant: FintechThemeVariant;
  refreshKey: number;
  resetKey?: number;
  onPerformanceChange: (rows: AssetPerformance[]) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string | null) => void;
};

function getChartPresetId(themeVariant: FintechThemeVariant) {
  return themeVariant === "light" ? "day" : "trading-dark";
}

export default function FintechCompareChart({
  marketId,
  assets,
  periodId,
  interval,
  limit,
  focusedAssetId,
  themeVariant,
  refreshKey,
  resetKey = 0,
  onPerformanceChange,
  onLoadingChange,
  onError,
}: FintechCompareChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const loadGenerationRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const settledPeriodRef = useRef(periodId);
  const focusedAssetIdRef = useRef(focusedAssetId);
  const themeVariantRef = useRef(themeVariant);
  const runtimeThemeRef = useRef<ReturnType<typeof buildChartTheme> | null>(null);

  focusedAssetIdRef.current = focusedAssetId;
  themeVariantRef.current = themeVariant;

  const [bootLoading, setBootLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartEpoch, setChartEpoch] = useState(0);
  const [barCount, setBarCount] = useState(0);

  const chartPresetId = getChartPresetId(themeVariant);
  const runtimeTheme = useMemo(() => {
    const preset = themePresets.find((entry) => entry.id === chartPresetId)!;
    return buildChartTheme(preset.chart);
  }, [chartPresetId]);

  runtimeThemeRef.current = runtimeTheme;

  const dataContext = useMemo<FintechDataContext>(
    () => ({ marketId, periodId, interval, limit }),
    [interval, limit, marketId, periodId],
  );

  const isPeriodTransition =
    hasLoadedOnceRef.current && settledPeriodRef.current !== periodId && dataLoading;

  useEffect(() => {
    onLoadingChange(bootLoading || dataLoading);
  }, [bootLoading, dataLoading, onLoadingChange]);

  useEffect(() => {
    onError(error);
  }, [error, onError]);

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    setChartEpoch((value) => value + 1);
  }, [marketId, refreshKey, resetKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let disposed = false;

    const initChart = async () => {
      chartRef.current?.destroy();
      chartRef.current = null;

      setBootLoading(true);
      setDataLoading(true);
      setError(null);

      try {
        const chartModule = await import("@efixdata/exeria-chart");
        if (disposed) {
          return;
        }

        const primary = assets[0];
        if (!primary) {
          return;
        }

        const instance = chartModule.createChart({
          container,
          instrument: {
            symbol: primary.symbol,
            description: primary.label,
          },
          theme: runtimeThemeRef.current!,
          themeVariant: themeVariantRef.current,
        });

        chartRef.current = instance;
        instance.init();

        if (!disposed) {
          setBootLoading(false);
        }
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load chart");
          setBootLoading(false);
          setDataLoading(false);
        }
      }
    };

    void initChart();

    return () => {
      disposed = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [assets, chartEpoch]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || bootLoading || dataLoading) {
      return undefined;
    }

    applyFintechCompareChartTheme(
      chart,
      runtimeTheme,
      themeVariant,
      assets,
      focusedAssetIdRef.current,
    );
  }, [assets, bootLoading, dataLoading, runtimeTheme, themeVariant]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || bootLoading) {
      return undefined;
    }

    let disposed = false;
    const generation = ++loadGenerationRef.current;

    const loadData = async () => {
      setDataLoading(true);
      setError(null);

      try {
        await setupFintechCompareChart(
          chart,
          assets,
          dataContext,
          focusedAssetIdRef.current,
          themeVariantRef.current,
        );
        if (disposed || generation !== loadGenerationRef.current) {
          return;
        }

        applySeriesFocus(chart, assets, focusedAssetIdRef.current);
        setBarCount(readMainSeriesBarCount(chart));
        onPerformanceChange(readAssetPerformance(chart, assets));
        hasLoadedOnceRef.current = true;
        settledPeriodRef.current = periodId;
        setDataLoading(false);
      } catch (nextError) {
        if (!disposed && generation === loadGenerationRef.current) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load market data");
          setDataLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      disposed = true;
    };
  }, [assets, bootLoading, dataContext, onPerformanceChange, periodId]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || bootLoading || dataLoading) {
      return;
    }

    applySeriesFocus(chart, assets, focusedAssetId);
  }, [assets, bootLoading, dataLoading, focusedAssetId]);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container || bootLoading || dataLoading) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      alignChartViewportToEnd(chart);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [bootLoading, dataLoading]);

  const showSkeleton = bootLoading || (dataLoading && !hasLoadedOnceRef.current);

  return (
    <div
      className={styles.chartShell}
      data-testid="fintech-compare-chart"
      data-bar-count={barCount > 0 ? String(barCount) : undefined}
      data-loading={showSkeleton ? "true" : "false"}
      data-transitioning={isPeriodTransition ? "true" : "false"}
      role="img"
      aria-label="Portfolio performance compare chart"
    >
      <div className={styles.chartGlow} aria-hidden />
      {showSkeleton ? <div className={styles.chartSkeleton} aria-hidden /> : null}
      {isPeriodTransition ? <div className={styles.chartTransitionVeil} aria-hidden /> : null}
      {error ? <p className={styles.chartError}>{error}</p> : null}
      <div ref={containerRef} className={styles.chartCanvas} />
    </div>
  );
}
