import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { docsInterval } from "../chartExampleData";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import { alignDocsChartViewport } from "../docsChartTheme";
import {
  applyChartSettingsPreset,
  buildChartSettingsPresetUiTheme,
} from "./applyChartSettingsPreset";
import {
  type ChartColorKey,
  type UiColorKey,
  type ThemeVariant,
  type VariantPalette,
  buildChartAppearanceSettings,
  buildChartTheme,
  buildUiTheme,
  createPlaygroundChartModel,
  previewCandles,
  previewInstrument,
} from "./core";
import { loadChartUI } from "@site/src/utils/loadChartUI";

export type ChartSceneAction = (chart: ChartInstance) => void | Promise<void>;

type ChartThemePreviewProps = {
  chartColorsByVariant: VariantPalette<ChartColorKey>;
  uiColorsByVariant: VariantPalette<UiColorKey>;
  themeVariant: ThemeVariant;
  /** When set, applies the full Chart Settings preset template (step 1). */
  presetId?: string | undefined;
  usePresetTemplate?: boolean | undefined;
  /** When this key changes, `onChartReady` runs again on the existing chart instance. */
  sceneApplyKey?: string | null | undefined;
  onChartReady?: ChartSceneAction | undefined;
  /** Fires when the live chart instance mounts or is destroyed. */
  onChartInstance?: ((chart: ChartInstance | null) => void) | undefined;
  minHeight?: number;
  aspectRatio?: string | undefined;
  /** When true, sizing is controlled by `className` CSS (no inline height/aspect-ratio). */
  fluidSize?: boolean;
  className?: string | undefined;
};

export default function ChartThemePreview({
  chartColorsByVariant,
  uiColorsByVariant,
  themeVariant,
  presetId,
  usePresetTemplate = false,
  sceneApplyKey,
  onChartReady,
  onChartInstance,
  minHeight = 520,
  aspectRatio,
  fluidSize = false,
  className,
}: ChartThemePreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const onChartReadyRef = useRef(onChartReady);
  const onChartInstanceRef = useRef(onChartInstance);
  const sceneApplyKeyRef = useRef(sceneApplyKey);
  const sceneApplyQueueRef = useRef(Promise.resolve());
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
  const presetUiTheme = useMemo(
    () => (usePresetTemplate && presetId ? buildChartSettingsPresetUiTheme(presetId) : null),
    [presetId, usePresetTemplate],
  );
  const activeUiTheme = presetUiTheme ?? uiThemes[themeVariant];
  const themeUpdateKey = useMemo(
    () => JSON.stringify({ runtimeTheme, themeVariant, presetId, usePresetTemplate }),
    [presetId, runtimeTheme, themeVariant, usePresetTemplate],
  );

  useEffect(() => {
    onChartReadyRef.current = onChartReady;
  }, [onChartReady]);

  useEffect(() => {
    onChartInstanceRef.current = onChartInstance;
  }, [onChartInstance]);

  useEffect(() => {
    sceneApplyKeyRef.current = sceneApplyKey;
  }, [sceneApplyKey]);

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
      onChartInstanceRef.current?.(null);

      const chartModule = await import("@efixdata/exeria-chart");
      if (disposed) {
        return;
      }

      const chartInstance = chartModule.createChart({
        container,
        instrument: previewInstrument,
        model: createPlaygroundChartModel(),
        theme: runtimeTheme,
        themeVariant,
      });

      try {
        chartInstance.init();
        await chartInstance.setMainSeriesData(previewCandles, docsInterval, false);
        chartInstance.setMainDrawMode("OHLC");
        await alignDocsChartViewport(chartInstance);

        if (onChartReadyRef.current) {
          await onChartReadyRef.current(chartInstance);
        }

        if (disposed) {
          chartInstance.destroy();
          return;
        }

        chartRef.current = chartInstance;
        setChart(chartInstance);
        onChartInstanceRef.current?.(chartInstance);
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
      onChartInstanceRef.current?.(null);
    };
  }, [ChartUIComponent]);

  useEffect(() => {
    const chartInstance = chartRef.current;
    if (!chartInstance) {
      return;
    }

    if (usePresetTemplate && presetId) {
      applyChartSettingsPreset(chartInstance, presetId);
      chartInstance.applyChartTheme(runtimeTheme, themeVariant);
      return;
    }

    chartInstance.applyChartTheme(runtimeTheme, themeVariant);
    chartInstance.applyChartAppearanceSettings(
      buildChartAppearanceSettings(chartColors, themeVariant),
    );
  }, [themeUpdateKey, chart, chartColors, presetId, themeVariant, usePresetTemplate]);

  useEffect(() => {
    if (!sceneApplyKey) {
      return;
    }

    const chartInstance = chartRef.current;
    const sceneAction = onChartReadyRef.current;
    if (!chartInstance || !sceneAction) {
      return;
    }

    const requestedKey = sceneApplyKey;

    sceneApplyQueueRef.current = sceneApplyQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (sceneApplyKeyRef.current !== requestedKey) {
          return;
        }

        const activeChart = chartRef.current;
        const activeSceneAction = onChartReadyRef.current;
        if (!activeChart || !activeSceneAction) {
          return;
        }

        await activeSceneAction(activeChart);
      });
  }, [sceneApplyKey]);

  const ChartUIPreview = ChartUIComponent;
  const isChartLoading = chartUiLoading || (!!ChartUIPreview && !chart && !previewError);

  return (
    <DocChartEmbed
      {...(className ? { className } : {})}
      {...(fluidSize
        ? {}
        : aspectRatio
          ? { aspectRatio }
          : { minHeight, height: minHeight })}
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
