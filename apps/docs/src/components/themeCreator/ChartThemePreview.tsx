import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { docsInterval } from "../chartExampleData";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import {
  type ChartColorKey,
  type UiColorKey,
  type ThemeVariant,
  type VariantPalette,
  buildChartTheme,
  buildUiTheme,
  previewCandles,
  previewInstrument,
} from "./core";
import { loadChartUI } from "@site/src/utils/loadChartUI";

export type ChartSceneAction = (chart: ChartInstance) => void | Promise<void>;

type ChartThemePreviewProps = {
  chartColorsByVariant: VariantPalette<ChartColorKey>;
  uiColorsByVariant: VariantPalette<UiColorKey>;
  themeVariant: ThemeVariant;
  /** When this key changes, `onChartReady` runs again on the existing chart instance. */
  sceneApplyKey?: string | null;
  onChartReady?: ChartSceneAction;
  minHeight?: number;
  className?: string;
};

export default function ChartThemePreview({
  chartColorsByVariant,
  uiColorsByVariant,
  themeVariant,
  sceneApplyKey,
  onChartReady,
  minHeight = 520,
  className,
}: ChartThemePreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const onChartReadyRef = useRef(onChartReady);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [chartUiLoading, setChartUiLoading] = useState(true);
  const [ChartUIComponent, setChartUIComponent] = useState<ComponentType<any> | null>(null);

  const chartColors = chartColorsByVariant[themeVariant];
  const runtimeTheme = useMemo(() => buildChartTheme(chartColorsByVariant), [chartColorsByVariant]);
  const uiThemes = useMemo(
    () => ({
      dark: buildUiTheme(uiColorsByVariant.dark, "dark", chartColorsByVariant.dark.accent),
      light: buildUiTheme(uiColorsByVariant.light, "light", chartColorsByVariant.light.accent),
    }),
    [chartColorsByVariant, uiColorsByVariant],
  );
  const activeUiTheme = uiThemes[themeVariant];
  const themeUpdateKey = useMemo(
    () => JSON.stringify({ runtimeTheme, themeVariant }),
    [runtimeTheme, themeVariant],
  );

  useEffect(() => {
    onChartReadyRef.current = onChartReady;
  }, [onChartReady]);

  useEffect(() => {
    let disposed = false;

    loadChartUI()
      .then((ChartUI) => {
        if (!disposed) {
          setChartUIComponent(() => ChartUI as ComponentType<any>);
          setChartUiLoading(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load ChartUI", error);
        if (!disposed) {
          setPreviewError("Failed to load the React UI preview component.");
          setChartUiLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    const mountChart = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      setPreviewError(null);
      setChart(null);
      chartRef.current = null;

      const chartModule = await import("@efixdata/exeria-chart");
      if (disposed) {
        return;
      }

      const chartInstance = chartModule.createChart({
        container,
        instrument: previewInstrument,
        theme: runtimeTheme,
        themeVariant,
      });

      try {
        chartInstance.init();
        await chartInstance.setMainSeriesData(previewCandles, docsInterval);
        chartInstance.setMainDrawMode("OHLC");

        if (onChartReadyRef.current) {
          await onChartReadyRef.current(chartInstance);
        }

        if (disposed) {
          chartInstance.destroy();
          return;
        }

        chartRef.current = chartInstance;
        setChart(chartInstance);
      } catch (error) {
        chartInstance.destroy();

        if (!disposed) {
          setPreviewError(
            error instanceof Error ? error.message : "Failed to initialize the live chart preview.",
          );
        }
      }
    };

    void mountChart();

    return () => {
      disposed = true;
      setChart((currentChart) => {
        currentChart?.destroy();
        return null;
      });
      chartRef.current = null;
    };
  }, [ChartUIComponent]);

  useEffect(() => {
    const chartInstance = chartRef.current;
    if (!chartInstance) {
      return;
    }

    chartInstance.applyChartTheme(runtimeTheme, themeVariant);
  }, [themeUpdateKey, chart]);

  useEffect(() => {
    if (!sceneApplyKey) {
      return;
    }

    const chartInstance = chartRef.current;
    if (!chartInstance || !onChartReadyRef.current) {
      return;
    }

    void onChartReadyRef.current(chartInstance);
  }, [sceneApplyKey]);

  const ChartUIPreview = ChartUIComponent;
  const isChartLoading = chartUiLoading || (!!ChartUIPreview && !chart && !previewError);

  return (
    <DocChartEmbed
      {...(className ? { className } : {})}
      minHeight={minHeight}
      height={minHeight}
      background={chartColors.background}
      padded
      loading={isChartLoading}
      error={previewError}
      loadingLabel="Loading chart preview…"
    >
      {ChartUIPreview ? (
        <ChartUIPreview chart={chart} theme={activeUiTheme}>
          <div ref={containerRef} className={docChartEmbedStyles.canvas} />
        </ChartUIPreview>
      ) : (
        <div ref={containerRef} className={docChartEmbedStyles.canvas} />
      )}
    </DocChartEmbed>
  );
}
