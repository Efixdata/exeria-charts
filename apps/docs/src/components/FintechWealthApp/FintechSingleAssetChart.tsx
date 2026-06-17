"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import { buildChartTheme } from "../themeCreator/core";
import type { FintechAsset, FintechPeriodId } from "./constants";
import {
  clearFintechDrawingTools,
  relayoutFintechChartViewport,
  scheduleFintechChartRelayout,
  setupFintechSingleAssetChart,
  waitForChartContainerReady,
  type FintechDataContext,
  type FintechThemeVariant,
} from "./fintechCompareChartSetup";
import type { FintechMarketId } from "./marketPresets";
import styles from "./fintechWealthApp.module.css";

type FintechSingleAssetChartProps = {
  asset: FintechAsset;
  marketId: FintechMarketId;
  periodId: FintechPeriodId;
  interval: string;
  limit: number;
  themeVariant?: FintechThemeVariant;
};

function getChartPresetId(themeVariant: FintechThemeVariant) {
  return themeVariant === "light" ? "day" : "trading-dark";
}

export default function FintechSingleAssetChart({
  asset,
  marketId,
  periodId,
  interval,
  limit,
  themeVariant = "dark",
}: FintechSingleAssetChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const loadGenerationRef = useRef(0);

  const [loading, setLoading] = useState(true);

  const chartPresetId = getChartPresetId(themeVariant);
  const runtimeTheme = useMemo(() => {
    const preset = themePresets.find((entry) => entry.id === chartPresetId)!;
    return buildChartTheme(preset.chart);
  }, [chartPresetId]);

  const dataContext = useMemo<FintechDataContext>(
    () => ({ marketId, periodId, interval, limit }),
    [interval, limit, marketId, periodId],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const generation = ++loadGenerationRef.current;
    let disposed = false;

    const bootChart = async () => {
      setLoading(true);
      chartRef.current?.destroy();
      chartRef.current = null;

      try {
        await waitForChartContainerReady(container);
        if (disposed || generation !== loadGenerationRef.current) {
          return;
        }

        const chartModule = await import("@efixdata/exeria-chart");
        if (disposed || generation !== loadGenerationRef.current) {
          return;
        }

        const instance = chartModule.createChart({
          container,
          instrument: {
            symbol: asset.symbol,
            description: asset.label,
          },
          theme: runtimeTheme,
          themeVariant,
        });

        chartRef.current = instance;
        instance.init();

        await setupFintechSingleAssetChart(instance, asset, dataContext, themeVariant);
        if (disposed || generation !== loadGenerationRef.current) {
          return;
        }

        scheduleFintechChartRelayout(instance);
        setLoading(false);
      } catch {
        if (!disposed && generation === loadGenerationRef.current) {
          setLoading(false);
        }
      }
    };

    void bootChart();

    return () => {
      disposed = true;
      if (chartRef.current) {
        clearFintechDrawingTools(chartRef.current);
        chartRef.current.destroy();
      }
      chartRef.current = null;
    };
  }, [asset, dataContext, runtimeTheme, themeVariant]);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container || loading) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      relayoutFintechChartViewport(chart);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [loading]);

  return (
    <div className={styles.sheetChartShell} data-loading={loading ? "true" : "false"}>
      {loading ? <div className={styles.chartSkeleton} aria-hidden /> : null}
      <div ref={containerRef} className={styles.sheetChartCanvas} />
    </div>
  );
}
